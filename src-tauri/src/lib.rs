mod clipboard;
mod commands;
mod database;
mod models;
mod shortcuts;
mod tray;

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use std::time::Instant;

use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub tracking_paused: AtomicBool,
    pub suppress_hash: Mutex<Option<(String, Instant)>>,
}

impl AppState {
    fn new(connection: Connection, tracking_paused: bool) -> Self {
        Self {
            db: Mutex::new(connection),
            tracking_paused: AtomicBool::new(tracking_paused),
            suppress_hash: Mutex::new(None),
        }
    }

    pub fn is_tracking_paused(&self) -> bool {
        self.tracking_paused.load(Ordering::Relaxed)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(shortcuts::plugin())
        .setup(|app| {
            let connection = database::connect(app.handle())?;
            let tracking_paused = database::settings::get_tracking_paused(&connection)?;
            app.manage(AppState::new(connection, tracking_paused));
            tray::setup(app)?;
            let _ = shortcuts::register(app.handle());
            let _ = shortcuts::position_launcher(app.handle());
            clipboard::start_monitor(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::search_clips,
            commands::get_categories,
            commands::create_category,
            commands::update_category,
            commands::delete_category,
            commands::toggle_favorite,
            commands::delete_clip,
            commands::clear_history,
            commands::copy_clip,
            commands::move_clip_to_category,
            commands::get_settings,
            commands::update_settings,
            commands::set_tracking_paused,
            commands::get_tracking_status,
            commands::hide_window,
            commands::show_settings_window,
            commands::seed_dev_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running ClipArk");
}
