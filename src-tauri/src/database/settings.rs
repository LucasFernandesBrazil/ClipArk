use rusqlite::{params, Connection, Result};

use crate::models::AppSettings;

pub fn get(connection: &Connection) -> Result<AppSettings> {
    Ok(AppSettings {
        launch_at_startup: get_bool(connection, "launch_at_startup", false)?,
        max_stored_clips: get_limit(connection)?,
        tracking_paused: get_tracking_paused(connection)?,
    })
}

pub fn save(connection: &Connection, settings: &AppSettings) -> Result<()> {
    set_value(connection, "launch_at_startup", if settings.launch_at_startup { "true" } else { "false" })?;
    let max_value = settings
        .max_stored_clips
        .map(|value| value.to_string())
        .unwrap_or_else(|| "unlimited".to_string());
    set_value(connection, "max_stored_clips", &max_value)?;
    set_value(connection, "tracking_paused", if settings.tracking_paused { "true" } else { "false" })?;
    Ok(())
}

pub fn set_tracking_paused(connection: &Connection, paused: bool) -> Result<()> {
    set_value(connection, "tracking_paused", if paused { "true" } else { "false" })
}

pub fn get_tracking_paused(connection: &Connection) -> Result<bool> {
    get_bool(connection, "tracking_paused", false)
}

pub fn get_limit(connection: &Connection) -> Result<Option<i64>> {
    let value: String = connection
        .query_row("SELECT value FROM settings WHERE key = 'max_stored_clips'", [], |row| row.get(0))
        .unwrap_or_else(|_| "5000".into());
    if value == "unlimited" {
        Ok(None)
    } else {
        Ok(value.parse::<i64>().ok().or(Some(5000)))
    }
}

fn get_bool(connection: &Connection, key: &str, default: bool) -> Result<bool> {
    let value: String = connection
        .query_row("SELECT value FROM settings WHERE key = ?1", params![key], |row| row.get(0))
        .unwrap_or_else(|_| if default { "true".into() } else { "false".into() });
    Ok(value == "true")
}

fn set_value(connection: &Connection, key: &str, value: &str) -> Result<()> {
    connection.execute(
        "INSERT INTO settings(key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}
