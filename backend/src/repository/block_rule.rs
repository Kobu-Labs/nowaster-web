use anyhow::Result;
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::block_rule::BlockRule,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct BlockRuleRepository {
    db_conn: Arc<Database>,
}

impl BlockRuleRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn list(&self, actor: &Actor) -> Result<Vec<BlockRule>> {
        let rows = sqlx::query_as!(
            BlockRule,
            r#"
            SELECT id, pattern, created_at
            FROM block_rule
            WHERE user_id = $1
            ORDER BY created_at ASC, id ASC
            "#,
            actor.user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }

    /// Inserts a rule. Returns `None` if the user already has this pattern.
    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn create(&self, pattern: &str, actor: &Actor) -> Result<Option<BlockRule>> {
        let row = sqlx::query_as!(
            BlockRule,
            r#"
            INSERT INTO block_rule (user_id, pattern)
            VALUES ($1, $2)
            ON CONFLICT (user_id, pattern) DO NOTHING
            RETURNING id, pattern, created_at
            "#,
            actor.user_id,
            pattern
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(row)
    }

    /// Deletes a rule owned by the actor. Returns whether a row was deleted.
    #[instrument(err, skip(self), fields(actor_id = %actor, rule_id = %id))]
    pub async fn delete(&self, id: Uuid, actor: &Actor) -> Result<bool> {
        let res = sqlx::query!(
            r#"
            DELETE FROM block_rule
            WHERE id = $1 AND user_id = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(res.rows_affected() > 0)
    }
}
