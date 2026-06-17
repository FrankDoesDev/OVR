import { useState, useEffect } from "react";
import type { PageView, NavCategory } from "../types";

export default function Navbar({
  currentView,
  onNavigate,
  categories,
  onRefreshCategories,
}: {
  currentView: PageView;
  onNavigate: (v: PageView) => void;
  categories: NavCategory[];
  onRefreshCategories: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  function navigateAndClose(v: PageView) {
    onNavigate(v);
    setOpen(false);
  }

  const isActive = (v: PageView) => {
    if (v.type === "home") return currentView.type === "home";
    if (v.type === "category")
      return currentView.type === "category" && currentView.slug === v.slug;
    if (v.type === "settings") return currentView.type === "settings";
    if (v.type === "archive")
      return (
        currentView.type === "archive" || currentView.type === "archive-date"
      );
    return false;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center px-4">
        <button
          onClick={() => {
            onRefreshCategories();
            setOpen(true);
          }}
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
          aria-label="Open navigation"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <div className="flex-1 flex justify-center">
          <button onClick={() => onNavigate({ type: "home" })} className="group">
            <h1 className="font-serif font-bold tracking-tight text-[var(--text-primary)] group-hover:opacity-80 transition-opacity">
              OVR
            </h1>
          </button>
        </div>

        <div className="w-8" />
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-[var(--bg-primary)] border-r border-[var(--border-primary)] transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-12 px-4 border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-[var(--text-tertiary)] tracking-wider uppercase">
            Navigation
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
            aria-label="Close navigation"
          >
            <svg
              className="w-4 h-4"
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

        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          <NavItem
            label="TODAY"
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            active={isActive({ type: "home" })}
            onClick={() => navigateAndClose({ type: "home" })}
          />

          {categories.length > 0 && (
            <div className="my-2 border-t border-[var(--border-primary)]" />
          )}

          {categories.map((cat) => (
            <NavItem
              key={cat.slug}
              label={cat.name}
              icon="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
              active={isActive({ type: "category", slug: cat.slug })}
              onClick={() =>
                navigateAndClose({ type: "category", slug: cat.slug })
              }
            />
          ))}

          <div className="my-2 border-t border-[var(--border-primary)]" />

          <NavItem
            label="ARCHIVE"
            icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            active={isActive({ type: "archive" })}
            onClick={() => navigateAndClose({ type: "archive" })}
          />
          <NavItem
            label="SEARCH"
            icon="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            active={isActive({ type: "search" })}
            onClick={() => navigateAndClose({ type: "search" })}
          />

          <div className="my-2 border-t border-[var(--border-primary)]" />

          <NavItem
            label="SETTINGS"
            icon="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            active={isActive({ type: "settings" })}
            onClick={() => navigateAndClose({ type: "settings" })}
          />
        </nav>

        <div className="p-3 border-t border-[var(--border-primary)] flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {dark ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                />
              )}
            </svg>
            <span className="text-xs font-medium">
              {dark ? "LIGHT MODE" : "DARK MODE"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200 w-full text-left ${
        active
          ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
      }`}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d={icon}
        />
      </svg>
      <span className="font-medium">{label}</span>
      {active && (
        <span className="ml-auto w-1 h-1 rounded-full bg-[var(--gaming)]" />
      )}
    </button>
  );
}
