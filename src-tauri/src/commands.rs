use std::sync::{Arc, Mutex};
use tauri::State;

use crate::storage::{self, UserSettings, Digest, ArchiveEntry, TestResult, TestItem};
use crate::feeds;

pub struct AppState {
    pub settings: Arc<Mutex<UserSettings>>,
}

// ─── Settings Commands ───

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<UserSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn save_settings(state: State<AppState>, settings: UserSettings) -> Result<(), String> {
    storage::save_settings(&settings)?;
    let mut current = state.settings.lock().map_err(|e| e.to_string())?;
    *current = settings;
    Ok(())
}

// ─── Category Commands ───

#[tauri::command]
pub fn add_category(state: State<AppState>, name: String, slug: Option<String>, enabled: Option<bool>) -> Result<storage::Category, String> {
    let slug = slug.unwrap_or_else(|| {
        name.to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .trim_matches('-')
            .to_string()
    });

    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let order = settings.categories.len() as i32;

    let cat = storage::Category {
        id: id.clone(),
        name,
        slug,
        enabled: enabled.unwrap_or(true),
        order,
    };

    settings.categories.push(cat.clone());
    storage::save_settings(&settings)?;
    Ok(cat)
}

#[tauri::command]
pub fn update_category(state: State<AppState>, id: String, name: Option<String>, slug: Option<String>, enabled: Option<bool>, order: Option<i32>) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    if let Some(cat) = settings.categories.iter_mut().find(|c| c.id == id) {
        if let Some(n) = name { cat.name = n; }
        if let Some(s) = slug { cat.slug = s; }
        if let Some(e) = enabled { cat.enabled = e; }
        if let Some(o) = order { cat.order = o; }
    }
    storage::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn delete_category(state: State<AppState>, id: String) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.categories.retain(|c| c.id != id);
    if let Some(first_id) = settings.categories.first().map(|c| c.id.clone()) {
        for source in &mut settings.sources {
            if source.category_id == id {
                source.category_id = first_id.clone();
            }
        }
    }
    storage::save_settings(&settings)?;
    Ok(())
}

// ─── Source Commands ───

#[tauri::command]
pub fn add_source(state: State<AppState>, name: String, url: String, category_id: String, source_type: Option<String>, icon: Option<String>, enabled: Option<bool>, transform_type: Option<String>) -> Result<storage::StoredSource, String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let source_type_val = source_type.unwrap_or_else(|| "rss".into());
    let transform_type_val = transform_type.unwrap_or_else(|| source_type_val.clone());

    let source = storage::StoredSource {
        id,
        name,
        category_id,
        source_type: source_type_val,
        url,
        icon,
        enabled: enabled.unwrap_or(true),
        transform_type: transform_type_val,
        json_mapping: None,
    };

    settings.sources.push(source.clone());
    storage::save_settings(&settings)?;
    Ok(source)
}

#[tauri::command]
pub fn update_source(state: State<AppState>, id: String, name: Option<String>, url: Option<String>, category_id: Option<String>, icon: Option<String>, enabled: Option<bool>) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    if let Some(source) = settings.sources.iter_mut().find(|s| s.id == id) {
        if let Some(n) = name { source.name = n; }
        if let Some(u) = url { source.url = u; }
        if let Some(c) = category_id { source.category_id = c; }
        if let Some(i) = icon { source.icon = Some(i); }
        if let Some(e) = enabled { source.enabled = e; }
    }
    storage::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn delete_source(state: State<AppState>, id: String) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.sources.retain(|s| s.id != id);
    storage::save_settings(&settings)?;
    Ok(())
}

// ─── Digest Commands ───

#[tauri::command]
pub fn get_latest_digest() -> Result<Option<Digest>, String> {
    Ok(storage::load_latest_digest())
}

#[tauri::command]
pub fn get_digest(date: String, hour: Option<String>) -> Result<Option<Digest>, String> {
    Ok(storage::load_digest(&date, hour.as_deref()))
}

#[tauri::command]
pub fn list_archives() -> Result<Vec<ArchiveEntry>, String> {
    Ok(storage::list_archives())
}

#[tauri::command]
pub fn generate_now(state: State<AppState>) -> Result<Digest, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let digest = feeds::generate_digest(&settings)?;
    storage::save_digest(&digest)?;
    Ok(digest)
}

// ─── Test Command ───

#[tauri::command]
pub fn test_source(url: String, source_type: String) -> Result<TestResult, String> {
    match feeds::test_source(&url, &source_type) {
        Ok(items) => {
            let test_items: Vec<TestItem> = items.into_iter().take(3).enumerate().map(|(i, item)| {
                TestItem {
                    index: i,
                    title: item.title,
                    url: item.url,
                }
            }).collect();
            Ok(TestResult {
                success: true,
                result_type: Some(source_type),
                title: None,
                items: test_items,
                error: None,
                top_keys: None,
            })
        }
        Err(e) => Ok(TestResult {
            success: false,
            result_type: None,
            title: None,
            items: vec![],
            error: Some(e),
            top_keys: None,
        })
    }
}
