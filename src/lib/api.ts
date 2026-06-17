import { invoke } from "@tauri-apps/api/core";
import type {
  UserSettings,
  Category,
  StoredSource,
  Digest,
  ArchiveEntry,
  TestResult,
} from "../types";

export function getSettings(): Promise<UserSettings> {
  return invoke("get_settings");
}

export function saveSettings(settings: UserSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export function addCategory(
  name: string,
  slug?: string,
  enabled?: boolean,
): Promise<Category> {
  return invoke("add_category", { name, slug, enabled });
}

export function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    enabled?: boolean;
    order?: number;
  },
): Promise<void> {
  return invoke("update_category", { id, ...data });
}

export function deleteCategory(id: string): Promise<void> {
  return invoke("delete_category", { id });
}

export function addSource(data: {
  name: string;
  url: string;
  categoryId: string;
  type?: string;
  icon?: string;
  enabled?: boolean;
  transformType?: string;
}): Promise<StoredSource> {
  return invoke("add_source", {
    name: data.name,
    url: data.url,
    categoryId: data.categoryId,
    sourceType: data.type,
    icon: data.icon,
    enabled: data.enabled,
    transformType: data.transformType,
  });
}

export function updateSource(
  id: string,
  data: {
    name?: string;
    url?: string;
    categoryId?: string;
    icon?: string;
    enabled?: boolean;
  },
): Promise<void> {
  return invoke("update_source", { id, ...data });
}

export function deleteSource(id: string): Promise<void> {
  return invoke("delete_source", { id });
}

export function getLatestDigest(): Promise<Digest | null> {
  return invoke("get_latest_digest");
}

export function getDigest(
  date: string,
  hour?: string,
): Promise<Digest | null> {
  return invoke("get_digest", { date, hour });
}

export function listArchives(): Promise<ArchiveEntry[]> {
  return invoke("list_archives");
}

export function generateNow(): Promise<Digest> {
  return invoke("generate_now");
}

export function testSource(
  url: string,
  sourceType: string,
): Promise<TestResult> {
  return invoke("test_source", { url, sourceType });
}
