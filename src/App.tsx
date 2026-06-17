import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import CategoryView from "./components/CategoryView";
import SearchView from "./components/SearchView";
import SettingsView from "./components/SettingsView";
import ArchiveView from "./components/ArchiveView";
import ArchiveDateView from "./components/ArchiveDateView";
import { getSettings } from "./lib/api";
import type { PageView, NavCategory } from "./types";

export default function App() {
  const [view, setView] = useState<PageView>({ type: "home" });
  const [categories, setCategories] = useState<NavCategory[]>([]);

  const navigate = (v: PageView) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  const refreshCategories = useCallback(() => {
    getSettings()
      .then((s) => {
        setCategories(
          (s.categories || [])
            .filter((c) => c.enabled)
            .map((c) => ({ name: c.name.toUpperCase(), slug: c.slug })),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <>
      <Navbar
        currentView={view}
        onNavigate={navigate}
        categories={categories}
        onRefreshCategories={refreshCategories}
      />
      <main className="pt-16 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto pb-12">
        {view.type === "home" && <HomeView onNavigate={navigate} />}
        {view.type === "category" && (
          <CategoryView slug={view.slug} />
        )}
        {view.type === "search" && <SearchView />}
        {view.type === "settings" && (
          <SettingsView onRefreshCategories={refreshCategories} />
        )}
        {view.type === "archive" && <ArchiveView onNavigate={navigate} />}
        {view.type === "archive-date" && (
          <ArchiveDateView
            date={view.date}
            hour={view.hour}
            onNavigate={navigate}
          />
        )}
      </main>
    </>
  );
}
