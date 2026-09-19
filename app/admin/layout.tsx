import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Re-enable auth guard after setting admin role in Supabase
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/login");
  // const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  // if (profile?.role !== "admin") redirect("/");

  return (
    <div className="admin-shell">
      <style>{`
        .admin-shell {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          color: #000;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .admin-topbar {
          height: 56px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }
        .admin-body {
          display: flex;
          flex: 1;
        }
        .admin-main {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          min-width: 0;
        }
        @media (min-width: 768px) {
          .admin-main {
            padding: 2rem;
          }
        }
      `}</style>

      {/* ── Top Bar ─────────────────────────────── */}
      <header className="admin-topbar">
        <Link href="/admin" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/brand-logo.svg"
            alt="SXTN"
            width={80}
            height={32}
            priority
            style={{ height: "28px", width: "auto" }}
          />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginLeft: "10px" }}>
            ADMIN
          </span>
        </Link>

        <Link
          href="/"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          ← Storefront
        </Link>
      </header>

      {/* ── Body ────────────────────────────────── */}
      <div className="admin-body">
        <AdminSidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
