use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

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
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: 940.0,
            height: 640.0,
        }));
        let _ = window.center();
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }
    Ok(())
}
