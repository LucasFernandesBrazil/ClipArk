import type { ClipType } from "../types";

export function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function typeLabel(type: ClipType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function hostname(content: string) {
  try {
    return new URL(content).hostname.replace(/^www\./, "");
  } catch {
    return content;
  }
}

export function previewText(content: string, max = 420) {
  const singleLine = content.replace(/\s+/g, " ").trim();
  return singleLine.length > max ? `${singleLine.slice(0, max - 1)}...` : singleLine;
}
