use rand::{rngs::StdRng, Rng, SeedableRng};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    entity::community::{CommunityDataVisibility, CommunityMemberRole, CommunityVisibilityType},
    seeding::data::COLORS,
};

const INVITE_CODE_LENGTH: usize = 10;
const INVITE_CODE_ALPHABET: &[u8] = b"ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const MEMBERS_PER_COMMUNITY_MAX: usize = 9;

struct CommunityArchetype {
    name: &'static str,
    description: &'static str,
    visibility_type: CommunityVisibilityType,
    data_visibility: CommunityDataVisibility,
    // Matches category names from seeding::data::PROFILES so mappings can
    // attach to categories/sessions that already exist for seeded members.
    tracked_categories: &'static [&'static str],
}

static ARCHETYPES: &[CommunityArchetype] = &[
    CommunityArchetype {
        name: "Deep Work Collective",
        description: "Focused-work accountability for people who take deep work seriously.",
        visibility_type: CommunityVisibilityType::Public,
        data_visibility: CommunityDataVisibility::Public,
        tracked_categories: &["Coding", "Deep Work", "Planning"],
    },
    CommunityArchetype {
        name: "Study Grind",
        description: "Students holding each other accountable for study hours.",
        visibility_type: CommunityVisibilityType::InviteOnly,
        data_visibility: CommunityDataVisibility::MembersOnly,
        tracked_categories: &["Study", "Research", "Reading"],
    },
    CommunityArchetype {
        name: "Marathon Prep Squad",
        description: "Training logs for a shared upcoming marathon.",
        visibility_type: CommunityVisibilityType::Public,
        data_visibility: CommunityDataVisibility::Public,
        tracked_categories: &["Exercise", "Health"],
    },
    CommunityArchetype {
        name: "Writers' Room",
        description: "Daily writing accountability group.",
        visibility_type: CommunityVisibilityType::InviteOnly,
        data_visibility: CommunityDataVisibility::MembersOnly,
        tracked_categories: &["Writing", "Research"],
    },
];

fn generate_invite_code(rng: &mut impl Rng) -> String {
    (0..INVITE_CODE_LENGTH)
        .map(|_| {
            let idx = rng.gen_range(0..INVITE_CODE_ALPHABET.len());
            INVITE_CODE_ALPHABET[idx] as char
        })
        .collect()
}

fn shuffled_indices(len: usize, rng: &mut impl Rng) -> Vec<usize> {
    let mut indices: Vec<usize> = (0..len).collect();
    for i in 0..indices.len() {
        let j = rng.gen_range(i..indices.len());
        indices.swap(i, j);
    }
    indices
}

/// Creates a handful of demo communities across `member_ids`: a mix of
/// public/invite-only visibility, real membership, invite codes, tracked
/// categories, and category mappings against each member's existing
/// personal categories (so the dashboard aggregation has real minutes to
/// show instead of empty state). Requires at least 2 member ids; a no-op
/// otherwise.
pub async fn seed_communities(
    pool: &PgPool,
    member_ids: &[String],
) -> Result<Vec<Uuid>, sqlx::Error> {
    if member_ids.len() < 2 {
        return Ok(Vec::new());
    }

    let mut rng = StdRng::from_entropy();
    let mut community_ids = Vec::new();

    for archetype in ARCHETYPES {
        let indices = shuffled_indices(member_ids.len(), &mut rng);
        let owner_id = &member_ids[indices[0]];

        let member_count = rng.gen_range(2..=member_ids.len().min(MEMBERS_PER_COMMUNITY_MAX));
        let community_member_ids: Vec<&String> = indices[..member_count]
            .iter()
            .map(|&i| &member_ids[i])
            .collect();

        let community_id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO "community" (name, description, visibility_type, data_visibility, owner_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind(archetype.name)
        .bind(archetype.description)
        .bind(archetype.visibility_type)
        .bind(archetype.data_visibility)
        .bind(owner_id)
        .fetch_one(pool)
        .await?;

        for member_id in &community_member_ids {
            let role = if *member_id == owner_id {
                CommunityMemberRole::Owner
            } else {
                CommunityMemberRole::Member
            };
            sqlx::query(
                r#"INSERT INTO "community_member" (community_id, user_id, role)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (community_id, user_id) DO NOTHING"#,
            )
            .bind(community_id)
            .bind(*member_id)
            .bind(role)
            .execute(pool)
            .await?;
        }

        if archetype.visibility_type == CommunityVisibilityType::InviteOnly {
            let code = generate_invite_code(&mut rng);
            sqlx::query(
                r#"INSERT INTO "community_invite_code" (community_id, code, created_by)
                   VALUES ($1, $2, $3)"#,
            )
            .bind(community_id)
            .bind(&code)
            .bind(owner_id)
            .execute(pool)
            .await?;
        }

        let mut tracked_categories: Vec<(Uuid, &str)> = Vec::new();
        for &cat_name in archetype.tracked_categories {
            let color = COLORS[rng.gen_range(0..COLORS.len())];
            let tracked_id: Uuid = sqlx::query_scalar(
                r#"INSERT INTO "community_tracked_category" (community_id, name, color)
                   VALUES ($1, $2, $3)
                   RETURNING id"#,
            )
            .bind(community_id)
            .bind(cat_name)
            .bind(color)
            .fetch_one(pool)
            .await?;
            tracked_categories.push((tracked_id, cat_name));
        }

        for member_id in &community_member_ids {
            for (tracked_id, cat_name) in &tracked_categories {
                let personal_category_id: Option<Uuid> = sqlx::query_scalar(
                    r#"SELECT id FROM "category" WHERE created_by = $1 AND name = $2 LIMIT 1"#,
                )
                .bind(*member_id)
                .bind(cat_name)
                .fetch_optional(pool)
                .await?;

                let Some(personal_category_id) = personal_category_id else {
                    continue;
                };

                sqlx::query(
                    r#"INSERT INTO "community_category_mapping"
                       (community_id, tracked_category_id, user_id, personal_category_id)
                       VALUES ($1, $2, $3, $4)
                       ON CONFLICT (tracked_category_id, user_id, personal_category_id) DO NOTHING"#,
                )
                .bind(community_id)
                .bind(tracked_id)
                .bind(*member_id)
                .bind(personal_category_id)
                .execute(pool)
                .await?;
            }
        }

        community_ids.push(community_id);
    }

    Ok(community_ids)
}

#[cfg(test)]
mod tests {
    use sqlx::postgres::PgPoolOptions;

    use super::*;

    #[tokio::test]
    #[ignore = "hits a real local Postgres; run explicitly with `cargo test seed_communities_smoke -- --ignored --nocapture`"]
    async fn seed_communities_smoke() {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://devuser:devpass@localhost:5440/devdb".to_string());
        let pool = PgPoolOptions::new()
            .connect(&database_url)
            .await
            .expect("connect to local dev db");

        let user_a = format!("test_seed_{}", Uuid::new_v4().simple());
        let user_b = format!("test_seed_{}", Uuid::new_v4().simple());
        let member_ids = vec![user_a.clone(), user_b.clone()];

        for uid in &member_ids {
            sqlx::query(
                r#"INSERT INTO "user" (id, displayname, email, role, created_at)
                   VALUES ($1, $2, $3, 'user', NOW())"#,
            )
            .bind(uid)
            .bind("Seed Test User")
            .bind(format!("{uid}@test.local"))
            .execute(&pool)
            .await
            .expect("insert test user");

            sqlx::query(r#"INSERT INTO category (name, created_by, color) VALUES ('Coding', $1, '#3B82F6')"#)
                .bind(uid)
                .execute(&pool)
                .await
                .expect("insert test category");
        }

        let community_ids = seed_communities(&pool, &member_ids)
            .await
            .expect("seed_communities should succeed");

        assert_eq!(community_ids.len(), ARCHETYPES.len());

        let member_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM community_member WHERE user_id = ANY($1)")
                .bind(&member_ids)
                .fetch_one(&pool)
                .await
                .expect("count members");
        assert!(member_count > 0, "expected community_member rows");

        let mapping_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM community_category_mapping WHERE user_id = ANY($1)",
        )
        .bind(&member_ids)
        .fetch_one(&pool)
        .await
        .expect("count mappings");
        assert!(
            mapping_count > 0,
            "expected at least one Coding category mapping"
        );

        let invite_code_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM community_invite_code WHERE community_id = ANY($1)",
        )
        .bind(&community_ids)
        .fetch_one(&pool)
        .await
        .expect("count invite codes");
        assert!(
            invite_code_count > 0,
            "expected invite_only communities to get a code"
        );

        sqlx::query("DELETE FROM community WHERE id = ANY($1)")
            .bind(&community_ids)
            .execute(&pool)
            .await
            .expect("cleanup communities");
        sqlx::query("DELETE FROM category WHERE created_by = ANY($1)")
            .bind(&member_ids)
            .execute(&pool)
            .await
            .expect("cleanup categories");
        sqlx::query(r#"DELETE FROM "user" WHERE id = ANY($1)"#)
            .bind(&member_ids)
            .execute(&pool)
            .await
            .expect("cleanup users");
    }
}
