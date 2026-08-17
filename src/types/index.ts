export type ClipType = "text" | "code" | "url" | "email" | "color" | "json";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Clip = {
  id: string;
  content: string;
  normalizedContent: string;
  contentHash: string;
  type: ClipType;
  sourceApp?: string | null;
  favorite: boolean;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  copiedCount: number;
  createdAt: string;
  lastCopiedAt: string;
};

export type AppSettings = {
  launchAtStartup: boolean;
  maxStoredClips: number | null;
  trackingPaused: boolean;
  autoPaste: boolean;
};

export type ClipFilter = "all" | "favorites" | "settings";
