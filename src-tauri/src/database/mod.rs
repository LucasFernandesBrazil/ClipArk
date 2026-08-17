pub mod categories;
pub mod clips;
pub mod settings;

use std::fs;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

const INIT_SQL: &str = include_str!("../../migrations/001_init.sql");

pub fn connect(app: &AppHandle) -> Result<Connection, tauri::Error> {
    let data_dir = app.path().app_data_dir()?;
    fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join("clipark.sqlite3");
    let connection = Connection::open(db_path).map_err(|error| tauri::Error::Anyhow(error.into()))?;
    connection
        .execute_batch(INIT_SQL)
        .map_err(|error| tauri::Error::Anyhow(error.into()))?;
    Ok(connection)
}
