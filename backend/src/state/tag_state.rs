use crate::service::tag_service::TagService;

#[derive(Clone)]
pub struct TagState {
    pub service: TagService,
}

impl TagState {
    pub fn new(service: TagService) -> Self {
        Self { service }
    }
}
