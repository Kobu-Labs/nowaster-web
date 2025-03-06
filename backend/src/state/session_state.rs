use crate::service::session_service::SessionService;

#[derive(Clone)]
pub struct SessionState {
    pub service: SessionService,
}

impl SessionState {
    pub fn new(service: SessionService) -> Self {
        Self { service }
    }
}
