use std::collections::HashMap;
use chrono::{Local, Datelike, Timelike};
use feed_rs::parser;
use serde_json::Value;

use crate::storage::{FeedItem, StoredSource, UserSettings, Digest, Category};

const USER_AGENT: &str = "OVR-daily-digest/1.0";

// ─── RSS/Atom Fetching ───

fn extract_image(entry: &feed_rs::model::Entry) -> Option<String> {
    // 1. Media content (from media:content elements)
    for media in &entry.media {
        for content in &media.content {
            if let Some(url) = &content.url {
                return Some(url.to_string());
            }
        }
        // 2. Thumbnails (from media:thumbnail elements)
        if let Some(thumb) = media.thumbnails.first() {
            return Some(thumb.image.uri.clone());
        }
    }
    // 3. Enclosure links with image MIME type
    for link in &entry.links {
        if link.rel.as_deref() == Some("enclosure") {
            if let Some(ref mt) = link.media_type {
                if mt.starts_with("image") {
                    return Some(link.href.clone());
                }
            }
        }
    }
    None
}

fn fetch_rss(url: &str) -> Result<Vec<FeedItem>, String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(url).send().map_err(|e| e.to_string())?;
    let content = response.text().map_err(|e| e.to_string())?;

    let feed = parser::parse(content.as_bytes()).map_err(|e| e.to_string())?;

    let feed_icon = feed.icon.as_ref()
        .or(feed.logo.as_ref())
        .map(|img| img.uri.clone());

    let items: Vec<FeedItem> = feed.entries.into_iter().filter_map(|entry| {
        let id = entry.id.to_string();
        let title = entry.title.as_ref().map(|t| t.content.clone()).unwrap_or_default();
        let link = entry.links.first().map(|l| l.href.clone()).unwrap_or_default();
        let published = entry.published.as_ref()
            .or(entry.updated.as_ref())
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default();
        let description = entry.summary.as_ref().map(|s| s.content.clone())
            .or_else(|| entry.content.as_ref().and_then(|c| {
                c.body.clone()
            }));
        let image_url = extract_image(&entry).or_else(|| feed_icon.clone());

        Some(FeedItem {
            id,
            title,
            url: link,
            source: String::new(),
            category_id: String::new(),
            published_at: published,
            description,
            image_url,
            icon: None,
            author: entry.authors.first().map(|a| a.name.clone()),
            source_type: String::new(),
        })
    }).collect();

    Ok(items)
}

// ─── JSON API Fetching ───

fn fetch_json_api(url: &str, mapping: Option<&crate::storage::JsonMapping>) -> Result<Vec<FeedItem>, String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(url)
        .header("Accept", "application/json")
        .send()
        .map_err(|e| e.to_string())?;

    let data: Value = response.json().map_err(|e| e.to_string())?;

    let items = match mapping {
        Some(m) => extract_with_mapping(&data, m),
        None => extract_generic_json(&data),
    };

    Ok(items)
}

fn get_by_path<'a>(obj: &'a Value, path: &str) -> Option<&'a Value> {
    let mut current = obj;
    for key in path.split('.') {
        current = current.get(key)?;
    }
    Some(current)
}

fn extract_with_mapping(data: &Value, mapping: &crate::storage::JsonMapping) -> Vec<FeedItem> {
    let items_path = mapping.items_path.as_deref().unwrap_or("");
    let items = if items_path.is_empty() {
        if let Some(arr) = data.as_array() {
            arr.clone()
        } else {
            vec![data.clone()]
        }
    } else {
        match get_by_path(data, items_path) {
            Some(Value::Array(arr)) => arr.clone(),
            _ => vec![],
        }
    };

    items.into_iter().enumerate().filter_map(|(i, item)| {
        let title = mapping.title_path.as_ref()
            .and_then(|p| get_by_path(&item, p))
            .and_then(|v| v.as_str())
            .unwrap_or("").to_string();
        let url = mapping.url_path.as_ref()
            .and_then(|p| get_by_path(&item, p))
            .and_then(|v| v.as_str())
            .unwrap_or("").to_string();
        let description = mapping.description_path.as_ref()
            .and_then(|p| get_by_path(&item, p))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let published = mapping.date_path.as_ref()
            .and_then(|p| get_by_path(&item, p))
            .and_then(|v| v.as_str())
            .unwrap_or("").to_string();
        let image_url = mapping.image_url_path.as_ref()
            .and_then(|p| get_by_path(&item, p))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        if title.is_empty() && url.is_empty() { return None; }

        Some(FeedItem {
            id: format!("json-{}", i),
            title,
            url,
            source: String::new(),
            category_id: String::new(),
            published_at: if published.is_empty() { chrono::Utc::now().to_rfc3339() } else { published },
            description,
            image_url,
            icon: None,
            author: None,
            source_type: String::new(),
        })
    }).collect()
}

fn extract_generic_json(data: &Value) -> Vec<FeedItem> {
    let arr = match data {
        Value::Array(a) => a.clone(),
        _ => vec![data.clone()],
    };

    arr.into_iter().enumerate().filter_map(|(i, item)| {
        let title = item.get("title").or(item.get("name")).or(item.get("id"))
            .and_then(|v| v.as_str()).unwrap_or("").to_string();
        let url = item.get("url").or(item.get("link")).or(item.get("html_url"))
            .and_then(|v| v.as_str()).unwrap_or("").to_string();

        if title.is_empty() { return None; }

        Some(FeedItem {
            id: format!("api-{}", i),
            title,
            url,
            source: String::new(),
            category_id: String::new(),
            published_at: item.get("publishedAt").or(item.get("created_at")).or(item.get("date"))
                .and_then(|v| v.as_str()).unwrap_or("").to_string(),
            description: item.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
            image_url: item.get("imageUrl").or(item.get("thumbnail")).and_then(|v| v.as_str()).map(|s| s.to_string()),
            icon: None,
            author: item.get("author").and_then(|v| v.as_str()).map(|s| s.to_string()),
            source_type: String::new(),
        })
    }).collect()
}

// ─── Source Fetching ───

fn fetch_source(source: &StoredSource) -> Result<Vec<FeedItem>, String> {
    let mut items = match source.transform_type.as_str() {
        "api-json" => fetch_json_api(&source.url, source.json_mapping.as_ref())?,
        _ => fetch_rss(&source.url)?,
    };

    for item in &mut items {
        item.source = source.name.clone();
        item.category_id = source.category_id.clone();
        item.source_type = source.transform_type.clone();
        if let Some(icon) = &source.icon {
            item.icon = Some(icon.clone());
        }
    }

    Ok(items)
}

// ─── Digest Generation ───

fn get_hour_label() -> String {
    let now = Local::now();
    let h = now.hour();
    if h < 6 { "00".into() }
    else if h < 12 { "06".into() }
    else if h < 18 { "12".into() }
    else { "18".into() }
}

fn dedup(items: Vec<FeedItem>) -> Vec<FeedItem> {
    let mut seen = std::collections::HashSet::new();
    items.into_iter().filter(|item| {
        let key = if item.url.is_empty() { item.title.clone() } else { item.url.clone() };
        seen.insert(key)
    }).collect()
}

fn sort_by_date(items: &mut Vec<FeedItem>) {
    items.sort_by(|a, b| {
        chrono::DateTime::parse_from_rfc3339(&b.published_at)
            .unwrap_or_default()
            .cmp(&chrono::DateTime::parse_from_rfc3339(&a.published_at)
                .unwrap_or_default())
    });
}

pub fn generate_digest(settings: &UserSettings) -> Result<Digest, String> {
    eprintln!("[Aggregator] Starting digest generation...");

    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let hour = get_hour_label();

    let enabled_cats: Vec<&Category> = settings.categories.iter().filter(|c| c.enabled).collect();
    let cat_by_slug: HashMap<&str, &Category> = enabled_cats.iter().map(|c| (c.slug.as_str(), *c)).collect();
    let active_cat_ids: std::collections::HashSet<&str> = enabled_cats.iter().map(|c| c.id.as_str()).collect();

    let active_sources: Vec<&StoredSource> = settings.sources.iter()
        .filter(|s| s.enabled && active_cat_ids.contains(s.category_id.as_str()))
        .collect();

    let max_per_source = settings.max_items_per_source as usize;

    let results: Vec<Result<Vec<FeedItem>, String>> = active_sources.iter()
        .map(|s| fetch_source(s))
        .collect();

    let mut sections: HashMap<String, Vec<FeedItem>> = HashMap::new();
    for cat in &enabled_cats {
        sections.insert(cat.slug.clone(), Vec::new());
    }
    let mut source_counts: HashMap<String, u32> = HashMap::new();

    let cutoff = chrono::Utc::now() - chrono::Duration::days(settings.max_item_age_days as i64);

    for (source, result) in active_sources.iter().zip(results.iter()) {
        if let Ok(items) = result {
            let cat = enabled_cats.iter().find(|c| c.id == source.category_id);
            if let Some(cat) = cat {
                let mut items = items.clone();
                sort_by_date(&mut items);
                items.truncate(max_per_source);
                let count = items.len() as u32;
                if let Some(section) = sections.get_mut(&cat.slug) {
                    section.extend(items);
                }
                source_counts.insert(source.name.clone(), count);
            }
        } else {
            source_counts.insert(source.name.clone(), 0);
        }
    }

    for section in sections.values_mut() {
        let mut deduped = dedup(std::mem::take(section));
        sort_by_date(&mut deduped);
        deduped.retain(|item| {
            chrono::DateTime::parse_from_rfc3339(&item.published_at)
                .map(|dt| dt > cutoff)
                .unwrap_or(true)
        });
        *section = deduped;
    }

    let digest = Digest {
        date: date.clone(),
        hour: hour.clone(),
        generated_at: now.to_rfc3339(),
        sections: sections.into_iter().map(|(k, v)| (k, v)).collect(),
        categories: enabled_cats.into_iter().cloned().collect(),
        source_counts,
    };

    eprintln!("[Aggregator] Digest saved: {}-{}", date, hour);

    Ok(digest)
}

pub fn test_source(url: &str, source_type: &str) -> Result<Vec<FeedItem>, String> {
    let source = StoredSource {
        id: "test".into(),
        name: "Test".into(),
        category_id: "test".into(),
        source_type: source_type.into(),
        url: url.into(),
        icon: None,
        enabled: true,
        transform_type: source_type.into(),
        json_mapping: None,
    };
    fetch_source(&source)
}
