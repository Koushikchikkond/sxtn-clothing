import { ProductCard, ProductWithImages } from "./product-card";

interface ProductGridProps {
  products: ProductWithImages[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-xl uppercase tracking-widest text-sxtn-gray-500">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-10 md:gap-y-12 px-0">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
