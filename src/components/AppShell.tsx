'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import HomeLoader from '@/components/HomeLoader'
import CategoryLoader from '@/components/CategoryLoader'
import SearchPageContent from '@/components/SearchPageContent'
import SettingsPageContent from '@/components/SettingsPageContent'
import ArchivePageContent from '@/components/ArchivePageContent'
import ArchiveDatePageContent from '@/components/ArchiveDatePageContent'
import { getSettings } from '@/lib/tauri'

type PageView =
  | { type: 'home' }
  | { type: 'category'; slug: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'archive' }
  | { type: 'archive-date'; date: string; hour: string }

interface NavCategory {
  name: string
  slug: string
}

export default function AppShell() {
  const [view, setView] = useState<PageView>({ type: 'home' })
  const [categories, setCategories] = useState<NavCategory[]>([])

  const navigate = (v: PageView) => {
    setView(v)
    window.scrollTo(0, 0)
  }

  const refreshCategories = useCallback(() => {
    getSettings()
      .then((s) => {
        setCategories(
          (s.categories || [])
            .filter((c) => c.enabled)
            .map((c) => ({ name: c.name.toUpperCase(), slug: c.slug }))
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  return (
    <>
      <Navbar currentView={view} onNavigate={navigate} categories={categories} onRefreshCategories={refreshCategories} />
      <main className="pt-16 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
        {view.type === 'home' && <HomeLoader onNavigate={navigate} />}
        {view.type === 'category' && <CategoryLoader slug={view.slug} onNavigate={navigate} />}
        {view.type === 'search' && <SearchPageContent onNavigate={navigate} />}
        {view.type === 'settings' && <SettingsPageContent onNavigate={navigate} onRefreshCategories={refreshCategories} />}
        {view.type === 'archive' && <ArchivePageContent onNavigate={navigate} />}
        {view.type === 'archive-date' && <ArchiveDatePageContent date={view.date} hour={view.hour} onNavigate={navigate} />}
      </main>
    </>
  )
}
