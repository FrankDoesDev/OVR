import { useState, useEffect } from "react";
import type { UserSettings, StoredSource } from "../types";
import {
  getSettings,
  saveSettings,
  addCategory,
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

  // Add source form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTransform, setNewTransform] = useState("rss");
  const [newIcon, setNewIcon] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Add category form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      onRefreshCategories();
      showMessage("Settings saved");
    } catch (e) {
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
    } catch (e) {
      showMessage("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      const s = await getSettings();
      setSettings(s);
      onRefreshCategories();
      showMessage("Category deleted");
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    <div className="pt-6 space-y-10 max-w-2xl">
      <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-[1.7]">
        Settings
      </h1>

      {message && (
        <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg px-4 py-2">
          {message}
        </p>
      )}

      {/* General */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
          General
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Items per source
            </span>
            <input
              type="number"
              value={settings.maxItemsPerSource}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxItemsPerSource: parseInt(e.target.value) || 10,
                })
              }
              className="w-20 px-2 py-1 text-xs text-right bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Refresh interval (hours)
            </span>
            <input
              type="number"
              value={settings.refreshIntervalHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  refreshIntervalHours: parseInt(e.target.value) || 6,
                })
              }
              className="w-20 px-2 py-1 text-xs text-right bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Homepage preview count
            </span>
            <input
              type="number"
              value={settings.homepagePreviewCount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  homepagePreviewCount: parseInt(e.target.value) || 4,
                })
              }
              className="w-20 px-2 py-1 text-xs text-right bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Max item age (days)
            </span>
            <input
              type="number"
              value={settings.maxItemAgeDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxItemAgeDays: parseInt(e.target.value) || 2,
                })
              }
              className="w-20 px-2 py-1 text-xs text-right bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
            />
          </label>
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
          Categories
        </h2>
        <div className="space-y-2 mb-4">
          {settings.categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]"
            >
              <span className="text-xs font-medium text-[var(--text-primary)] flex-1">
                {cat.name}
              </span>
              <span className="text-[0.6rem] text-[var(--text-tertiary)] font-mono">
                {cat.slug}
              </span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
            className="flex-1 px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            placeholder="slug (optional)"
            className="w-28 px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          <button
            onClick={handleAddCategory}
            className="px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
          >
            Add
          </button>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
          Sources
        </h2>

        {/* Add source form */}
        <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] mb-4 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)]">
            Add Source
          </h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Source name"
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Feed URL"
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
            >
              <option value="">Select category</option>
              {settings.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={newTransform}
              onChange={(e) => setNewTransform(e.target.value)}
              className="w-28 px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
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
            className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
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

        {/* Source list */}
        <div className="space-y-1">
          {settings.sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]"
            >
              <button
                onClick={() => handleToggleSource(source)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  source.enabled
                    ? "bg-[var(--gaming)] border-[var(--gaming)]"
                    : "border-[var(--border-primary)]"
                }`}
              >
                {source.enabled && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              {source.icon && (
                <span className="text-sm flex-shrink-0">{source.icon}</span>
              )}
              <span className="text-xs text-[var(--text-primary)] flex-1 truncate">
                {source.name}
              </span>
              <span className="text-[0.6rem] text-[var(--text-tertiary)] font-mono hidden sm:inline truncate max-w-[120px]">
                {source.url}
              </span>
              <button
                onClick={() => handleDeleteSource(source.id)}
                className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
