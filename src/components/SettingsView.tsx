import { useState, useEffect } from "react";
import type { UserSettings, StoredSource } from "../types";
import {
  getSettings,
  saveSettings,
  addCategory,
  updateCategory,
  deleteCategory,
  addSource,
  updateSource,
  deleteSource,
  testSource,
} from "../lib/api";

export default function SettingsView({
  onRefreshCategories,
}: {
  onRefreshCategories: () => void;
}) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTransform, setNewTransform] = useState("rss");
  const [newIcon, setNewIcon] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  let messageTimeout: ReturnType<typeof setTimeout> | null = null;
  const showMessage = (msg: string) => {
    if (messageTimeout) clearTimeout(messageTimeout);
    setMessage(msg);
    messageTimeout = setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      onRefreshCategories();
      showMessage("Settings saved");
    } catch {
      showMessage("Failed to save settings");
    }
    setSaving(false);
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    try {
      const slug = catSlug.trim() || undefined;
      await addCategory(catName.trim(), slug);
      setCatName("");
      setCatSlug("");
      const s = await getSettings();
      setSettings(s);
      onRefreshCategories();
      showMessage("Category added");
    } catch {
      showMessage("Failed to add category");
    }
  };

  const handleToggleCategory = async (id: string, enabled: boolean) => {
    try {
      await updateCategory(id, { enabled });
      const s = await getSettings();
      setSettings(s);
    } catch {
      showMessage("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      const s = await getSettings();
      setSettings(s);
      onRefreshCategories();
      showMessage("Category deleted");
    } catch {
      showMessage("Failed to delete category");
    }
  };

  const handleAddSource = async () => {
    if (!newName.trim() || !newUrl.trim() || !newCategory) {
      showMessage("Name, URL, and category are required");
      return;
    }
    try {
      await addSource({
        name: newName.trim(),
        url: newUrl.trim(),
        categoryId: newCategory,
        type: newTransform,
        transformType: newTransform,
        icon: newIcon.trim() || undefined,
      });
      setNewName("");
      setNewUrl("");
      setNewIcon("");
      setTestResult(null);
      const s = await getSettings();
      setSettings(s);
      showMessage("Source added");
    } catch {
      showMessage("Failed to add source");
    }
  };

  const handleToggleSource = async (source: StoredSource) => {
    try {
      await updateSource(source.id, { enabled: !source.enabled });
      const s = await getSettings();
      setSettings(s);
    } catch {
      showMessage("Failed to update source");
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteSource(id);
      const s = await getSettings();
      setSettings(s);
      showMessage("Source deleted");
    } catch {
      showMessage("Failed to delete source");
    }
  };

  const handleStartEdit = (source: StoredSource) => {
    setEditingSourceId(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
    setEditCategoryId(source.categoryId);
  };

  const handleCancelEdit = () => {
    setEditingSourceId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editUrl.trim() || !editCategoryId) {
      showMessage("Name, URL, and category are required");
      return;
    }
    try {
      await updateSource(id, {
        name: editName.trim(),
        url: editUrl.trim(),
        categoryId: editCategoryId,
      });
      const s = await getSettings();
      setSettings(s);
      setEditingSourceId(null);
      showMessage("Source updated");
    } catch {
      showMessage("Failed to update source");
    }
  };

  const handleTestSource = async () => {
    if (!newUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSource(newUrl.trim(), newTransform);
      if (result.success && result.items.length > 0) {
        setTestResult(
          `Found ${result.items.length} item(s). First: "${result.items[0].title}"`,
        );
      } else if (result.success) {
        setTestResult("Source responded but no items found");
      } else {
        setTestResult(`Error: ${result.error}`);
      }
    } catch {
      setTestResult("Test failed");
    }
    setTesting(false);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="pt-6 space-y-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] text-center">
        Settings
      </h1>

      {message && (
        <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-center">
          {message}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider text-center">
          General
        </h2>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] divide-y divide-[var(--border-primary)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Items per source
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.maxItemsPerSource}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxItemsPerSource: Math.max(1, parseInt(e.target.value) || 10),
                })
              }
              className="w-16 px-2 py-1 text-xs text-center bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Refresh interval
            </span>
            <select
              value={settings.refreshIntervalHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  refreshIntervalHours: parseInt(e.target.value),
                })
              }
              className="w-32 px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
            >
              <option value={1}>Every hour</option>
              <option value={2}>Every 2 hours</option>
              <option value={4}>Every 4 hours</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Once daily</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Homepage preview count
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.homepagePreviewCount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  homepagePreviewCount: Math.max(1, parseInt(e.target.value) || 4),
                })
              }
              className="w-16 px-2 py-1 text-xs text-center bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Max item age
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={90}
                value={settings.maxItemAgeDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxItemAgeDays: Math.max(1, parseInt(e.target.value) || 2),
                  })
                }
                className="w-16 px-2 py-1 text-xs text-center bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
              />
              <span className="text-[0.65rem] text-[var(--text-tertiary)]">days</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="px-6 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider text-center">
          Categories
        </h2>
        <div className="space-y-2 mb-4">
          {[...settings.categories]
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]"
              >
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cat.enabled}
                    onChange={(e) => handleToggleCategory(cat.id, e.target.checked)}
                  />
                  <div className="toggle-track" />
                </label>
                <span className={`text-xs font-medium flex-1 ${cat.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] line-through"}`}>
                  {cat.name}
                </span>
                <span className="text-[0.6rem] text-[var(--text-tertiary)] font-mono">
                  {cat.slug}
                </span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <input
            type="text"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            placeholder="slug (optional)"
            className="w-28 px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <button
            onClick={handleAddCategory}
            className="px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider text-center">
          Sources
        </h2>

        <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] mb-4 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)]">
            Add Source
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Source name"
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Feed URL"
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
            >
              <option value="">Select category</option>
              {settings.categories.sort((a, b) => a.order - b.order).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={newTransform}
              onChange={(e) => setNewTransform(e.target.value)}
              className="w-28 px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
            >
              <option value="rss">RSS</option>
              <option value="api-json">JSON API</option>
              <option value="youtube-rss">YouTube</option>
              <option value="twitter-rss">Twitter</option>
            </select>
          </div>
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="Icon emoji (optional)"
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleTestSource}
              disabled={testing || !newUrl.trim()}
              className="px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test"}
            </button>
            <button
              onClick={handleAddSource}
              className="px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
            >
              Add
            </button>
          </div>
          {testResult && (
            <p className="text-xs text-[var(--text-tertiary)]">{testResult}</p>
          )}
        </div>

        <div className="space-y-1">
          {settings.sources.map((source) =>
            editingSourceId === source.id ? (
              <div
                key={source.id}
                className="px-3 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hover)] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
                  />
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-28 px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                  >
                    {settings.categories.sort((a, b) => a.order - b.order).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="Feed URL"
                  className="w-full px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-hover)]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs rounded border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(source.id)}
                    className="px-3 py-1.5 text-xs rounded border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={source.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]"
              >
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => handleToggleSource(source)}
                  />
                  <div className="toggle-track" />
                </label>
                {source.icon && (
                  <span className="text-sm flex-shrink-0">{source.icon}</span>
                )}
                <span className={`text-xs flex-1 truncate ${source.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                  {source.name}
                </span>
                <span className="text-[0.6rem] text-[var(--text-tertiary)] font-mono hidden sm:inline truncate max-w-[120px]">
                  {source.url}
                </span>
                <button
                  onClick={() => handleStartEdit(source)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
