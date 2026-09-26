"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "Dashboard",
    href: "/admin",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Add Product",
    href: "/admin/products/new",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: "All Products",
    href: "/admin/products",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Collections",
    href: "/admin/collections",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/admin/orders",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Hero Banner",
    href: "/admin/hero-banner",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 20px",
    textDecoration: "none",
    fontSize: "0.78rem",
    fontWeight: active ? 800 : 500,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: active ? "#000" : "#555",
    backgroundColor: active ? "#efefef" : "transparent",
    borderLeft: `3px solid ${active ? "#000" : "transparent"}`,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  const navLinks = NAV.map(({ label, href, exact, icon }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMobileOpen(false)}
      style={linkStyle(isActive(href, exact))}
    >
      {icon}
      {label}
    </Link>
  ));

  return (
    <>
      {/* ── Desktop sidebar ───────────────── */}
      <aside
        style={{
          width: "210px",
          flexShrink: 0,
          backgroundColor: "#fff",
          borderRight: "1px solid #e5e5e5",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: "56px",
          alignSelf: "flex-start",
          height: "calc(100vh - 56px)",
          overflowY: "auto",
        }}
        className="admin-sidebar-desktop"
      >
        <style>{`
          @media (max-width: 767px) { .admin-sidebar-desktop { display: none !important; } }
        `}</style>
        <nav style={{ padding: "0.75rem 0", flex: 1 }}>{navLinks}</nav>
        <div style={{ padding: "0.75rem 20px", borderTop: "1px solid #eee" }}>
          <p style={{ fontSize: "0.65rem", color: "#bbb", letterSpacing: "0.08em", textTransform: "uppercase" }}>SXTN Admin v1</p>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ─────────── */}
      <div className="admin-mobile-tabs">
        <style>{`
          .admin-mobile-tabs {
            display: none;
          }
          @media (max-width: 767px) {
            .admin-mobile-tabs {
              display: flex;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #fff;
              border-top: 2px solid #000;
              z-index: 60;
              overflow-x: auto;
            }
            .admin-mobile-tabs a {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 3px;
              padding: 8px 4px;
              text-decoration: none;
              font-size: 0.55rem;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: #888;
              min-width: 56px;
              border-top: 2px solid transparent;
              transition: color 0.15s, border-color 0.15s;
            }
            .admin-mobile-tabs a.active-tab {
              color: #000;
              border-top-color: #000;
            }
          }
        `}</style>
        {NAV.map(({ label, href, exact, icon }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href, exact) ? "active-tab" : ""}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
