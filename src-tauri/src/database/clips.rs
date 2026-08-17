use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension, Result, Row};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::models::Clip;

pub fn normalize_content(content: &str) -> String {
    content
        .replace("\r\n", "\n")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_lowercase()
}

pub fn content_hash(normalized: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(normalized.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn detect_type(content: &str) -> String {
    let trimmed = content.trim();
    let lower = trimmed.to_lowercase();

    if is_hex_color(trimmed) {
        return "color".into();
    }
    if is_email(trimmed) {
        return "email".into();
    }
    if lower.starts_with("http://") || lower.starts_with("https://") {
        return "url".into();
    }
    if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
        return "json".into();
    }
    if looks_like_code(trimmed) {
        return "code".into();
    }
    "text".into()
}

pub fn upsert_clip(connection: &Connection, content: &str, source_app: Option<&str>) -> Result<Clip> {
    let normalized = normalize_content(content);
    let hash = content_hash(&normalized);
    let clip_type = detect_type(content);
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    connection.execute(
        "INSERT INTO clips (
            id, content, normalized_content, content_hash, type, source_app, favorite, copied_count, created_at, last_copied_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 1, ?7, ?7)
          ON CONFLICT(content_hash) DO UPDATE SET
            content = excluded.content,
            normalized_content = excluded.normalized_content,
            type = excluded.type,
            source_app = COALESCE(excluded.source_app, clips.source_app),
            copied_count = clips.copied_count + 1,
            last_copied_at = excluded.last_copied_at",
        params![id, content, normalized, hash, clip_type, source_app, now],
    )?;

    get_clip_by_hash(connection, &hash)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn search(
    connection: &Connection,
    query: &str,
    filter: &str,
    category_id: Option<String>,
    limit: i64,
) -> Result<Vec<Clip>> {
    let normalized_query = normalize_content(query);
    let like = format!("%{}%", normalized_query);
    let limit = limit.clamp(1, 500);
    let mut statement = connection.prepare(
        "SELECT
            c.id, c.content, c.normalized_content, c.content_hash, c.type, c.source_app,
            c.favorite, c.category_id, cat.name, cat.color, c.copied_count, c.created_at, c.last_copied_at
          FROM clips c
          LEFT JOIN categories cat ON cat.id = c.category_id
          WHERE (?1 = '%%' OR c.normalized_content LIKE ?1 OR c.type LIKE ?1 OR lower(cat.name) LIKE ?1)
            AND (?2 != 'favorites' OR c.favorite = 1)
            AND (?3 IS NULL OR c.category_id = ?3)
          ORDER BY c.last_copied_at DESC
          LIMIT ?4",
    )?;
    let rows = statement.query_map(params![like, filter, category_id, limit], map_clip)?;
    rows.collect()
}

pub fn get_clip(connection: &Connection, id: &str) -> Result<Option<Clip>> {
    connection
        .query_row(
            "SELECT
              c.id, c.content, c.normalized_content, c.content_hash, c.type, c.source_app,
              c.favorite, c.category_id, cat.name, cat.color, c.copied_count, c.created_at, c.last_copied_at
            FROM clips c
            LEFT JOIN categories cat ON cat.id = c.category_id
            WHERE c.id = ?1",
            params![id],
            map_clip,
        )
        .optional()
}

pub fn get_clip_by_hash(connection: &Connection, hash: &str) -> Result<Option<Clip>> {
    connection
        .query_row(
            "SELECT
              c.id, c.content, c.normalized_content, c.content_hash, c.type, c.source_app,
              c.favorite, c.category_id, cat.name, cat.color, c.copied_count, c.created_at, c.last_copied_at
            FROM clips c
            LEFT JOIN categories cat ON cat.id = c.category_id
            WHERE c.content_hash = ?1",
            params![hash],
            map_clip,
        )
        .optional()
}

pub fn toggle_favorite(connection: &Connection, id: &str) -> Result<Clip> {
    connection.execute("UPDATE clips SET favorite = CASE favorite WHEN 1 THEN 0 ELSE 1 END WHERE id = ?1", params![id])?;
    get_clip(connection, id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn delete_clip(connection: &Connection, id: &str) -> Result<()> {
    connection.execute("DELETE FROM clips WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn clear_history(connection: &Connection) -> Result<()> {
    connection.execute("DELETE FROM clips", [])?;
    Ok(())
}

pub fn move_to_category(connection: &Connection, id: &str, category_id: Option<String>) -> Result<Clip> {
    connection.execute("UPDATE clips SET category_id = ?1 WHERE id = ?2", params![category_id, id])?;
    get_clip(connection, id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
}

pub fn prune(connection: &Connection, max_stored_clips: Option<i64>) -> Result<()> {
    let Some(limit) = max_stored_clips else {
        return Ok(());
    };
    connection.execute(
        "DELETE FROM clips
         WHERE favorite = 0
           AND id IN (
             SELECT id FROM clips
             WHERE favorite = 0
             ORDER BY last_copied_at DESC
             LIMIT -1 OFFSET ?1
           )",
        params![limit],
    )?;
    Ok(())
}

fn map_clip(row: &Row<'_>) -> Result<Clip> {
    Ok(Clip {
        id: row.get(0)?,
        content: row.get(1)?,
        normalized_content: row.get(2)?,
        content_hash: row.get(3)?,
        clip_type: row.get(4)?,
        source_app: row.get(5)?,
        favorite: row.get::<_, i64>(6)? == 1,
        category_id: row.get(7)?,
        category_name: row.get(8)?,
        category_color: row.get(9)?,
        copied_count: row.get(10)?,
        created_at: row.get(11)?,
        last_copied_at: row.get(12)?,
    })
}

fn is_hex_color(value: &str) -> bool {
    let bytes = value.as_bytes();
    (bytes.len() == 4 || bytes.len() == 7)
        && bytes[0] == b'#'
        && bytes[1..].iter().all(|byte| byte.is_ascii_hexdigit())
}

fn is_email(value: &str) -> bool {
    if value.contains(char::is_whitespace) || !value.contains('@') {
        return false;
    }
    let mut parts = value.split('@');
    let local = parts.next().unwrap_or_default();
    let domain = parts.next().unwrap_or_default();
    parts.next().is_none() && !local.is_empty() && domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.')
}

fn looks_like_code(value: &str) -> bool {
    let lower = value.to_lowercase();
    let code_tokens = [
        "const ",
        "let ",
        "var ",
        "function ",
        "=>",
        "import ",
        "export ",
        "class ",
        "def ",
        "fn ",
        "pub ",
        "impl ",
        "return ",
        "await ",
        "async ",
        "select ",
        "insert ",
        "update ",
        "delete from",
        "#include",
        "<?php",
        "</",
    ];
    let structural = value.contains('{') && value.contains('}') && (value.contains(';') || value.contains("=>"));
    structural || code_tokens.iter().any(|token| lower.contains(token))
}
