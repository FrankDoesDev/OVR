use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use crate::storage::{self, UserSettings, Digest};
use crate::feeds;

pub struct Scheduler {
    settings: Arc<Mutex<UserSettings>>,
    last_digest: Arc<Mutex<Option<Digest>>>,
}

impl Scheduler {
    pub fn new(settings: UserSettings) -> Self {
        Self {
            settings: Arc::new(Mutex::new(settings)),
            last_digest: Arc::new(Mutex::new(None)),
        }
    }

    pub fn get_last_digest(&self) -> Option<Digest> {
        self.last_digest.lock().ok().and_then(|d| d.clone())
    }

    pub fn start(&self) {
        let settings = Arc::clone(&self.settings);
        let last_digest = Arc::clone(&self.last_digest);

        thread::spawn(move || {
            loop {
                let interval = {
                    let s = settings.lock().ok();
                    s.map(|s| s.refresh_interval_hours).unwrap_or(6)
                };

                let interval_secs = interval * 3600;

                // Generate on first run
                {
                    let s = settings.lock().ok();
                    if let Some(s) = s {
                        match feeds::generate_digest(&s) {
                            Ok(digest) => {
                                let _ = storage::save_digest(&digest);
                                if let Ok(mut last) = last_digest.lock() {
                                    *last = Some(digest);
                                }
                                eprintln!("[Scheduler] Initial digest generated");
                            }
                            Err(e) => {
                                eprintln!("[Scheduler] Failed to generate digest: {}", e);
                            }
                        }
                    }
                }

                // Sleep and regenerate
                loop {
                    thread::sleep(Duration::from_secs(interval_secs));
                    let s = settings.lock().ok();
                    if let Some(s) = s {
                        match feeds::generate_digest(&s) {
                            Ok(digest) => {
                                let _ = storage::save_digest(&digest);
                                if let Ok(mut last) = last_digest.lock() {
                                    *last = Some(digest);
                                }
                                eprintln!("[Scheduler] Digest generated");
                            }
                            Err(e) => {
                                eprintln!("[Scheduler] Digest generation failed: {}", e);
                            }
                        }
                    }
                }
            }
        });
    }
}
