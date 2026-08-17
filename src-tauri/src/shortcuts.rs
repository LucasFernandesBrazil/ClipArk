use tauri::{
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Position, Size, WebviewWindow,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const LAUNCHER_WIDTH: f64 = 1180.0;
const LAUNCHER_HEIGHT: f64 = 420.0;
const TOP_OVERLAY_MARGIN: f64 = 28.0;

pub fn plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                let _ = show_launcher(app);
                let _ = app.emit("launcher-opened", ());
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

pub fn show_launcher(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        position_window_as_top_overlay(&window)?;
        let _ = window.set_always_on_top(true);
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn position_launcher(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        position_window_as_top_overlay(&window)?;
        let _ = window.set_always_on_top(true);
    }
    Ok(())
}

fn position_window_as_top_overlay(window: &WebviewWindow) -> Result<(), String> {
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

    let available_width = (work_width - 32.0).max(320.0);
    let minimum_width = 760.0_f64.min(available_width);
    let width = LAUNCHER_WIDTH.min(available_width).max(minimum_width);
    let height = LAUNCHER_HEIGHT.min((work_height - TOP_OVERLAY_MARGIN - 16.0).max(320.0));
    let x = work_x + (work_width - width) / 2.0;
    let y = work_y + TOP_OVERLAY_MARGIN;

    window
        .set_size(Size::Logical(LogicalSize { width, height }))
        .map_err(|error| error.to_string())?;
    window
        .set_position(Position::Logical(LogicalPosition { x, y }))
        .map_err(|error| error.to_string())?;
    Ok(())
}
