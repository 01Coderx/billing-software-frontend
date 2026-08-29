"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, Search } from "lucide-react";
import type { Product } from "@/types/billing";
import { formatCurrency } from "@/lib/utils";

type Props = {
  products: Product[];
  onSelect: (product: Product) => void;
};

export function ProductPicker({ products, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (q ? products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q)) : products).slice(0, 8);

  function pick(product: Product) {
    onSelect(product);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input w-full pl-9"
        placeholder="Type a product name or SKU…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {matches.map((product) => (
            <button type="button" key={product.id} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50" onMouseDown={(e) => { e.preventDefault(); pick(product); }}>
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <Boxes size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{product.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {product.sku ? `${product.sku} · ` : ""}{formatCurrency(product.price)}
                  {Number(product.stock) <= 5 ? ` · ${product.stock} left` : ""}
                </div>
              </div>
            </button>
          ))}
          {!matches.length && <div className="px-3 py-3 text-sm text-slate-400">No product matches "{query}".</div>}
        </div>
      )}
    </div>
  );
}
