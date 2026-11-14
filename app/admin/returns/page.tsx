import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReturnsTableManager, ReturnWithOrder } from "@/components/admin/returns-table-manager";

export const metadata = { title: "Returns & Exchanges — 6XTN Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const auth = await requireAdmin();
  if (!auth.isAdmin) {
    redirect("/login?next=/admin/returns");
  }

  const supabase = createAdminClient();

  const { data: rawReturns, error } = await (supabase.from("order_returns") as any)
    .select(`
      id,
      order_id,
      order_item_id,
      user_id,
      type,
      status,
      product_name,
      original_size,
      requested_size,
      reason,
      customer_notes,
      admin_notes,
      return_awb,
      return_courier,
      created_at,
      updated_at,
      orders (
        id,
        guest_email,
        user_id,
        shipping_address,
        status,
        total
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[AdminReturns] Error fetching returns:", error.message);
  }

  const returns: ReturnWithOrder[] = (rawReturns || []) as ReturnWithOrder[];

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
            Returns & Size Exchanges ({returns.length})
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
            Monitor, approve, and track reverse logistics and size replacement requests from customers.
          </p>
        </div>
      </div>

      <ReturnsTableManager initialReturns={returns} />
    </div>
  );
}

