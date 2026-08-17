import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, Category, Clip } from "../types";

export function searchClips(params: {
  query?: string;
  filter?: "all" | "favorites";
  categoryId?: string | null;
  limit?: number;
}) {
  return invoke<Clip[]>("search_clips", {
    query: params.query ?? "",
    filter: params.filter ?? "all",
    categoryId: params.categoryId ?? null,
    limit: params.limit ?? 300,
  });
}

export function getCategories() {
  return invoke<Category[]>("get_categories");
}

export function createCategory(input: { name: string; color: string; icon?: string | null }) {
  return invoke<Category>("create_category", input);
}

export function updateCategory(input: { id: string; name: string; color: string; icon?: string | null }) {
  return invoke<Category>("update_category", input);
}

export function deleteCategory(id: string) {
  return invoke<void>("delete_category", { id });
}

export function toggleFavorite(id: string) {
  return invoke<Clip>("toggle_favorite", { id });
}

export function deleteClip(id: string) {
  return invoke<void>("delete_clip", { id });
}

export function copyClip(id: string) {
  return invoke<void>("copy_clip", { id });
}

export function moveClipToCategory(id: string, categoryId: string | null) {
  return invoke<Clip>("move_clip_to_category", { id, categoryId });
}

export function getSettings() {
  return invoke<AppSettings>("get_settings");
}

export function updateSettings(settings: AppSettings) {
  return invoke<AppSettings>("update_settings", { settings });
}

export function setTrackingPaused(paused: boolean) {
  return invoke<boolean>("set_tracking_paused", { paused });
}

export function clearHistory() {
  return invoke<void>("clear_history");
}

export function hideWindow() {
  return invoke<void>("hide_window");
}

export function showSettingsWindow() {
  return invoke<void>("show_settings_window");
}

export function seedDevData() {
  return invoke<void>("seed_dev_data");
}
