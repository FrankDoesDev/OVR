use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub source: String,
    #[serde(rename = "categoryId")]
    pub category_id: String,
    #[serde(rename = "publishedAt")]
    pub published_at: String,
    pub description: Option<String>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    pub icon: Option<String>,
    pub author: Option<String>,
    #[serde(rename = "sourceType")]
    pub source_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub enabled: bool,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonMapping {
    #[serde(rename = "itemsPath")]
    pub items_path: Option<String>,
    #[serde(rename = "titlePath")]
    pub title_path: Option<String>,
    #[serde(rename = "urlPath")]
    pub url_path: Option<String>,
    #[serde(rename = "descriptionPath")]
    pub description_path: Option<String>,
    #[serde(rename = "datePath")]
    pub date_path: Option<String>,
    #[serde(rename = "imageUrlPath")]
    pub image_url_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredSource {
    pub id: String,
    pub name: String,
    #[serde(rename = "categoryId")]
    pub category_id: String,
    #[serde(rename = "type")]
    pub source_type: String,
    pub url: String,
    pub icon: Option<String>,
    pub enabled: bool,
    #[serde(rename = "transformType")]
    pub transform_type: String,
    #[serde(rename = "jsonMapping")]
    pub json_mapping: Option<JsonMapping>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub categories: Vec<Category>,
    pub sources: Vec<StoredSource>,
    #[serde(rename = "maxItemsPerSource")]
    pub max_items_per_source: u32,
    #[serde(rename = "refreshIntervalHours")]
    pub refresh_interval_hours: u32,
    #[serde(rename = "homepagePreviewCount")]
    pub homepage_preview_count: u32,
    #[serde(rename = "maxItemAgeDays")]
    pub max_item_age_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Digest {
    pub date: String,
    pub hour: String,
    #[serde(rename = "generatedAt")]
    pub generated_at: String,
    pub sections: HashMap<String, Vec<FeedItem>>,
    pub categories: Vec<Category>,
    #[serde(rename = "sourceCounts")]
    pub source_counts: HashMap<String, u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveEntry {
    pub date: String,
    pub hour: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    #[serde(rename = "type")]
    pub result_type: Option<String>,
    pub title: Option<String>,
    pub items: Vec<TestItem>,
    pub error: Option<String>,
    #[serde(rename = "topKeys")]
    pub top_keys: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestItem {
    pub index: usize,
    pub title: String,
    pub url: String,
}

fn get_data_dir() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let path = dir.join("data");
            if path.exists() || fs::create_dir_all(&path).is_ok() {
                return path;
            }
        }
    }
    os_data_dir()
}

#[cfg(target_os = "windows")]
fn os_data_dir() -> PathBuf {
    let base = std::env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("data"));
    base.join("ovr")
}

#[cfg(target_os = "macos")]
fn os_data_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
    PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("com.ovr.app")
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn os_data_dir() -> PathBuf {
    let base = std::env::var("XDG_DATA_HOME")
        .or_else(|_| std::env::var("HOME").map(|h| format!("{}/.local/share", h)))
        .unwrap_or_else(|_| "data".into());
    PathBuf::from(base).join("ovr")
}

fn ensure_data_dir() -> PathBuf {
    let dir = get_data_dir();
    let _ = fs::create_dir_all(&dir);
    dir
}

fn settings_path() -> PathBuf {
    ensure_data_dir().join("settings.json")
}

fn digest_file_name(date: &str, hour: &str) -> String {
    format!("digest-{}-{}.json", date, hour)
}

fn digest_path(date: &str, hour: &str) -> PathBuf {
    ensure_data_dir().join(digest_file_name(date, hour))
}

fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

fn default_settings() -> UserSettings {
    UserSettings {
        categories: vec![],
        sources: vec![],
        max_items_per_source: 30,
        refresh_interval_hours: 6,
        homepage_preview_count: 4,
        max_item_age_days: 2,
    }
}

pub fn load_settings() -> UserSettings {
    let path = settings_path();
    if !path.exists() {
        let seed = default_settings();
        let _ = save_settings(&seed);
        return seed;
    }
    match fs::read_to_string(&path) {
        Ok(data) => {
            match serde_json::from_str::<UserSettings>(&data) {
                Ok(mut s) => {
                    let mut migrated = false;
                    for source in &mut s.sources {
                        if source.url.contains("nitter.net") && source.transform_type == "rss" {
                            source.transform_type = "twitter-rss".to_string();
                            migrated = true;
                        }
                    }
                    if migrated {
                        let _ = save_settings(&s);
                    }
                    s
                }
                Err(_) => {
                    let seed = default_settings();
                    let _ = save_settings(&seed);
                    seed
                }
            }
        }
        Err(_) => {
            let seed = default_settings();
            let _ = save_settings(&seed);
            seed
        }
    }
}

pub fn save_settings(settings: &UserSettings) -> Result<(), String> {
    let path = settings_path();
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_digest(digest: &Digest) -> Result<String, String> {
    let path = digest_path(&digest.date, &digest.hour);
    let json = serde_json::to_string_pretty(digest).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default())
}

pub fn load_latest_digest() -> Option<Digest> {
    let archives = list_archives();
    archives.last().and_then(|a| load_digest(&a.date, Some(&a.hour)))
}

pub fn load_digest(date: &str, hour: Option<&str>) -> Option<Digest> {
    if let Some(h) = hour {
        let path = digest_path(date, h);
        if path.exists() {
            let data = fs::read_to_string(&path).ok()?;
            return serde_json::from_str(&data).ok();
        }
        return None;
    }
    for h in &["00", "06", "12", "18"] {
        if let Some(d) = load_digest(date, Some(h)) {
            return Some(d);
        }
    }
    None
}

pub fn list_archives() -> Vec<ArchiveEntry> {
    let dir = ensure_data_dir();
    let mut entries: Vec<ArchiveEntry> = fs::read_dir(&dir)
        .ok()
        .into_iter()
        .flatten()
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if !name.starts_with("digest-") || !name.ends_with(".json") {
                return None;
            }
            let stripped = name.strip_prefix("digest-")?.strip_suffix(".json")?;
            let parts: Vec<&str> = stripped.splitn(4, '-').collect();
            if parts.len() < 4 { return None; }
            let date = format!("{}-{}-{}", parts[0], parts[1], parts[2]);
            let hour = parts[3].to_string();
            Some(ArchiveEntry { date, hour, path: name })
        })
        .collect();
    entries.sort_by(|a, b| b.date.cmp(&a.date).then(b.hour.cmp(&a.hour)));
    entries
}
