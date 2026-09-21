import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductWithImages } from "@/components/storefront/product-card";

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  let categoryId = null;
  let collectionTitle = "All Products";

  // If it's not the "all" collection, look up the category by slug
  if (slug !== "all") {
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", slug)
      .single();

    const category = categoryData as { id: string; name: string } | null;

    if (!category) {
      notFound();
    }

    categoryId = category.id;
    collectionTitle = category.name;
  }

  // Fetch active products with their images
  let query = supabase
    .from("products")
    .select(`
      *,
      product_images (
        id, url, alt_text, position
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return <div>Error loading products.</div>;
  }

  return (
    <div className="pt-32 pb-24 min-h-screen">
      {/* Header */}
      <div className="mb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-sxtn-white mb-2">
          {collectionTitle}
        </h1>
        <p className="text-sxtn-gray-400 text-sm tracking-widest uppercase">
          {products?.length || 0} {products?.length === 1 ? "Item" : "Items"}
        </p>
      </div>

      {/* Grid — Edge to Edge */}
      <div className="w-full px-0">
        <ProductGrid products={(products as unknown) as ProductWithImages[]} />
      </div>
    </div>
  );
}
