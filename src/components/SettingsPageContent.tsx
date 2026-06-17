'use client'

import { useState, useEffect, FormEvent } from 'react'
import * as tauri from '@/lib/tauri'
import { type UserSettings, type Category, type StoredSource } from '@/lib/tauri'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

export default function SettingsPageContent({ onNavigate, onRefreshCategories }: { onNavigate: (v: PageView) => void; onRefreshCategories?: () => void }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  const [newCategory, setNewCategory] = useState('')
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')

  const [newSource, setNewSource] = useState({ name: '', url: '', categoryId: '', type: 'rss', icon: '📡', transformType: 'rss' })
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings(isRefetch = false) {
    if (!isRefetch) setLoading(true)
    try {
      const s = await tauri.getSettings()
      setSettings(s)
    } catch (e) {
      console.error('[Settings] Failed to load settings:', e)
      setMessage('Failed to load settings')
    }
    setLoading(false)
  }

  async function saveGeneral() {
    if (!settings) return
    setSaving(true)
    setMessage('')
    try {
      await tauri.saveSettings(settings)
      setMessage('Settings saved. Changes apply on next digest.')
    } catch {
      setMessage('Failed to save settings')
    }
    setSaving(false)
  }

  async function addCategory() {
    if (!settings || !newCategory.trim()) return
    try {
      await tauri.addCategory(newCategory.trim())
      setNewCategory('')
      await fetchSettings(true)
      onRefreshCategories?.()
    } catch (e) {
      console.error('[Settings] addCategory failed:', e)
    }
  }

  async function updateCategory(id: string, data: { name?: string; slug?: string; enabled?: boolean; order?: number }) {
    try {
      await tauri.updateCategory(id, data)
      await fetchSettings(true)
      onRefreshCategories?.()
    } catch (e) {
      console.error('[Settings] updateCategory failed:', e)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Sources will be reassigned to the first category.')) return
    try {
      await tauri.deleteCategory(id)
      await fetchSettings(true)
      onRefreshCategories?.()
    } catch (e) {
      console.error('[Settings] deleteCategory failed:', e)
    }
  }

  async function moveCategory(id: string, dir: -1 | 1) {
    if (!settings) return
    try {
      const cats = settings.categories
      const idx = cats.findIndex((c) => c.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= cats.length) return
      const updated = cats.map((c, i) => {
        if (i === idx) return { ...c, order: newIdx }
        if (i === newIdx) return { ...c, order: idx }
        return c
      })
      const newSettings = { ...settings, categories: updated }
      await tauri.saveSettings(newSettings)
      await fetchSettings(true)
      onRefreshCategories?.()
    } catch (e) {
      console.error('[Settings] moveCategory failed:', e)
    }
  }

  async function toggleSource(id: string, enabled: boolean) {
    try {
      await tauri.updateSource(id, { enabled })
      await fetchSettings(true)
    } catch (e) {
      console.error('[Settings] toggleSource failed:', e)
    }
  }

  async function renameSource(id: string, name: string) {
    try {
      await tauri.updateSource(id, { name })
      await fetchSettings(true)
    } catch (e) {
      console.error('[Settings] renameSource failed:', e)
    }
  }

  async function moveSource(id: string, categoryId: string) {
    try {
      await tauri.updateSource(id, { categoryId })
      await fetchSettings(true)
    } catch (e) {
      console.error('[Settings] moveSource failed:', e)
    }
  }

  async function deleteSource(id: string) {
    try {
      await tauri.deleteSource(id)
      await fetchSettings(true)
    } catch (e) {
      console.error('[Settings] deleteSource failed:', e)
    }
  }

  async function handleTest() {
    if (!newSource.url) return
    setTesting(true)
    setTestResult(null)
    try {
      const result = await tauri.testSource(newSource.url, newSource.type)
      setTestResult(result)
    } catch {
      setTestResult({ error: 'Test failed' })
    }
    setTesting(false)
  }

  async function handleAddSource(e: FormEvent) {
    e.preventDefault()
    if (!newSource.name || !newSource.url) return
    try {
      await tauri.addSource(newSource)
      setNewSource({ name: '', url: '', categoryId: settings?.categories[0]?.id || '', type: 'rss', icon: '📡', transformType: 'rss' })
      setTestResult(null)
      await fetchSettings(true)
    } catch {}
  }

  const catById: Record<string, Category> = {}
  if (settings) {
    settings.categories.forEach((c) => { catById[c.id] = c })
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">Loading settings...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'categories', label: 'Categories' },
    { id: 'sources', label: 'Sources' },
    { id: 'add-source', label: 'Add Source' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="section-header">
          <div className="section-accent" style={{ background: 'var(--text-primary)' }} />
          <h2 className="section-title">Settings</h2>
        </div>
      </div>

      <div className="flex gap-1 mb-8 border-b border-[var(--border-primary)] pb-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[var(--text-primary)] border-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)]">
          {message}
        </div>
      )}

      {activeTab === 'general' && settings && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-5 space-y-5">
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-primary)]">Max items per source</span>
              <input
                type="number"
                min={5}
                max={100}
                value={settings.maxItemsPerSource}
                onChange={(e) => setSettings({ ...settings, maxItemsPerSource: parseInt(e.target.value) || 30 })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-primary)]">Homepage preview count per section</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.homepagePreviewCount}
                onChange={(e) => setSettings({ ...settings, homepagePreviewCount: parseInt(e.target.value) || 4 })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-primary)]">Refresh interval</span>
              <select
                value={settings.refreshIntervalHours}
                onChange={(e) => setSettings({ ...settings, refreshIntervalHours: parseInt(e.target.value) })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
              >
                <option value={2}>Every 2 hours</option>
                <option value={4}>Every 4 hours</option>
                <option value={6}>Every 6 hours</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Once daily</option>
              </select>
            </label>
          </div>

          <button
            onClick={saveGeneral}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-[var(--bg-primary)] bg-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {activeTab === 'categories' && settings && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Categories</span>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">{settings.categories.length} total</span>
            </div>

            {settings.categories.toSorted((a, b) => a.order - b.order).map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveCategory(cat.id, -1)}
                    disabled={i === 0}
                    className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                  >&#9650;</button>
                  <button
                    onClick={() => moveCategory(cat.id, 1)}
                    disabled={i === settings.categories.length - 1}
                    className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                  >&#9660;</button>
                </div>

                {editCatId === cat.id ? (
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onBlur={() => { updateCategory(cat.id, { name: editCatName }); setEditCatId(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { updateCategory(cat.id, { name: editCatName }); setEditCatId(null) } }}
                    className="flex-1 px-2 py-1 rounded text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-xs font-medium text-[var(--text-primary)] cursor-pointer hover:text-[var(--text-secondary)]"
                    onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name) }}
                  >
                    {cat.name}
                  </span>
                )}

                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">/{cat.slug}</span>

                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                  {settings.sources.filter((s) => s.categoryId === cat.id).length} sources
                </span>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cat.enabled}
                    onChange={(e) => updateCategory(cat.id, { enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 rounded-full bg-[var(--border-primary)] peer-checked:bg-[var(--tech)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-3" />
                </label>

                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-[11px] px-2 py-1 rounded text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  Delete
                </button>
              </div>
            ))}

            <div className="px-4 py-3 flex items-center gap-2 border-t border-[var(--border-primary)]">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategory() }}
                placeholder="New category name..."
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)] placeholder:text-[var(--text-tertiary)]"
              />
              <button
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="px-3 py-1.5 text-xs font-medium text-[var(--bg-primary)] bg-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sources' && settings && (
        <div className="space-y-4">
          {settings.categories.toSorted((a, b) => a.order - b.order).filter((c) => c.enabled).map((cat) => {
            const sources = settings.sources.filter((s) => s.categoryId === cat.id)
            if (sources.length === 0) return null

            return (
              <div key={cat.id} className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{cat.name}</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] font-mono">{sources.length} sources</span>
                </div>

                {sources.map((s) => (
                  <SourceRow
                    key={s.id}
                    source={s}
                    categories={settings.categories}
                    onToggle={(enabled) => toggleSource(s.id, enabled)}
                    onRename={(name) => renameSource(s.id, name)}
                    onMoveCategory={(categoryId) => moveSource(s.id, categoryId)}
                    onDelete={() => deleteSource(s.id)}
                  />
                ))}
              </div>
            )
          })}

          {settings.sources.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8 font-mono">
              No sources yet. Add one using the &ldquo;Add Source&rdquo; tab.
            </p>
          )}
        </div>
      )}

      {activeTab === 'add-source' && settings && (
        <form onSubmit={handleAddSource} className="space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-primary)]">Name</span>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="My Custom Feed"
                  className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)] placeholder:text-[var(--text-tertiary)]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--text-primary)]">Icon (emoji)</span>
                <input
                  type="text"
                  value={newSource.icon}
                  onChange={(e) => setNewSource({ ...newSource, icon: e.target.value })}
                  placeholder="📡"
                  maxLength={4}
                  className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-primary)]">URL</span>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://example.com/rss"
                className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)] placeholder:text-[var(--text-tertiary)]"
                required
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-primary)]">Category</span>
                <select
                  value={newSource.categoryId}
                  onChange={(e) => setNewSource({ ...newSource, categoryId: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                >
                  {settings.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--text-primary)]">Type</span>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value, transformType: e.target.value === 'api-json' ? 'api-json' : 'rss' })}
                  className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                >
                  <option value="rss">RSS / Atom</option>
                  <option value="youtube-rss">YouTube RSS</option>
                  <option value="twitter-rss">Twitter / Nitter RSS</option>
                  <option value="api-json">JSON API</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !newSource.url}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all disabled:opacity-40"
            >
              {testing ? 'Testing...' : 'Test & Preview'}
            </button>

            {testResult && (
              <div className="mt-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                {testResult.error ? (
                  <p className="text-xs text-red-500">Error: {testResult.error}</p>
                ) : (
                  <>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-2">
                      {testResult.type === 'api-json' ? 'JSON API detected' : `RSS feed: OK`}
                    </p>
                    {testResult.items?.map((item: any, i: number) => (
                      <div key={i} className="text-xs text-[var(--text-secondary)] py-1 border-t border-[var(--border-primary)] first:border-t-0">
                        <span className="text-[var(--text-primary)]">{item.title}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-[var(--bg-primary)] bg-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity"
          >
            Add Source
          </button>
        </form>
      )}
    </div>
  )
}

function SourceRow({
  source,
  categories,
  onToggle,
  onRename,
  onMoveCategory,
  onDelete,
}: {
  source: StoredSource
  categories: Category[]
  onToggle: (enabled: boolean) => void
  onRename: (name: string) => void
  onMoveCategory: (categoryId: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(source.name)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
      {source.icon && <span className="text-base w-5 text-center flex-shrink-0">{source.icon}</span>}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => { onRename(editName); setEditing(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRename(editName); setEditing(false) } }}
            className="w-full px-2 py-0.5 rounded text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="text-xs font-medium text-[var(--text-primary)] cursor-pointer hover:text-[var(--text-secondary)]"
            onClick={() => { setEditName(source.name); setEditing(true) }}
          >
            {source.name}
          </span>
        )}
        <span className="ml-2 text-[10px] font-mono text-[var(--text-tertiary)] uppercase">{source.transformType}</span>
      </div>

      <select
        value={source.categoryId}
        onChange={(e) => onMoveCategory(e.target.value)}
        className="px-1.5 py-1 rounded text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)]"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button
        onClick={onDelete}
        className="text-[11px] px-2 py-1 rounded text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-all"
      >
        Delete
      </button>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={source.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-7 h-4 rounded-full bg-[var(--border-primary)] peer-checked:bg-[var(--tech)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-3" />
      </label>
    </div>
  )
}
