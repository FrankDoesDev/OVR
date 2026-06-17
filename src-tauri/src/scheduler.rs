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
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .expect("Failed to create tokio runtime");

            let generate = || {
                let settings_clone = {
                    let s = settings.lock().ok();
                    s.map(|s| s.clone())
                };
                if let Some(s) = settings_clone {
                    match rt.block_on(feeds::generate_digest(&s)) {
                        Ok(digest) => {
                            let _ = storage::save_digest(&digest);
                            eprintln!("[Scheduler] Digest generated");
                        }
                        Err(e) => {
                            eprintln!("[Scheduler] Digest generation failed: {}", e);
                        }
                    }
                }
            };

            generate();

            loop {
                let interval = {
                    let s = settings.lock().ok();
                    s.map(|s| s.refresh_interval_hours).unwrap_or(6).max(1)
                };
                thread::sleep(Duration::from_secs((interval as u64) * 3600));
                generate();
            }
        });
    }
}
