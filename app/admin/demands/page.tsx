import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { DemandsManager, DemandItem } from "@/components/admin/demands-manager";

export const metadata = { title: "Customer Demands — 6XTN Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDemandsPage() {
  const auth = await requireAdmin();
  if (!auth.isAdmin) {
    redirect("/login?next=/admin/demands");
  }

  const supabase = createAdminClient();

  const { data: rawDemands, error } = await (supabase.from("product_demands") as any)
    .select(`
      id,
      product_id,
      variant_id,
      size,
      email,
      status,
      created_at,
      products (
        id,
        name,
        slug,
        price,
        product_images ( url, position )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AdminDemands] Failed to fetch demands:", error);
  }

  const demands: DemandItem[] = (rawDemands || []).map((d: any) => ({
    id: d.id,
    product_id: d.product_id,
    variant_id: d.variant_id,
    size: d.size,
    email: d.email,
    status: d.status,
    created_at: d.created_at,
    product: d.products
      ? {
          id: d.products.id,
          name: d.products.name,
          slug: d.products.slug,
          price: d.products.price,
          product_images: (d.products.product_images || []).sort(
            (a: any, b: any) => a.position - b.position
          ),
        }
      : null,
  }));

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#000",
              margin: "0 0 4px",
            }}
          >
            Customer Demands ({demands.length})
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
            Track out-of-stock items customers want restocked and manage restock notification lists.
          </p>
        </div>
      </div>

      <DemandsManager initialDemands={demands} />
    </div>
  );
}

