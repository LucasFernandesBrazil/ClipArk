use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension, Result, Row};
use uuid::Uuid;

use crate::models::Category;

pub fn all(connection: &Connection) -> Result<Vec<Category>> {
    let mut statement =
        connection.prepare("SELECT id, name, color, icon, created_at, updated_at FROM categories ORDER BY lower(name) ASC")?;
    let rows = statement.query_map([], map_category)?;
    rows.collect()
}

pub fn create(connection: &Connection, name: &str, color: &str, icon: Option<String>) -> Result<Category> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    connection.execute(
        "INSERT INTO categories(id, name, color, icon, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![id, name.trim(), color, icon, now],
    )?;
    get(connection, &id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn update(connection: &Connection, id: &str, name: &str, color: &str, icon: Option<String>) -> Result<Category> {
    let now = Utc::now().to_rfc3339();
    connection.execute(
        "UPDATE categories SET name = ?1, color = ?2, icon = ?3, updated_at = ?4 WHERE id = ?5",
        params![name.trim(), color, icon, now, id],
    )?;
    get(connection, id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn delete(connection: &Connection, id: &str) -> Result<()> {
    connection.execute("UPDATE clips SET category_id = NULL WHERE category_id = ?1", params![id])?;
    connection.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    Ok(())
}

fn get(connection: &Connection, id: &str) -> Result<Option<Category>> {
    connection
        .query_row(
            "SELECT id, name, color, icon, created_at, updated_at FROM categories WHERE id = ?1",
            params![id],
            map_category,
        )
        .optional()
}

fn map_category(row: &Row<'_>) -> Result<Category> {
    Ok(Category {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
        icon: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}
