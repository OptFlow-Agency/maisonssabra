import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string,
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
);

export type ProductRow = {
  slug: string;
  name: string;
  collection: "bladi" | "zman";
  price: number;
  was_price: number | null;
  description: string;
  image: string;
  image2: string | null;
  alt: string;
  is_new: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export const BUCKET = "product-images";
export const variant = (src: string, w: 480 | 800) => src.replace(/\.webp$/, `-${w}.webp`);
export const fmt = (n: number) => `${n.toLocaleString("fr-FR")} dhs`;

export function toast(message: string, kind: "ok" | "error" = "ok") {
  const host = document.querySelector<HTMLElement>("[data-toast-host]");
  if (!host) return;
  const t = document.createElement("p");
  t.className = `pointer-events-auto m-0 max-w-md px-5 py-3 text-sm font-medium shadow-[0_14px_28px_-10px_rgb(74_15_34/0.5)] ${kind === "ok" ? "bg-burgundy-deep text-cream" : "bg-white text-burgundy-deep ring-2 ring-burgundy-deep"}`;
  t.textContent = message;
  host.replaceChildren(t);
  setTimeout(() => t.remove(), kind === "ok" ? 4000 : 7000);
}

export type PromoRow = {
  code: string;
  percent: number;
  active: boolean;
  created_at: string;
  promo_code_products: { product_slug: string }[];
};
export type ProductLite = Pick<ProductRow, "slug" | "name" | "image" | "active">;

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type OrderItemRow = {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};
export type OrderRow = {
  id: string;
  order_number: number;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number | null;
  discount: number;
  promo_code: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItemRow[];
};
