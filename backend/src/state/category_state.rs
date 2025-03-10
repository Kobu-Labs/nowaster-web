use crate::service::category_service::CategoryService;

#[derive(Clone)]
pub struct CategoryState {
    pub service: CategoryService,
}

impl CategoryState {
    pub fn new(service: CategoryService) -> Self {
        Self { service }
    }
}
