//! Synthesises a Cmd+V into whatever app was frontmost before the launcher opened.
//!
//! The launcher runs with `ActivationPolicy::Accessory`, so hiding its window makes
//! macOS reactivate the previously frontmost app on its own — we only need to wait
//! for that hand-off to settle before posting the keystroke.

#[cfg(target_os = "macos")]
use std::time::Duration;

/// Marker returned to the frontend so it can offer to open System Settings.
pub const ACCESSIBILITY_DENIED: &str = "accessibility-denied";

#[cfg(target_os = "macos")]
const FOCUS_HANDOFF: Duration = Duration::from_millis(120);

#[cfg(target_os = "macos")]
const KEY_CODE_V: core_graphics::event::CGKeyCode = 0x09;

#[cfg(target_os = "macos")]
pub fn accessibility_granted() -> bool {
    macos_accessibility_client::accessibility::application_is_trusted()
}

#[cfg(not(target_os = "macos"))]
pub fn accessibility_granted() -> bool {
    true
}

/// Shows the native "grant Accessibility access" prompt. Returns the status as of
/// right now — the user usually grants it after this call returns.
#[cfg(target_os = "macos")]
pub fn request_accessibility() -> bool {
    macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
}

#[cfg(not(target_os = "macos"))]
pub fn request_accessibility() -> bool {
    true
}

/// Posts Cmd+V to the system. Call *after* the launcher window is hidden.
#[cfg(target_os = "macos")]
pub fn paste_to_frontmost() -> Result<(), String> {
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    if !accessibility_granted() {
        return Err(ACCESSIBILITY_DENIED.to_string());
    }

    std::thread::sleep(FOCUS_HANDOFF);

    let post = |key_down: bool| -> Result<(), String> {
        let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
            .map_err(|_| "Could not create a keyboard event source".to_string())?;
        let event = CGEvent::new_keyboard_event(source, KEY_CODE_V, key_down)
            .map_err(|_| "Could not create the paste keystroke".to_string())?;
        event.set_flags(CGEventFlags::CGEventFlagCommand);
        event.post(CGEventTapLocation::HID);
        Ok(())
    };

    post(true)?;
    post(false)?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn paste_to_frontmost() -> Result<(), String> {
    Err("Auto-paste is only supported on macOS".to_string())
}
