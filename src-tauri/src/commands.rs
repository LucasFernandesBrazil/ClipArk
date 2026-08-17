use std::sync::atomic::Ordering;
use std::time::Instant;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::database;
use crate::models::{AppSettings, Category, Clip};
use crate::AppState;

type CommandResult<T> = Result<T, String>;

#[tauri::command]
pub fn search_clips(
    state: State<'_, AppState>,
    query: Option<String>,
    filter: Option<String>,
    category_id: Option<String>,
    limit: Option<i64>,
) -> CommandResult<Vec<Clip>> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::clips::search(
        &connection,
        query.as_deref().unwrap_or_default(),
        filter.as_deref().unwrap_or("all"),
        category_id,
        limit.unwrap_or(300),
    )
    .map_err(to_string)
}

#[tauri::command]
pub fn get_categories(state: State<'_, AppState>) -> CommandResult<Vec<Category>> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::categories::all(&connection).map_err(to_string)
}

#[tauri::command]
pub fn create_category(
    state: State<'_, AppState>,
    name: String,
    color: String,
    icon: Option<String>,
) -> CommandResult<Category> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::categories::create(&connection, &name, &color, icon).map_err(to_string)
}

#[tauri::command]
pub fn update_category(
    state: State<'_, AppState>,
    id: String,
    name: String,
    color: String,
    icon: Option<String>,
) -> CommandResult<Category> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::categories::update(&connection, &id, &name, &color, icon).map_err(to_string)
}

#[tauri::command]
pub fn delete_category(app: AppHandle, state: State<'_, AppState>, id: String) -> CommandResult<()> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::categories::delete(&connection, &id).map_err(to_string)?;
    emit_changed(&app);
    Ok(())
}

#[tauri::command]
pub fn toggle_favorite(app: AppHandle, state: State<'_, AppState>, id: String) -> CommandResult<Clip> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    let clip = database::clips::toggle_favorite(&connection, &id).map_err(to_string)?;
    emit_changed(&app);
    Ok(clip)
}

#[tauri::command]
pub fn delete_clip(app: AppHandle, state: State<'_, AppState>, id: String) -> CommandResult<()> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::clips::delete_clip(&connection, &id).map_err(to_string)?;
    emit_changed(&app);
    Ok(())
}

#[tauri::command]
pub fn clear_history(app: AppHandle, state: State<'_, AppState>) -> CommandResult<()> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::clips::clear_history(&connection).map_err(to_string)?;
    emit_changed(&app);
    Ok(())
}

#[tauri::command]
pub fn copy_clip(app: AppHandle, state: State<'_, AppState>, id: String) -> CommandResult<()> {
    let content = {
        let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
        let clip = database::clips::get_clip(&connection, &id)
            .map_err(to_string)?
            .ok_or_else(|| "Clip not found".to_string())?;
        let updated = database::clips::upsert_clip(&connection, &clip.content, None).map_err(to_string)?;
        if let Ok(limit) = database::settings::get_limit(&connection) {
            let _ = database::clips::prune(&connection, limit);
        }
        let mut suppress = state.suppress_hash.lock().map_err(|_| "Clipboard guard failed".to_string())?;
        *suppress = Some((updated.content_hash, Instant::now()));
        clip.content
    };

    app.clipboard().write_text(content).map_err(to_string)?;
    emit_changed(&app);
    Ok(())
}

/// Copies the clip and pastes it straight into whatever app was frontmost.
/// Hides the launcher first so macOS reactivates that app before the keystroke lands.
#[tauri::command]
pub fn paste_clip(app: AppHandle, state: State<'_, AppState>, id: String) -> CommandResult<()> {
    if !crate::paste::accessibility_granted() {
        return Err(crate::paste::ACCESSIBILITY_DENIED.to_string());
    }

    copy_clip(app.clone(), state, id)?;

    if let Some(window) = app.get_webview_window("main") {
        // The blur handler would race with us hiding the window ourselves.
        state_suppress_blur(&app, true);
        window.hide().map_err(to_string)?;
    }

    let result = crate::paste::paste_to_frontmost();
    state_suppress_blur(&app, false);
    result
}

#[tauri::command]
pub fn accessibility_status() -> bool {
    crate::paste::accessibility_granted()
}

#[tauri::command]
pub fn request_accessibility() -> bool {
    crate::paste::request_accessibility()
}

fn state_suppress_blur(app: &AppHandle, suppress: bool) {
    app.state::<AppState>()
        .suppress_blur_hide
        .store(suppress, Ordering::Relaxed);
}

#[tauri::command]
pub fn move_clip_to_category(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
    category_id: Option<String>,
) -> CommandResult<Clip> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    let clip = database::clips::move_to_category(&connection, &id, category_id).map_err(to_string)?;
    emit_changed(&app);
    Ok(clip)
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> CommandResult<AppSettings> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::settings::get(&connection).map_err(to_string)
}

#[tauri::command]
pub fn update_settings(app: AppHandle, state: State<'_, AppState>, settings: AppSettings) -> CommandResult<AppSettings> {
    {
        let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
        database::settings::save(&connection, &settings).map_err(to_string)?;
        database::clips::prune(&connection, settings.max_stored_clips).map_err(to_string)?;
    }
    state.tracking_paused.store(settings.tracking_paused, Ordering::Relaxed);
    let autostart = app.autolaunch();
    if settings.launch_at_startup {
        autostart.enable().map_err(to_string)?;
    } else {
        autostart.disable().map_err(to_string)?;
    }
    emit_changed(&app);
    get_settings(state)
}

#[tauri::command]
pub fn set_tracking_paused(app: AppHandle, state: State<'_, AppState>, paused: bool) -> CommandResult<bool> {
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    database::settings::set_tracking_paused(&connection, paused).map_err(to_string)?;
    state.tracking_paused.store(paused, Ordering::Relaxed);
    emit_changed(&app);
    Ok(paused)
}

#[tauri::command]
pub fn get_tracking_status(state: State<'_, AppState>) -> bool {
    !state.is_tracking_paused()
}

#[tauri::command]
pub fn hide_window(app: AppHandle) -> CommandResult<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(to_string)?;
    }
    Ok(())
}

#[tauri::command]
pub fn show_settings_window(app: AppHandle) -> CommandResult<()> {
    crate::shortcuts::show_launcher(&app)?;
    app.emit("open-settings", ()).map_err(to_string)?;
    Ok(())
}

#[tauri::command]
pub fn seed_dev_data(app: AppHandle, state: State<'_, AppState>) -> CommandResult<()> {
    if !cfg!(debug_assertions) {
        return Ok(());
    }
    let samples = [
        "hello world",
        "https://github.com/LucasFernandesBrazil/ClipArk",
        "john@example.com",
        "#7C3AED",
        r#"{"name":"ClipArk","localFirst":true}"#,
        "const user = await findUser(id);\nreturn user.email;",
    ];
    let connection = state.db.lock().map_err(|_| "Database lock failed".to_string())?;
    for sample in samples {
        database::clips::upsert_clip(&connection, sample, None).map_err(to_string)?;
    }
    emit_changed(&app);
    Ok(())
}

fn emit_changed(app: &AppHandle) {
    let _ = app.emit("clips-changed", ());
}

fn to_string(error: impl std::fmt::Display) -> String {
    error.to_string()
}
