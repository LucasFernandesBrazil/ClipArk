use tauri::{
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Position, Size, WebviewWindow,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const LAUNCHER_WIDTH: f64 = 1180.0;
const LAUNCHER_HEIGHT: f64 = 320.0;
const BOTTOM_OVERLAY_MARGIN: f64 = 16.0;
const SIDE_INSET: f64 = 48.0;
const MINIMUM_WIDTH: f64 = 720.0;

pub fn plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                let _ = toggle_launcher(app);
            }
        })
        .build()
}

pub fn register(app: &AppHandle) -> Result<(), tauri_plugin_global_shortcut::Error> {
    #[cfg(target_os = "macos")]
    let shortcut = "Command+Shift+V";
    #[cfg(not(target_os = "macos"))]
    let shortcut = "Control+Shift+V";

    app.global_shortcut().register(shortcut)?;
    Ok(())
}

/// Cmd+Shift+V acts as a toggle: bring the launcher up, or dismiss it when it is
/// already the focused window.
pub fn toggle_launcher(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let visible = window.is_visible().unwrap_or(false);
        let focused = window.is_focused().unwrap_or(false);
        if visible && focused {
            window.hide().map_err(|error| error.to_string())?;
            return Ok(());
        }
    }
    show_launcher(app)?;
    let _ = app.emit("launcher-opened", ());
    Ok(())
}

pub fn show_launcher(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        position_window_as_bottom_overlay(&window)?;
        let _ = window.set_always_on_top(true);
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn position_launcher(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        position_window_as_bottom_overlay(&window)?;
        let _ = window.set_always_on_top(true);
    }
    Ok(())
}

/// Docks the launcher to the bottom of the active monitor's work area. `work_area`
/// already excludes the Dock and the menu bar, so the bar floats right above the Dock.
fn position_window_as_bottom_overlay(window: &WebviewWindow) -> Result<(), String> {
    let Some(monitor) = window.current_monitor().map_err(|error| error.to_string())? else {
        window
            .set_size(Size::Logical(LogicalSize {
                width: LAUNCHER_WIDTH,
                height: LAUNCHER_HEIGHT,
            }))
            .map_err(|error| error.to_string())?;
        let _ = window.center();
        return Ok(());
    };

    let scale = monitor.scale_factor();
    let work_area = monitor.work_area();
    let work_x = work_area.position.x as f64 / scale;
    let work_y = work_area.position.y as f64 / scale;
    let work_width = work_area.size.width as f64 / scale;
    let work_height = work_area.size.height as f64 / scale;

    let available_width = (work_width - SIDE_INSET).max(320.0);
    let width = LAUNCHER_WIDTH
        .min(available_width)
        .max(MINIMUM_WIDTH.min(available_width));
    let height = LAUNCHER_HEIGHT.min((work_height - BOTTOM_OVERLAY_MARGIN * 2.0).max(280.0));
    let x = work_x + (work_width - width) / 2.0;
    let y = work_y + work_height - height - BOTTOM_OVERLAY_MARGIN;

    window
        .set_size(Size::Logical(LogicalSize { width, height }))
        .map_err(|error| error.to_string())?;
    window
        .set_position(Position::Logical(LogicalPosition { x, y }))
        .map_err(|error| error.to_string())?;
    Ok(())
}
