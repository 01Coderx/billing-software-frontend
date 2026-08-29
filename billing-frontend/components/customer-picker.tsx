"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import type { Customer } from "@/types/billing";

type Props = {
  customers: Customer[];
  value: string; // selected customer id, "" = walk-in
  onChange: (id: string) => void;
};

export function CustomerPicker({ customers, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const selected = customers.find((c) => String(c.id) === value) || null;

  // Seed the input text once customers load, if a customer is already
  // attached (edit mode). Runs once only, so it never fights the user's typing.
  useEffect(() => {
    if (seeded.current || !customers.length) return;
    const match = customers.find((c) => String(c.id) === value);
    if (match) setQuery(match.name);
    seeded.current = true;
  }, [customers, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (
    q
      ? customers.filter((c) => `${c.name} ${c.phone || ""} ${c.email || ""}`.toLowerCase().includes(q))
      : customers
  ).slice(0, 8);

  function pick(customer: Customer) {
    onChange(String(customer.id));
    setQuery(customer.name);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative mt-1.5">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9 pr-8"
          placeholder="Type a customer name or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        />
        {(query || value) && (
          <button type="button" onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Clear customer">
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          <button type="button" className="w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50" onMouseDown={(e) => { e.preventDefault(); clear(); }}>
            Walk-in customer (no saved contact)
          </button>

          {matches.map((customer) => (
            <button type="button" key={customer.id} className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50" onMouseDown={(e) => { e.preventDefault(); pick(customer); }}>
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                <UserRound size={15} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{customer.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {customer.phone || "No phone"}{customer.email ? ` · ${customer.email}` : ""}
                </div>
              </div>
            </button>
          ))}

          {q && !matches.length && <div className="px-3 py-3 text-sm text-slate-400">No saved customer matches "{query}".</div>}
        </div>
      )}

      {selected && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <div className="font-bold text-slate-800">{selected.name}</div>
          {selected.phone && <div className="mt-0.5">{selected.phone}</div>}
          {selected.email && <div>{selected.email}</div>}
          {selected.address && <div className="mt-0.5 text-slate-500">{selected.address}</div>}
        </div>
      )}
    </div>
  );
}
