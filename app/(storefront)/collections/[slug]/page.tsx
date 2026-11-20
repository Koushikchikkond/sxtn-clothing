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
    let categoryData: { id: string; name: string; slug: string } | null = null;

    // 1. Try exact slug match
    const { data: exactData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (exactData) {
      categoryData = exactData as { id: string; name: string; slug: string };
    }

    // 2. If not found, match common category aliases (hoodie <-> hoodies, tees <-> t-shirts, etc.)
    if (!categoryData) {
      const slugLower = slug.toLowerCase();
      let alternatives: string[] = [];
      if (slugLower === "hoodies" || slugLower === "hoodie") {
        alternatives = ["hoodie", "hoodies"];
      } else if (
        slugLower === "tees" ||
        slugLower === "t-shirts" ||
        slugLower === "tshirts" ||
        slugLower === "t-shirt" ||
        slugLower === "tee"
      ) {
        alternatives = ["tees", "t-shirts", "tshirts", "t-shirt", "tee"];
      }

      if (alternatives.length > 0) {
        const { data: altData } = await supabase
          .from("categories")
          .select("id, name, slug")
          .in("slug", alternatives)
          .limit(1)
          .maybeSingle();
        if (altData) {
          categoryData = altData as { id: string; name: string; slug: string };
        }
      }
    }

    // 3. Fallback: match by name pattern
    if (!categoryData) {
      const cleanName = slug.replace(/-/g, " ");
      const { data: nameData } = await supabase
        .from("categories")
        .select("id, name, slug")
        .ilike("name", `%${cleanName}%`)
        .limit(1)
        .maybeSingle();
      if (nameData) {
        categoryData = nameData as { id: string; name: string; slug: string };
      }
    }

    if (!categoryData) {
      notFound();
    }

    const matchedCategory: { id: string; name: string; slug: string } = categoryData;
    categoryId = matchedCategory.id;
    collectionTitle = matchedCategory.name;
  }

  // Fetch active products with their images
  let query = supabase
    .from("products")
    .select(`
      *,
      product_images (
        id, url, alt_text, position
      ),
      product_variants (
        id, stock, size
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
