import React from "react";
import Link from "next/link";

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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      {/* Admin Top Bar */}
      <header
        style={{
          borderBottom: "2px solid #000",
          backgroundColor: "#000",
          color: "#fff",
          padding: "0 2rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.75rem",
            letterSpacing: "0.05em",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          SXTN ADMIN
        </Link>

        <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {[
            { href: "/admin/products", label: "Products" },
            { href: "/admin/categories", label: "Categories" },
            { href: "/admin/orders", label: "Orders" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/"
            style={{
              padding: "6px 14px",
              border: "1.5px solid #fff",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ← Storefront
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2.5rem 2rem",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        {children}
      </main>
    </div>
  );
}
