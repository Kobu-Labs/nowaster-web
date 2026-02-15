use chrono::{DateTime, Duration, Local, Utc};
use rand::{rngs::StdRng, Rng, SeedableRng};
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::seeding::{config::SandboxConfig, data::{UsecaseProfile, COLORS, PROFILES}};

struct InsertedCategory {
    id: Uuid,
    name: String,
    color: String,
}

struct InsertedTag {
    id: Uuid,
}

struct InsertedTask {
    id: Uuid,
    name: String,
}

struct InsertedProject {
    id: Uuid,
    name: String,
    color: String,
    tasks: Vec<InsertedTask>,
}

struct ProfileData {
    categories: Vec<InsertedCategory>,
    tag_ids: Vec<Uuid>,
    projects: Vec<InsertedProject>,
}

struct SessionRow {
    id: Uuid,
    category_id: Uuid,
    start_time: DateTime<Utc>,
    end_time: DateTime<Utc>,
    project_id: Option<Uuid>,
    task_id: Option<Uuid>,
    template_id: Option<Uuid>,
}

pub async fn seed_guest_user(
    pool: &PgPool,
    user_id: &str,
    npc_ids: &[String],
) -> Result<(), sqlx::Error> {
    let mut rng = StdRng::from_entropy();

    let profile_count = rng.gen_range(SandboxConfig::GUEST_PROFILES_MIN..=SandboxConfig::GUEST_PROFILES_MAX);
    let mut all_indices: Vec<usize> = (0..PROFILES.len()).collect();
    for i in 0..all_indices.len() {
        let j = rng.gen_range(i..all_indices.len());
        all_indices.swap(i, j);
    }
    let selected: Vec<usize> = all_indices.into_iter().take(profile_count).collect();

    let mut profiles_data: Vec<ProfileData> = Vec::new();
    for &pi in &selected {
        let pd = insert_profile_data(pool, user_id, &PROFILES[pi], &mut rng).await?;
        profiles_data.push(pd);
    }

    generate_and_insert_sessions(pool, user_id, &profiles_data, &mut rng).await?;
    complete_one_project(pool, user_id, &profiles_data, &mut rng).await?;
    create_session_template(pool, user_id, &profiles_data, &mut rng).await?;

    if !npc_ids.is_empty() {
        link_npc_friends_and_subscriptions(pool, user_id, npc_ids).await?;
    }

    Ok(())
}

async fn insert_profile_data(
    pool: &PgPool,
    user_id: &str,
    profile: &UsecaseProfile,
    rng: &mut impl Rng,
) -> Result<ProfileData, sqlx::Error> {
    let mut categories = Vec::new();
    for &cat_name in profile.categories {
        let color = COLORS[rng.gen_range(0..COLORS.len())];
        let id: Uuid = sqlx::query_scalar(
            r#"INSERT INTO category (name, created_by, color) VALUES ($1, $2, $3)
               ON CONFLICT (name, created_by) DO UPDATE SET color = EXCLUDED.color
               RETURNING id"#,
        )
        .bind(cat_name)
        .bind(user_id)
        .bind(color)
        .fetch_one(pool)
        .await?;
        categories.push(InsertedCategory {
            id,
            name: cat_name.to_string(),
            color: color.to_string(),
        });
    }

    let mut tag_ids = Vec::new();
    for &tag_label in profile.tags {
        let color = COLORS[rng.gen_range(0..COLORS.len())];
        let id: Uuid = sqlx::query_scalar(
            r#"INSERT INTO tag (label, created_by, color) VALUES ($1, $2, $3) RETURNING id"#,
        )
        .bind(tag_label)
        .bind(user_id)
        .bind(color)
        .fetch_one(pool)
        .await?;
        tag_ids.push(id);
    }

    let mut projects = Vec::new();
    for proj_seed in profile.projects {
        let color = COLORS[rng.gen_range(0..COLORS.len())];
        let proj_id: Uuid = sqlx::query_scalar(
            r#"INSERT INTO project (name, color, user_id) VALUES ($1, $2, $3) RETURNING id"#,
        )
        .bind(proj_seed.name)
        .bind(color)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        let mut tasks = Vec::new();
        for &task_name in proj_seed.tasks {
            let completed = rng.gen_bool(SandboxConfig::TASK_INITIAL_COMPLETION_CHANCE);
            let task_id: Uuid = sqlx::query_scalar(
                r#"INSERT INTO task (project_id, name, user_id, completed) VALUES ($1, $2, $3, $4) RETURNING id"#,
            )
            .bind(proj_id)
            .bind(task_name)
            .bind(user_id)
            .bind(completed)
            .fetch_one(pool)
            .await?;
            tasks.push(InsertedTask {
                id: task_id,
                name: task_name.to_string(),
            });
        }

        projects.push(InsertedProject {
            id: proj_id,
            name: proj_seed.name.to_string(),
            color: color.to_string(),
            tasks,
        });
    }

    Ok(ProfileData {
        categories,
        tag_ids,
        projects,
    })
}

async fn generate_and_insert_sessions(
    pool: &PgPool,
    user_id: &str,
    profiles_data: &[ProfileData],
    rng: &mut impl Rng,
) -> Result<(), sqlx::Error> {
    if profiles_data.is_empty() {
        return Ok(());
    }

    let now = Utc::now();
    let mut sessions: Vec<SessionRow> = Vec::new();
    let mut tag_links: Vec<(Uuid, Uuid)> = Vec::new();

    for week in 0u32..SandboxConfig::GUEST_SESSION_HISTORY_WEEKS {
        let base = now - Duration::weeks(week as i64);
        let count = rng.gen_range(SandboxConfig::GUEST_SESSIONS_PER_WEEK_MIN..=SandboxConfig::GUEST_SESSIONS_PER_WEEK_MAX);
        let pd = &profiles_data[rng.gen_range(0..profiles_data.len())];

        if pd.categories.is_empty() {
            continue;
        }

        for _ in 0..count {
            let day_offset = rng.gen_range(0i64..7);
            let hour_start = rng.gen_range(SandboxConfig::SESSION_START_HOUR_MIN..SandboxConfig::SESSION_START_HOUR_MAX);
            let duration_min = rng.gen_range(SandboxConfig::SESSION_DURATION_MIN_MINS..SandboxConfig::SESSION_DURATION_MAX_MINS);
            let start = base - Duration::days(day_offset) + Duration::hours(hour_start);
            let end = start + Duration::minutes(duration_min);
            let cat = &pd.categories[rng.gen_range(0..pd.categories.len())];

            let roll: f64 = rng.gen();
            let (project_id, task_id) = if roll < SandboxConfig::SESSION_TASK_PROJECT_WEIGHT && !pd.projects.is_empty() {
                let proj = &pd.projects[rng.gen_range(0..pd.projects.len())];
                if !proj.tasks.is_empty() {
                    let task = &proj.tasks[rng.gen_range(0..proj.tasks.len())];
                    (Some(proj.id), Some(task.id))
                } else {
                    (Some(proj.id), None)
                }
            } else if roll < SandboxConfig::SESSION_PROJECT_WEIGHT && !pd.projects.is_empty() {
                let proj = &pd.projects[rng.gen_range(0..pd.projects.len())];
                (Some(proj.id), None)
            } else {
                (None, None)
            };

            let sid = Uuid::new_v4();
            if rng.gen_bool(SandboxConfig::SESSION_TAG_CHANCE) && !pd.tag_ids.is_empty() {
                let tag_count = rng.gen_range(1..=pd.tag_ids.len().min(SandboxConfig::SESSION_TAGS_MAX));
                let mut indices: Vec<usize> = (0..pd.tag_ids.len()).collect();
                for i in 0..indices.len() {
                    let j = rng.gen_range(i..indices.len());
                    indices.swap(i, j);
                }
                for &ti in indices.iter().take(tag_count) {
                    tag_links.push((sid, pd.tag_ids[ti]));
                }
            }

            sessions.push(SessionRow {
                id: sid,
                category_id: cat.id,
                start_time: start,
                end_time: end,
                project_id,
                task_id,
                template_id: None,
            });
        }
    }

    bulk_insert_sessions(pool, user_id, &sessions).await?;
    bulk_insert_tag_links(pool, &tag_links).await?;
    Ok(())
}

async fn bulk_insert_sessions(
    pool: &PgPool,
    user_id: &str,
    sessions: &[SessionRow],
) -> Result<(), sqlx::Error> {
    if sessions.is_empty() {
        return Ok(());
    }
    for chunk in sessions.chunks(SandboxConfig::BULK_SESSION_CHUNK_SIZE) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO session (id, category_id, type, start_time, end_time, user_id, project_id, task_id, template_id) ",
        );
        qb.push_values(chunk.iter(), |mut b, s| {
            b.push_bind(s.id)
                .push_bind(s.category_id)
                .push_bind("fixed")
                .push_bind(s.start_time)
                .push_bind(s.end_time)
                .push_bind(user_id)
                .push_bind(s.project_id)
                .push_bind(s.task_id)
                .push_bind(s.template_id);
        });
        qb.build().execute(pool).await?;
    }
    Ok(())
}

async fn bulk_insert_tag_links(pool: &PgPool, links: &[(Uuid, Uuid)]) -> Result<(), sqlx::Error> {
    if links.is_empty() {
        return Ok(());
    }
    for chunk in links.chunks(SandboxConfig::BULK_TAG_LINK_CHUNK_SIZE) {
        let mut qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO tag_to_session (session_id, tag_id) ");
        qb.push_values(chunk.iter(), |mut b, (sid, tid)| {
            b.push_bind(*sid).push_bind(*tid);
        });
        qb.build().execute(pool).await?;
    }
    Ok(())
}

async fn complete_one_project(
    pool: &PgPool,
    user_id: &str,
    profiles_data: &[ProfileData],
    rng: &mut impl Rng,
) -> Result<(), sqlx::Error> {
    let all_projects: Vec<(usize, usize)> = profiles_data
        .iter()
        .enumerate()
        .flat_map(|(pi, pd)| pd.projects.iter().enumerate().map(move |(prji, _)| (pi, prji)))
        .collect();

    if all_projects.is_empty() {
        return Ok(());
    }

    let (pi, prji) = all_projects[rng.gen_range(0..all_projects.len())];
    let project = &profiles_data[pi].projects[prji];
    let now = Utc::now();

    for task in &project.tasks {
        sqlx::query("UPDATE task SET completed = true WHERE id = $1 AND user_id = $2")
            .bind(task.id)
            .bind(user_id)
            .execute(pool)
            .await?;

        let hours: f64 = rng.gen_range(SandboxConfig::TASK_COMPLETION_HOURS_MIN..SandboxConfig::TASK_COMPLETION_HOURS_MAX);
        let event_data = serde_json::json!({
            "task_id": task.id,
            "task_name": task.name,
            "task_description": null,
            "hours_of_work": hours,
            "project": {
                "id": project.id,
                "name": project.name,
                "color": project.color,
                "image_url": null
            }
        });
        sqlx::query(
            "INSERT INTO feed_event (id, source_type, source_id, event_type, event_data)
             VALUES ($1, 'user'::feed_source_type, $2, 'task_completed'::feed_event_type, $3)",
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(event_data)
        .execute(pool)
        .await?;
    }

    sqlx::query("UPDATE project SET completed = true WHERE id = $1 AND user_id = $2")
        .bind(project.id)
        .bind(user_id)
        .execute(pool)
        .await?;

    let tasks_breakdown: Vec<serde_json::Value> = project
        .tasks
        .iter()
        .map(|t| {
            serde_json::json!({
                "task_id": t.id,
                "task_name": t.name,
                "minutes": rng.gen_range(SandboxConfig::PROJECT_TASK_MINUTES_MIN..SandboxConfig::PROJECT_TASK_MINUTES_MAX)
            })
        })
        .collect();

    let event_data = serde_json::json!({
        "project_id": project.id,
        "project_name": project.name,
        "project_color": project.color,
        "project_image_url": null,
        "created_at": now.with_timezone(&Local).to_rfc3339(),
        "total_sessions": rng.gen_range(SandboxConfig::PROJECT_TOTAL_SESSIONS_MIN..SandboxConfig::PROJECT_TOTAL_SESSIONS_MAX),
        "tasks_time_breakdown": tasks_breakdown,
        "categories_time_breakdown": []
    });
    sqlx::query(
        "INSERT INTO feed_event (id, source_type, source_id, event_type, event_data)
         VALUES ($1, 'user'::feed_source_type, $2, 'project_completed'::feed_event_type, $3)",
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(event_data)
    .execute(pool)
    .await?;

    Ok(())
}

async fn create_session_template(
    pool: &PgPool,
    user_id: &str,
    profiles_data: &[ProfileData],
    rng: &mut impl Rng,
) -> Result<(), sqlx::Error> {
    let pd = match profiles_data.first() {
        Some(pd) if !pd.categories.is_empty() => pd,
        _ => return Ok(()),
    };

    let now = Utc::now();
    let start_date = now - Duration::weeks(SandboxConfig::TEMPLATE_HISTORY_WEEKS);
    let end_date = now + Duration::weeks(SandboxConfig::TEMPLATE_FUTURE_WEEKS);

    let template_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO session_template (name, user_id, interval, start_date, end_date)
           VALUES ($1, $2, 'weekly'::recurring_session_interval, $3, $4)
           RETURNING id"#,
    )
    .bind("Weekly Focus Sessions")
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_one(pool)
    .await?;

    let offsets: &[(f64, f64)] = &[
        (540.0, 600.0),    // Mon 09:00–10:00
        (3720.0, 3840.0),  // Wed 14:00–16:00
        (6360.0, 6480.0),  // Fri 10:00–12:00
        (1560.0, 1680.0),  // Tue 02:00–04:00
    ];
    let recurring_count = rng.gen_range(SandboxConfig::TEMPLATE_RECURRING_MIN..=SandboxConfig::TEMPLATE_RECURRING_MAX);

    for &(start_off, end_off) in offsets.iter().take(recurring_count) {
        let cat = &pd.categories[rng.gen_range(0..pd.categories.len())];
        sqlx::query(
            "INSERT INTO recurring_session (template_id, start_minute_offset, end_minute_offset, category_id, user_id)
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(template_id)
        .bind(start_off)
        .bind(end_off)
        .bind(cat.id)
        .bind(user_id)
        .execute(pool)
        .await?;
    }

    let mut template_sessions: Vec<SessionRow> = Vec::new();
    for week in 1u32..=SandboxConfig::TEMPLATE_FILL_PAST_WEEKS {
        let base = now - Duration::weeks(week as i64);
        for &(start_off, end_off) in offsets.iter().take(recurring_count) {
            let start = base + Duration::minutes(start_off as i64);
            let end = base + Duration::minutes(end_off as i64);
            let cat = &pd.categories[rng.gen_range(0..pd.categories.len())];
            template_sessions.push(SessionRow {
                id: Uuid::new_v4(),
                category_id: cat.id,
                start_time: start,
                end_time: end,
                project_id: None,
                task_id: None,
                template_id: Some(template_id),
            });
        }
    }
    bulk_insert_sessions(pool, user_id, &template_sessions).await?;

    Ok(())
}

async fn link_npc_friends_and_subscriptions(
    pool: &PgPool,
    user_id: &str,
    npc_ids: &[String],
) -> Result<(), sqlx::Error> {
    for npc_id in npc_ids {
        sqlx::query(
            "INSERT INTO friend (id, friend_1_id, friend_2_id) VALUES ($1, $2, $3)",
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(npc_id)
        .execute(pool)
        .await?;

        sqlx::query(
            "INSERT INTO feed_subscription (id, subscriber_id, source_type, source_id)
             VALUES ($1, $2, 'user'::feed_source_type, $3)
             ON CONFLICT (subscriber_id, source_type, source_id) DO NOTHING",
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(npc_id)
        .execute(pool)
        .await?;
    }
    Ok(())
}
