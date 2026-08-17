use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Clip {
    pub id: String,
    pub content: String,
    pub normalized_content: String,
    pub content_hash: String,
    #[serde(rename = "type")]
    pub clip_type: String,
    pub source_app: Option<String>,
    pub favorite: bool,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub copied_count: i64,
    pub created_at: String,
    pub last_copied_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub launch_at_startup: bool,
    pub max_stored_clips: Option<i64>,
    pub tracking_paused: bool,
    pub auto_paste: bool,
}
