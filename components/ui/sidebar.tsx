"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/(dashboard)/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "◫" },
  { href: "/movements", label: "Movimientos", icon: "⇄" },
  { href: "/analysis", label: "Análisis", icon: "◔" },
  { href: "/alerts", label: "Alertas", icon: "⚠" },
  { href: "/projections", label: "Proyecciones", icon: "↗" },
  { href: "/ai", label: "Asesor IA", icon: "✦" },
];

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-neutral-950">
            $
          </span>
          <span className="font-semibold">Finanzas</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm"
        >
          ☰
        </button>
      </div>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-800 bg-neutral-950 p-4 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 hidden items-center gap-2 px-2 md:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-neutral-950">
            $
          </span>
          <span className="text-lg font-semibold">Finanzas</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
              }`}
            >
              <span className="w-4 text-center text-neutral-500">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 border-t border-neutral-800 pt-4">
          {email && (
            <p className="mb-2 truncate px-3 text-xs text-neutral-500">
              {email}
            </p>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-rose-400"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
