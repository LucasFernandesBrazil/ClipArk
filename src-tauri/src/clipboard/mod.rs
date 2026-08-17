use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::database;
use crate::AppState;

pub fn start_monitor(app: AppHandle) {
    thread::spawn(move || {
        let mut last_seen_hash: Option<String> = None;

        loop {
            thread::sleep(Duration::from_millis(850));

            let state = app.state::<AppState>();
            if state.is_tracking_paused() {
                continue;
            }

            let Ok(content) = app.clipboard().read_text() else {
                continue;
            };
            if content.trim().is_empty() {
                continue;
            }

            let normalized = database::clips::normalize_content(&content);
            if normalized.is_empty() {
                continue;
            }
            let hash = database::clips::content_hash(&normalized);
            if last_seen_hash.as_deref() == Some(hash.as_str()) {
                continue;
            }

            if should_suppress(&state, &hash) {
                last_seen_hash = Some(hash);
                continue;
            }

            let Ok(connection) = state.db.lock() else {
                continue;
            };
            if database::clips::upsert_clip(&connection, &content, None).is_ok() {
                if let Ok(limit) = database::settings::get_limit(&connection) {
                    let _ = database::clips::prune(&connection, limit);
                }
                last_seen_hash = Some(hash);
                let _ = app.emit("clips-changed", ());
            }
        }
    });
}

fn should_suppress(state: &AppState, hash: &str) -> bool {
    let Ok(mut suppress) = state.suppress_hash.lock() else {
        return false;
    };
    let Some((suppressed_hash, created_at)) = suppress.as_ref() else {
        return false;
    };
    if created_at.elapsed() > Duration::from_secs(3) {
        *suppress = None;
        return false;
    }
    if suppressed_hash == hash {
        *suppress = None;
        return true;
    }
    false
}
