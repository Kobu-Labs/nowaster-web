use chrono::{DateTime, Duration, Local, Utc};
use rand::{rngs::StdRng, Rng, SeedableRng};
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::seeding::data::{COLORS, NPC_NAMES, PROFILES};

pub async fn seed_npc_users(pool: &PgPool, count: usize) -> Result<Vec<String>, sqlx::Error> {
    let mut rng = StdRng::from_entropy();
    let mut npc_ids = Vec::new();

    // Shuffle names so each reset gets a different order
    let mut name_indices: Vec<usize> = (0..NPC_NAMES.len()).collect();
    for i in 0..name_indices.len() {
        let j = rng.gen_range(i..name_indices.len());
        name_indices.swap(i, j);
    }

    for idx in 0..count {
        let npc_uuid = Uuid::new_v4();
        let npc_id = format!("npc_{}", npc_uuid.simple());
        let email = format!("{}@sandbox.nowaster.app", npc_id);
        let display_name = NPC_NAMES[name_indices[idx % NPC_NAMES.len()]].to_string();

        sqlx::query(
            r#"INSERT INTO "user" (id, displayname, email, role, created_at)
               VALUES ($1, $2, $3, 'user', NOW())"#,
        )
        .bind(&npc_id)
        .bind(&display_name)
        .bind(&email)
        .execute(pool)
        .await?;

        let profile_idx = rng.gen_range(0..PROFILES.len());
        let profile = &PROFILES[profile_idx];

        let mut categories: Vec<(Uuid, String, String)> = Vec::new();
        for &cat_name in profile.categories {
            let color = COLORS[rng.gen_range(0..COLORS.len())];
            let id: Uuid = sqlx::query_scalar(
                "INSERT INTO category (name, created_by, color) VALUES ($1, $2, $3)
                 ON CONFLICT (name, created_by) DO UPDATE SET color = EXCLUDED.color
                 RETURNING id",
            )
            .bind(cat_name)
            .bind(&npc_id)
            .bind(color)
            .fetch_one(pool)
            .await?;
            categories.push((id, cat_name.to_string(), color.to_string()));
        }

        // Keep full tag info (id, label, color) for use in feed event JSON
        let mut tags: Vec<(Uuid, String, String)> = Vec::new();
        for &tag_label in profile.tags {
            let color = COLORS[rng.gen_range(0..COLORS.len())];
            let id: Uuid = sqlx::query_scalar(
                "INSERT INTO tag (label, created_by, color) VALUES ($1, $2, $3) RETURNING id",
            )
            .bind(tag_label)
            .bind(&npc_id)
            .bind(color)
            .fetch_one(pool)
            .await?;
            tags.push((id, tag_label.to_string(), color.to_string()));
        }

        let now = Utc::now();
        // session entry: (id, cat_id, start, end)
        let mut sessions: Vec<(Uuid, Uuid, DateTime<Utc>, DateTime<Utc>)> = Vec::new();
        // parallel: tags applied to each session
        let mut session_tags: Vec<Vec<(Uuid, String, String)>> = Vec::new();
        let mut tag_links: Vec<(Uuid, Uuid)> = Vec::new();

        if !categories.is_empty() {
            for week in 0u32..13 {
                let base = now - Duration::weeks(week as i64);
                let week_count = rng.gen_range(2usize..=4);
                for _ in 0..week_count {
                    let day_offset = rng.gen_range(0i64..7);
                    let hour_start = rng.gen_range(7i64..21);
                    let duration_min = rng.gen_range(30i64..240);
                    let start =
                        base - Duration::days(day_offset) + Duration::hours(hour_start);
                    let end = start + Duration::minutes(duration_min);
                    let cat = &categories[rng.gen_range(0..categories.len())];
                    let sid = Uuid::new_v4();

                    let mut applied_tags: Vec<(Uuid, String, String)> = Vec::new();
                    if rng.gen_bool(0.5) && !tags.is_empty() {
                        let tag_count = rng.gen_range(1..=tags.len().min(2));
                        let mut indices: Vec<usize> = (0..tags.len()).collect();
                        for i in 0..indices.len() {
                            let j = rng.gen_range(i..indices.len());
                            indices.swap(i, j);
                        }
                        for &ti in indices.iter().take(tag_count) {
                            tag_links.push((sid, tags[ti].0));
                            applied_tags.push(tags[ti].clone());
                        }
                    }

                    sessions.push((sid, cat.0, start, end));
                    session_tags.push(applied_tags);
                }
            }

            if !sessions.is_empty() {
                let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
                    "INSERT INTO session (id, category_id, type, start_time, end_time, user_id) ",
                );
                qb.push_values(sessions.iter(), |mut b, s| {
                    b.push_bind(s.0)
                        .push_bind(s.1)
                        .push_bind("fixed")
                        .push_bind(s.2)
                        .push_bind(s.3)
                        .push_bind(&npc_id);
                });
                qb.build().execute(pool).await?;
            }

            if !tag_links.is_empty() {
                let mut qb: QueryBuilder<Postgres> =
                    QueryBuilder::new("INSERT INTO tag_to_session (session_id, tag_id) ");
                qb.push_values(tag_links.iter(), |mut b, (sid, tid)| {
                    b.push_bind(*sid).push_bind(*tid);
                });
                qb.build().execute(pool).await?;
            }
        }

        insert_npc_session_feed_events(
            pool,
            &npc_id,
            &sessions,
            &categories,
            &session_tags,
        )
        .await?;

        if rng.gen_bool(0.5) && !profile.projects.is_empty() {
            let proj_count = rng.gen_range(1..=profile.projects.len().min(2));
            for pi in 0..proj_count {
                let proj_seed = &profile.projects[pi];
                let color = COLORS[rng.gen_range(0..COLORS.len())];

                let proj_id: Uuid = sqlx::query_scalar(
                    "INSERT INTO project (name, color, user_id, completed) VALUES ($1, $2, $3, true) RETURNING id",
                )
                .bind(proj_seed.name)
                .bind(color)
                .bind(&npc_id)
                .fetch_one(pool)
                .await?;

                let mut tasks: Vec<(Uuid, String)> = Vec::new();
                for &task_name in proj_seed.tasks {
                    let task_id: Uuid = sqlx::query_scalar(
                        "INSERT INTO task (project_id, name, user_id, completed) VALUES ($1, $2, $3, true) RETURNING id",
                    )
                    .bind(proj_id)
                    .bind(task_name)
                    .bind(&npc_id)
                    .fetch_one(pool)
                    .await?;
                    tasks.push((task_id, task_name.to_string()));

                    let hours: f64 = rng.gen_range(3.0..20.0);
                    let event_data = serde_json::json!({
                        "task_id": task_id,
                        "task_name": task_name,
                        "task_description": null,
                        "hours_of_work": hours,
                        "project": {
                            "id": proj_id,
                            "name": proj_seed.name,
                            "color": color,
                            "image_url": null
                        }
                    });
                    sqlx::query(
                        "INSERT INTO feed_event (id, source_type, source_id, event_type, event_data)
                         VALUES ($1, 'user'::feed_source_type, $2, 'task_completed'::feed_event_type, $3)",
                    )
                    .bind(Uuid::new_v4())
                    .bind(&npc_id)
                    .bind(event_data)
                    .execute(pool)
                    .await?;
                }

                let tasks_breakdown: Vec<serde_json::Value> = tasks
                    .iter()
                    .map(|(tid, tname)| {
                        serde_json::json!({
                            "task_id": tid,
                            "task_name": tname,
                            "minutes": rng.gen_range(60.0f64..400.0)
                        })
                    })
                    .collect();

                let event_data = serde_json::json!({
                    "project_id": proj_id,
                    "project_name": proj_seed.name,
                    "project_color": color,
                    "project_image_url": null,
                    "created_at": Utc::now().with_timezone(&Local).to_rfc3339(),
                    "total_sessions": rng.gen_range(10i64..50),
                    "tasks_time_breakdown": tasks_breakdown,
                    "categories_time_breakdown": []
                });
                sqlx::query(
                    "INSERT INTO feed_event (id, source_type, source_id, event_type, event_data)
                     VALUES ($1, 'user'::feed_source_type, $2, 'project_completed'::feed_event_type, $3)",
                )
                .bind(Uuid::new_v4())
                .bind(&npc_id)
                .bind(event_data)
                .execute(pool)
                .await?;
            }
        }

        npc_ids.push(npc_id);
    }

    Ok(npc_ids)
}

async fn insert_npc_session_feed_events(
    pool: &PgPool,
    npc_id: &str,
    sessions: &[(Uuid, Uuid, DateTime<Utc>, DateTime<Utc>)],
    categories: &[(Uuid, String, String)],
    session_tags: &[Vec<(Uuid, String, String)>],
) -> Result<(), sqlx::Error> {
    for (i, &(session_id, cat_id, start, end)) in sessions.iter().enumerate() {
        let (cat_name, cat_color) = categories
            .iter()
            .find(|c| c.0 == cat_id)
            .map(|c| (c.1.as_str(), c.2.as_str()))
            .unwrap_or(("Unknown", "#888888"));

        let tags_json: Vec<serde_json::Value> = session_tags[i]
            .iter()
            .map(|(tid, label, color)| {
                serde_json::json!({ "id": tid, "label": label, "color": color })
            })
            .collect();

        let event_data = serde_json::json!({
            "session_id": session_id,
            "category": { "id": cat_id, "name": cat_name, "color": cat_color },
            "tags": tags_json,
            "description": null,
            "start_time": start.with_timezone(&Local).to_rfc3339(),
            "end_time": end.with_timezone(&Local).to_rfc3339(),
            "project": null,
            "task": null
        });

        sqlx::query(
            "INSERT INTO feed_event (id, source_type, source_id, event_type, event_data)
             VALUES ($1, 'user'::feed_source_type, $2, 'session_completed'::feed_event_type, $3)",
        )
        .bind(Uuid::new_v4())
        .bind(npc_id)
        .bind(event_data)
        .execute(pool)
        .await?;
    }
    Ok(())
}
