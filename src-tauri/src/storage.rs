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

fn build_seed_settings() -> UserSettings {
    let gaming_id = generate_id();
    let tech_id = generate_id();
    let politics_id = generate_id();

    let categories = vec![
        Category { id: gaming_id.clone(), name: "Gaming".into(), slug: "gaming".into(), enabled: true, order: 0 },
        Category { id: tech_id.clone(), name: "Tech".into(), slug: "tech".into(), enabled: true, order: 1 },
        Category { id: politics_id.clone(), name: "Politics".into(), slug: "politics".into(), enabled: true, order: 2 },
    ];

    let cat_map: HashMap<&str, &str> = vec![
        ("gaming", gaming_id.as_str()),
        ("tech", tech_id.as_str()),
        ("politics", politics_id.as_str()),
    ].into_iter().collect();

    let built_in_sources: Vec<(&str, &str, &str, &str, &str)> = vec![
        ("Steam News", "gaming", "\u{1f3ae}", "rss", "https://store.steampowered.com/feeds/news.xml"),
        ("Epic Free Games", "gaming", "\u{1f193}", "api-json", "https://epic-free-games.vercel.app/api/games"),
        ("IGN", "gaming", "\u{1f3af}", "rss", "https://www.ign.com/rss/v2/articles/feed/rss"),
        ("PC Gamer", "gaming", "\u{1f5a5}\u{fe0f}", "rss", "https://www.pcgamer.com/rss/feed/rss"),
        ("Eurogamer", "gaming", "\u{1f1ea}\u{1f1fa}", "rss", "https://www.eurogamer.net/feed/news"),
        ("PlayStation", "gaming", "\u{25b6}\u{fe0f}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UC-2Y8dQb0S6DtpxNgAKoJKA"),
        ("Xbox", "gaming", "\u{2716}\u{fe0f}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCjBp_7RuDBUYbd1LegWEJ8g"),
        ("OpenAI Blog", "tech", "\u{1f916}", "rss", "https://openai.com/news/rss.xml"),
        ("Anthropic News", "tech", "\u{1f9e0}", "rss", "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml"),
        ("Hugging Face Blog", "tech", "\u{1f917}", "rss", "https://huggingface.co/blog/feed.xml"),
        ("HF New Models", "tech", "\u{1f3d7}\u{fe0f}", "api-json", "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20"),
        ("Ars Technica AI", "tech", "\u{2699}\u{fe0f}", "rss", "https://arstechnica.com/ai/feed/"),
        ("TechCrunch", "tech", "\u{1f52c}", "rss", "https://techcrunch.com/feed/"),
        ("The Verge", "tech", "\u{26a1}", "rss", "https://www.theverge.com/rss/index.xml"),
        ("SpaceX", "tech", "\u{1f680}", "rss", "https://www.teslarati.com/feed/"),
        ("Spaceflight Now", "tech", "\u{1f4f0}", "rss", "https://spaceflightnow.com/feed/"),
        ("NASA", "tech", "\u{1f30c}", "rss", "https://www.nasa.gov/feed/"),
        ("Raspberry Pi", "tech", "\u{1f967}", "rss", "https://www.raspberrypi.com/news/feed/"),
        ("Hacker News", "tech", "\u{2693}", "rss", "https://hnrss.org/frontpage"),
        ("Ben's Bites", "tech", "\u{1f96a}", "rss", "https://www.bensbites.co/feed"),
        ("The Rundown AI", "tech", "\u{1f4ec}", "rss", "https://www.therundown.ai/feed"),
        ("DeepMind", "tech", "\u{1f52c}", "rss", "https://deepmind.google/blog/rss.xml"),
        ("Linus Tech Tips", "tech", "\u{1f6e0}\u{fe0f}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCxHKALcAjHZpGCKW-oSr_zg"),
        ("TechLinked", "tech", "\u{1f517}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCeeFfhMcJa1kjtfZAGskOCA"),
        ("t3dotgg", "tech", "\u{1f4bb}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCbRP3c757lWg9M-U7TyEkXA"),
        ("ThrillSeeker", "tech", "\u{1f97d}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCSbdMXOI_3HGiFviLZO6kNA"),
        ("Fox News Politics", "politics", "\u{1f4fa}", "rss", "https://feeds.foxnews.com/foxnews/politics"),
        ("NYT Politics", "politics", "\u{1f4f0}", "rss", "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"),
        ("The Hill", "politics", "\u{26f0}\u{fe0f}", "rss", "https://thehill.com/feed/"),
        ("Politico", "politics", "\u{1f3db}\u{fe0f}", "rss", "https://rss.politico.com/congress.xml"),
        ("RealClearPolitics", "politics", "\u{1f4ca}", "rss", "https://www.realclearpolitics.com/index.xml"),
        ("CNN Politics", "politics", "\u{1f4e1}", "rss", "http://rss.cnn.com/rss/cnn_allpolitics.rss"),
        ("Asmongold", "politics", "\u{1f3ad}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCQeRaTukNYft1_6AZPACnog"),
        ("Sam Hyde", "politics", "\u{1f3aa}", "youtube-rss", "https://www.youtube.com/feeds/videos.xml?channel_id=UCfUaZ8Ra7m7BqUEACv2jySw"),
    ];

    let sources: Vec<StoredSource> = built_in_sources.iter().map(|(name, cat_slug, icon, transform, url)| {
        StoredSource {
            id: generate_id(),
            name: name.to_string(),
            category_id: cat_map[*cat_slug].to_string(),
            source_type: if *transform == "api-json" { "api-json".into() } else { "rss".into() },
            url: url.to_string(),
            icon: Some(icon.to_string()),
            enabled: true,
            transform_type: transform.to_string(),
            json_mapping: None,
        }
    }).collect();

    UserSettings {
        categories,
        sources,
        max_items_per_source: 30,
        refresh_interval_hours: 6,
        homepage_preview_count: 4,
        max_item_age_days: 2,
    }
}

pub fn load_settings() -> UserSettings {
    let path = settings_path();
    if !path.exists() {
        let seed = build_seed_settings();
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
                    let seed = build_seed_settings();
                    let _ = save_settings(&seed);
                    seed
                }
            }
        }
        Err(_) => {
            let seed = build_seed_settings();
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
    Ok(path.file_name().unwrap().to_string_lossy().to_string())
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
