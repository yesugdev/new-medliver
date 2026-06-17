"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, UserCircle, Search, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@his/shared";
import { ROLE_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { listPatients } from "@/lib/patients-api";
import { getMe } from "@/lib/users-api";
import type { Patient } from "@his/shared";

/* ─── Mongolian date formatter ──────────────────────────────────── */
const MN_WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const MN_MONTHS   = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

function formatMnDate(d: Date): string {
  return `${d.getFullYear()} оны ${MN_MONTHS[d.getMonth()]} ${d.getDate()}, ${MN_WEEKDAYS[d.getDay()]}`;
}

/* ─── Patient quick search ───────────────────────────────────────── */
function PatientQuickSearch() {
  const router    = useRouter();
  const inputRef  = useRef<HTMLInputElement>(null);
  const boxRef    = useRef<HTMLDivElement>(null);

  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [notFound, setNotFound] = useState(false);

  /* Close dropdown on outside click */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); setOpen(false); setNotFound(false); return; }
    setLoading(true);
    setNotFound(false);
    try {
      const res = await listPatients({ search: q.trim(), pageSize: 6 });
      setResults(res.items);
      setNotFound(res.items.length === 0);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length === 1) {
        navigate(results[0]);
      } else {
        doSearch(query);
      }
    }
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  }

  function navigate(p: Patient) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/patients/${p.id}`);
  }

  return (
    <div ref={boxRef} className="relative w-72">
      {/* Input */}
      <div className="relative flex items-center">
        {loading
          ? <Loader2 className="absolute left-3 h-4 w-4 text-muted-foreground animate-spin" />
          : <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            doSearch(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Регистрийн дугаараар хайх..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:bg-white transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white rounded-xl border border-border shadow-lg overflow-hidden">
          {notFound ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Өвчтөн олдсонгүй
            </div>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => navigate(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {p.registerNumber} · {p.patientCode}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Header ─────────────────────────────────────────────────────── */
export function AppHeader({ user }: { user: AuthUser }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  /* Fetch full profile to get avatar; uses the same cache key as /profile page */
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });

  const initials = (user.fullName[0] ?? "?").toUpperCase();
  const avatar   = profile?.avatar;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: date */}
      <div className="text-sm text-muted-foreground hidden md:block">
        {formatMnDate(new Date())}
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center px-4 md:px-8">
        <PatientQuickSearch />
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary select-none">{initials}</span>
            )}
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-medium">{user.fullName}</div>
            <div className="text-[11px] text-muted-foreground">
              {ROLE_LABELS_MN[user.role]}
            </div>
          </div>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Гарах</span>
        </Button>
      </div>
    </header>
  );
}
