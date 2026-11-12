use thiserror::Error;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::block_rule::rule::{normalize_pattern, ReadBlockRuleDto},
    repository::block_rule::BlockRuleRepository,
    router::clerk::Actor,
};

#[derive(Debug, Error)]
pub enum BlockRuleError {
    #[error("Block rule already exists")]
    Duplicate,
    #[error("Block rule not found")]
    NotFound,
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

#[derive(Clone)]
pub struct BlockRuleService {
    repo: BlockRuleRepository,
}

impl BlockRuleService {
    pub fn new(repo: BlockRuleRepository) -> Self {
        Self { repo }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn list(&self, actor: &Actor) -> Result<Vec<ReadBlockRuleDto>, BlockRuleError> {
        let rules = self.repo.list(actor).await?;
        Ok(rules.into_iter().map(ReadBlockRuleDto::from).collect())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn create(
        &self,
        pattern: &str,
        actor: &Actor,
    ) -> Result<ReadBlockRuleDto, BlockRuleError> {
        let pattern = normalize_pattern(pattern);
        self.repo
            .create(&pattern, actor)
            .await?
            .map(ReadBlockRuleDto::from)
            .ok_or(BlockRuleError::Duplicate)
    }

    #[instrument(err, skip(self), fields(actor = %actor, rule_id = %id))]
    pub async fn delete(&self, id: Uuid, actor: &Actor) -> Result<(), BlockRuleError> {
        if self.repo.delete(id, actor).await? {
            Ok(())
        } else {
            Err(BlockRuleError::NotFound)
        }
    }
}
