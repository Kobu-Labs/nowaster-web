use crate::service::user_service::UserService;

#[derive(Clone)]
pub struct UserState {
    pub service: UserService,
}

impl UserState {
    pub fn new(service: UserService) -> Self {
        Self { service }
    }
}
