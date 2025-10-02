use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Default, Validate)]
pub struct FilterSession {
    #[serde(rename = "user")]
    pub user_filter: Option<UserFilter>,
    #[serde(rename = "category")]
    pub category_filter: Option<CategoryFilter>,
    #[serde(rename = "tag")]
    pub tag_filter: Option<TagFilter>,
    #[serde(rename = "start_time")]
    pub start_time_filter: Option<DateFilter>,
    #[serde(rename = "end_time")]
    pub end_time_filter: Option<DateFilter>,
    #[serde(rename = "template")]
    pub template_filter: Option<TemplateFilter>,
    #[serde(rename = "duration")]
    pub duration_filter: Option<DurationFilter>,
}

impl FilterSession {
    pub fn is_empty(&self) -> bool {
        let user_empty = self.user_filter.as_ref().map_or(true, |f| f.is_empty());
        let category_empty = self.category_filter.as_ref().map_or(true, |f| f.is_empty());
        let tag_empty = self.tag_filter.as_ref().map_or(true, |f| f.is_empty());
        let template_empty = self.template_filter.as_ref().map_or(true, |f| f.is_empty());

        user_empty
            && category_empty
            && tag_empty
            && self.start_time_filter.is_none()
            && self.end_time_filter.is_none()
            && template_empty
            && self.duration_filter.is_none()
    }

    pub fn user(mut self, filter: UserFilter) -> Self {
        self.user_filter = Some(filter);
        self
    }

    pub fn category(mut self, filter: CategoryFilter) -> Self {
        self.category_filter = Some(filter);
        self
    }

    pub fn tag(mut self, filter: TagFilter) -> Self {
        self.tag_filter = Some(filter);
        self
    }

    pub fn start_time(mut self, filter: DateFilter) -> Self {
        self.start_time_filter = Some(filter);
        self
    }

    pub fn end_time(mut self, filter: DateFilter) -> Self {
        self.end_time_filter = Some(filter);
        self
    }

    pub fn template(mut self, filter: TemplateFilter) -> Self {
        self.template_filter = Some(filter);
        self
    }

    pub fn duration(mut self, filter: DurationFilter) -> Self {
        self.duration_filter = Some(filter);
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserFilter {
    pub id: Option<IdFilter<String>>,
}

impl UserFilter {
    pub fn is_empty(&self) -> bool {
        self.id.is_none()
    }

    pub fn one(id: String) -> Self {
        Self {
            id: Some(IdFilter::One(id)),
        }
    }

    pub fn all(ids: Vec<String>) -> Self {
        Self {
            id: Some(IdFilter::Many(ManyIdFilter::All(ids))),
        }
    }

    pub fn any(ids: Vec<String>) -> Self {
        Self {
            id: Some(IdFilter::Many(ManyIdFilter::Any(ids))),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryFilter {
    pub id: Option<IdFilter<Uuid>>,
}

impl CategoryFilter {
    pub fn is_empty(&self) -> bool {
        self.id.is_none()
    }

    pub fn one(id: Uuid) -> Self {
        Self {
            id: Some(IdFilter::One(id)),
        }
    }

    pub fn all(ids: Vec<Uuid>) -> Self {
        Self {
            id: Some(IdFilter::Many(ManyIdFilter::All(ids))),
        }
    }

    pub fn any(ids: Vec<Uuid>) -> Self {
        Self {
            id: Some(IdFilter::Many(ManyIdFilter::Any(ids))),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateFilterFilter {
    pub id: Option<IdFilter<Uuid>>,
}

impl TemplateFilterFilter {
    pub fn is_empty(&self) -> bool {
        self.id.is_none()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
#[serde(untagged)]
pub enum TagFilter {
    NoTag,
    Filter(TagFilterFilter),
}

impl TagFilter {
    pub fn is_empty(&self) -> bool {
        match self {
            TagFilter::NoTag => false,
            TagFilter::Filter(f) => f.is_empty(),
        }
    }

    pub fn no_tag() -> Self {
        TagFilter::NoTag
    }

    pub fn one(id: Uuid) -> Self {
        TagFilter::Filter(TagFilterFilter {
            id: Some(IdFilter::One(id)),
        })
    }

    pub fn all(ids: Vec<Uuid>) -> Self {
        TagFilter::Filter(TagFilterFilter {
            id: Some(IdFilter::Many(ManyIdFilter::All(ids))),
        })
    }

    pub fn any(ids: Vec<Uuid>) -> Self {
        TagFilter::Filter(TagFilterFilter {
            id: Some(IdFilter::Many(ManyIdFilter::Any(ids))),
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagFilterFilter {
    pub id: Option<IdFilter<Uuid>>,
}

impl TagFilterFilter {
    pub fn is_empty(&self) -> bool {
        self.id.is_none()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
#[serde(untagged)]
pub enum IdFilter<T> {
    One(T),
    Many(ManyIdFilter<T>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ManyIdFilter<T> {
    All(Vec<T>),
    Any(Vec<T>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DateFilter {
    #[serde(rename = "gte")]
    GreaterThanEqual(DateTime<Utc>),
    #[serde(rename = "ge")]
    GreaterThan(DateTime<Utc>),
    #[serde(rename = "lte")]
    LessThanEqual(DateTime<Utc>),
    #[serde(rename = "lt")]
    LessThan(DateTime<Utc>),
    #[serde(rename = "eq")]
    Equal(DateTime<Utc>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
pub enum TemplateFilter {
    NoTemplate,
    Filter(TemplateFilterFilter),
}

impl TemplateFilter {
    pub fn is_empty(&self) -> bool {
        match self {
            TemplateFilter::NoTemplate => false,
            TemplateFilter::Filter(f) => f.is_empty(),
        }
    }

    pub fn no_template() -> Self {
        TemplateFilter::NoTemplate
    }

    pub fn one(id: Uuid) -> Self {
        TemplateFilter::Filter(TemplateFilterFilter {
            id: Some(IdFilter::One(id)),
        })
    }

    pub fn all(ids: Vec<Uuid>) -> Self {
        TemplateFilter::Filter(TemplateFilterFilter {
            id: Some(IdFilter::Many(ManyIdFilter::All(ids))),
        })
    }

    pub fn any(ids: Vec<Uuid>) -> Self {
        TemplateFilter::Filter(TemplateFilterFilter {
            id: Some(IdFilter::Many(ManyIdFilter::Any(ids))),
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DurationFilter {
    #[serde(rename = "gte")]
    GreaterThanEqual(f64),
    #[serde(rename = "gt")]
    GreaterThan(f64),
    #[serde(rename = "lte")]
    LessThanEqual(f64),
    #[serde(rename = "le")]
    LessThan(f64),
    #[serde(rename = "eq")]
    Equal(f64),
}
