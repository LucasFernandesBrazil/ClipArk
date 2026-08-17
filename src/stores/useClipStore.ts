import { create } from "zustand";
import type { AppSettings, Category, Clip, ClipFilter } from "../types";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getSettings,
  searchClips,
  setTrackingPaused,
  updateSettings,
} from "../lib/tauri";

type ClipState = {
  clips: Clip[];
  categories: Category[];
  settings: AppSettings | null;
  query: string;
  filter: ClipFilter;
  selectedId: string | null;
  activeCategoryId: string | null;
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  setFilter: (filter: ClipFilter) => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  setSelectedId: (clipId: string | null) => void;
  loadAll: () => Promise<void>;
  refreshClips: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  createCategory: (name: string, color: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setTrackingPaused: (paused: boolean) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
};

export const useClipStore = create<ClipState>((set, get) => ({
  clips: [],
  categories: [],
  settings: null,
  query: "",
  filter: "all",
  selectedId: null,
  activeCategoryId: null,
  loading: false,
  error: null,
  setQuery: (query) => set({ query }),
  setFilter: (filter) => set({ filter, activeCategoryId: null, selectedId: null }),
  setActiveCategoryId: (categoryId) => set({ activeCategoryId: categoryId, filter: "all", selectedId: null }),
  setSelectedId: (clipId) => set({ selectedId: clipId }),
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
      set({ categories, settings });
      await get().refreshClips();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },
  refreshClips: async () => {
    const { query, filter, activeCategoryId, selectedId } = get();
    if (filter === "settings") return;
    const clips = await searchClips({
      query,
      filter: filter === "favorites" ? "favorites" : "all",
      categoryId: activeCategoryId,
      limit: 350,
    });
    set({ clips, selectedId: clips.some((clip) => clip.id === selectedId) ? selectedId : clips[0]?.id ?? null });
  },
  refreshCategories: async () => {
    set({ categories: await getCategories() });
  },
  createCategory: async (name, color) => {
    await createCategory({ name, color });
    await get().refreshCategories();
  },
  deleteCategory: async (id) => {
    await deleteCategory(id);
    set({ activeCategoryId: null });
    await Promise.all([get().refreshCategories(), get().refreshClips()]);
  },
  setTrackingPaused: async (paused) => {
    await setTrackingPaused(paused);
    set((state) => ({ settings: state.settings ? { ...state.settings, trackingPaused: paused } : state.settings }));
  },
  saveSettings: async (settings) => {
    set({ settings: await updateSettings(settings) });
  },
}));
