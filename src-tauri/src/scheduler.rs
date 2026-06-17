use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use crate::storage::{self, UserSettings};
use crate::feeds;

pub struct Scheduler {
    settings: Arc<Mutex<UserSettings>>,
}

impl Scheduler {
    pub fn new(settings: Arc<Mutex<UserSettings>>) -> Self {
        Self { settings }
    }

    pub fn start(&self) {
        let settings = Arc::clone(&self.settings);

        thread::spawn(move || {
            let interval = {
                let s = settings.lock().ok();
                s.map(|s| s.refresh_interval_hours).unwrap_or(6)
            };

            let interval_secs = (interval as u64) * 3600;

            // Generate on first run
            {
                let settings_clone = {
                    let s = settings.lock().ok();
                    s.map(|s| s.clone())
                };
                if let Some(s) = settings_clone {
                    match feeds::generate_digest(&s) {
                        Ok(digest) => {
                            let _ = storage::save_digest(&digest);
                            eprintln!("[Scheduler] Initial digest generated");
                        }
                        Err(e) => {
                            eprintln!("[Scheduler] Failed to generate digest: {}", e);
                        }
                    }
                }
            }

            loop {
                thread::sleep(Duration::from_secs(interval_secs));
                let settings_clone = {
                    let s = settings.lock().ok();
                    s.map(|s| s.clone())
                };
                if let Some(s) = settings_clone {
                    match feeds::generate_digest(&s) {
                        Ok(digest) => {
                            let _ = storage::save_digest(&digest);
                            eprintln!("[Scheduler] Digest generated");
                        }
                        Err(e) => {
                            eprintln!("[Scheduler] Digest generation failed: {}", e);
                        }
                    }
                }
            }
        });
    }
}
