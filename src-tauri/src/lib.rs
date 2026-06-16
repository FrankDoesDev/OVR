use std::sync::Mutex;

mod commands;
mod feeds;
mod scheduler;
mod storage;

pub use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = storage::load_settings();

    let sched = scheduler::Scheduler::new(settings.clone());
    sched.start();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            settings: Mutex::new(settings),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::add_category,
            commands::update_category,
            commands::delete_category,
            commands::add_source,
            commands::update_source,
            commands::delete_source,
            commands::get_latest_digest,
            commands::get_digest,
            commands::list_archives,
            commands::generate_now,
            commands::test_source,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
