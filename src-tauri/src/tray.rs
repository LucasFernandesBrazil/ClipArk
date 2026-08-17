use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager,
};

pub fn setup(app: &mut App) -> Result<(), tauri::Error> {
    let open = MenuItem::with_id(app, "open", "Open ClipArk", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause Clipboard Tracking", true, None::<&str>)?;
    let resume = MenuItem::with_id(app, "resume", "Resume Clipboard Tracking", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open, &sep1, &pause, &resume, &settings, &sep2, &quit])?;

    let mut builder = TrayIconBuilder::with_id("clipark-tray")
        .tooltip("ClipArk")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                let _ = crate::shortcuts::show_launcher(app);
                let _ = app.emit("launcher-opened", ());
            }
            "pause" => set_tracking(app, true),
            "resume" => set_tracking(app, false),
            "settings" => {
                let _ = crate::shortcuts::show_launcher(app);
                let _ = app.emit("open-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

fn set_tracking(app: &tauri::AppHandle, paused: bool) {
    let state = app.state::<crate::AppState>();
    if let Ok(connection) = state.db.lock() {
        let _ = crate::database::settings::set_tracking_paused(&connection, paused);
    }
    state
        .tracking_paused
        .store(paused, std::sync::atomic::Ordering::Relaxed);
    let _ = app.emit("clips-changed", ());
}
