// ─── Types ───

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  categoryId: string;
  publishedAt: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  author?: string;
  sourceType: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  order: number;
}

export interface JsonMapping {
  itemsPath?: string;
  titlePath?: string;
  urlPath?: string;
  descriptionPath?: string;
  datePath?: string;
  imageUrlPath?: string;
}

export interface StoredSource {
  id: string;
  name: string;
  categoryId: string;
  type: string;
  url: string;
  icon?: string;
  enabled: boolean;
  transformType: string;
  jsonMapping?: JsonMapping;
}

export interface UserSettings {
  categories: Category[];
  sources: StoredSource[];
  maxItemsPerSource: number;
  refreshIntervalHours: number;
  homepagePreviewCount: number;
  maxItemAgeDays: number;
}

export interface Digest {
  date: string;
  hour: string;
  generatedAt: string;
  sections: Record<string, FeedItem[]>;
  categories: Category[];
  sourceCounts: Record<string, number>;
}

export interface ArchiveEntry {
  date: string;
  hour: string;
  path: string;
}

export interface TestResult {
  success: boolean;
  type?: string;
  title?: string;
  items: { index: number; title: string; url: string }[];
  error?: string;
  topKeys?: string[];
}

// ─── Environment Detection ───

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Tauri is available at build time (static import), but invoke is a no-op outside Tauri.
// We dynamically import to avoid hard crash when not in Tauri context.
let invokeFn: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

async function getInvoke() {
  if (!invokeFn && isTauri()) {
    const mod = await import('@tauri-apps/api/core');
    invokeFn = mod.invoke;
  }
  return invokeFn;
}

// ─── API Helpers (web fallback) ───

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Settings ───

export async function getSettings(): Promise<UserSettings> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('get_settings') as Promise<UserSettings>;
  }
  const data = await apiFetch<{ settings: UserSettings }>('/api/settings');
  return data.settings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('save_settings', { settings }) as Promise<void>;
  }
  await apiFetch('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

// ─── Categories ───

export async function addCategory(name: string, slug?: string, enabled?: boolean): Promise<Category> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('add_category', { name, slug, enabled }) as Promise<Category>;
  }
  const data = await apiFetch<{ category: Category }>('/api/settings/categories', {
    method: 'POST',
    body: JSON.stringify({ name, slug, enabled }),
  });
  return data.category;
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; enabled?: boolean; order?: number }): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('update_category', { id, ...data }) as Promise<void>;
  }
  await apiFetch('/api/settings/categories', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('delete_category', { id }) as Promise<void>;
  }
  await apiFetch(`/api/settings/categories?id=${id}`, {
    method: 'DELETE',
  });
}

// ─── Sources ───

export async function addSource(data: { name: string; url: string; categoryId: string; type?: string; icon?: string; enabled?: boolean; transformType?: string }): Promise<StoredSource> {
  const invoke = await getInvoke();
  if (invoke) {
    // Tauri maps Rust source_type -> JS sourceType
    return invoke('add_source', {
      name: data.name,
      url: data.url,
      categoryId: data.categoryId,
      sourceType: data.type,
      icon: data.icon,
      enabled: data.enabled,
      transformType: data.transformType,
    }) as Promise<StoredSource>;
  }
  const res = await apiFetch<StoredSource>('/api/settings/sources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateSource(id: string, data: { name?: string; url?: string; categoryId?: string; icon?: string; enabled?: boolean }): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('update_source', { id, ...data }) as Promise<void>;
  }
  await apiFetch('/api/settings/sources', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteSource(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('delete_source', { id }) as Promise<void>;
  }
  await apiFetch(`/api/settings/sources?id=${id}`, {
    method: 'DELETE',
  });
}

// ─── Digest ───

export async function getLatestDigest(): Promise<Digest | null> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('get_latest_digest') as Promise<Digest | null>;
  }
  try {
    // API returns digest directly (not wrapped in { digest })
    const data = await apiFetch<Digest>('/api/digest');
    return data;
  } catch {
    return null;
  }
}

export async function getDigest(date: string, hour?: string): Promise<Digest | null> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('get_digest', { date, hour }) as Promise<Digest | null>;
  }
  const params = new URLSearchParams({ date });
  if (hour) params.set('hour', hour);
  try {
    const data = await apiFetch<Digest>(`/api/digest?${params}`);
    return data;
  } catch {
    return null;
  }
}

export async function listArchives(): Promise<ArchiveEntry[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('list_archives') as Promise<ArchiveEntry[]>;
  }
  // API returns [{ date, hours: [{ hour, path }] }] - flatten to ArchiveEntry[]
  const data = await apiFetch<Array<{ date: string; hours: Array<{ hour: string; path: string }> }>>('/api/archive');
  const result: ArchiveEntry[] = [];
  for (const entry of data) {
    for (const h of entry.hours) {
      result.push({ date: entry.date, hour: h.hour, path: h.path });
    }
  }
  return result;
}

export async function generateNow(): Promise<Digest> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('generate_now') as Promise<Digest>;
  }
  // API POST triggers generation, then we fetch the result
  const genResult = await apiFetch<{ success: boolean; date: string; hour: string }>('/api/digest', {
    method: 'POST',
  });
  const digest = await getDigest(genResult.date, genResult.hour);
  if (!digest) throw new Error('Failed to fetch generated digest');
  return digest;
}

// ─── Test ───

export async function testSource(url: string, sourceType: string): Promise<TestResult> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke('test_source', { url, sourceType }) as Promise<TestResult>;
  }
  // API returns { success, type, items, topKeys } or { error }
  const data = await apiFetch<{ success?: boolean; type?: string; items?: TestResult['items']; topKeys?: string[]; error?: string }>('/api/settings/source-test', {
    method: 'POST',
    body: JSON.stringify({ url, sourceType }),
  });
  if (data.error) {
    return { success: false, error: data.error, items: [] };
  }
  return {
    success: true,
    type: data.type,
    items: data.items || [],
    topKeys: data.topKeys,
  };
}
