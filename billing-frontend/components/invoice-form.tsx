"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Check,
  FileText,
  Trash2,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Customer, Invoice, InvoiceDraft, Product } from "@/types/billing";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Line = {
  product: Product;
  rate: number;
  quantity: number;
};

type Props = {
  mode: "create" | "edit";
  initialInvoice?: Invoice;
  onSaved: (invoice: Invoice) => void;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Number(value.toFixed(2)));
}

function buildLines(invoice: Invoice): Line[] {
  return (invoice.items || [])
    .filter((item) => item.product?.id)
    .map((item) => ({
      product: item.product,
      rate: Math.max(0, safeNumber(item.rate ?? item.product.price)),
      quantity: clampQuantity(safeNumber(item.quantity, 1)),
    }));
}

function getCustomerLabel(customer: Customer) {
  const value = customer as Customer & {
    name?: string;
    fullName?: string;
    phone?: string;
    mobile?: string;
  };
  return value.name || value.fullName || `Customer #${value.id}`;
}

function getCustomerMeta(customer: Customer) {
  const value = customer as Customer & {
    phone?: string;
    mobile?: string;
    email?: string;
  };
  return value.phone || value.mobile || value.email || "";
}

function getProductLabel(product: Product) {
  return product.name || `Product #${product.id}`;
}

export default function InvoiceForm({ mode, initialInvoice, onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState(
    initialInvoice?.customer?.id ? String(initialInvoice.customer.id) : "",
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  const [dueDate, setDueDate] = useState(toDateInput(initialInvoice?.dueDate));
  const [status, setStatus] = useState(initialInvoice?.status || "PAID");
  const [tax, setTax] = useState(Math.max(0, safeNumber(initialInvoice?.tax)));
  const [discount, setDiscount] = useState(
    Math.max(0, safeNumber(initialInvoice?.discount)),
  );
  const [lines, setLines] = useState<Line[]>(
    initialInvoice ? buildLines(initialInvoice) : [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([api.products.list(), api.customers.list()])
      .then(([productData, customerData]) => {
        if (!active) return;
        setProducts(productData || []);
        setCustomers(customerData || []);

        if (initialInvoice?.customer) {
          setCustomerQuery(getCustomerLabel(initialInvoice.customer));
        }
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load invoice data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialInvoice]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) =>
        customer.id ? String(customer.id) === customerId : false,
      ),
    [customers, customerId],
  );

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return customers.slice(0, 8);

    return customers
      .filter((customer) => {
        const label = getCustomerLabel(customer).toLowerCase();
        const meta = getCustomerMeta(customer).toLowerCase();
        return label.includes(query) || meta.includes(query);
      })
      .slice(0, 8);
  }, [customers, customerQuery]);

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return products.slice(0, 8);

    return products
      .filter((product) => {
        const name = getProductLabel(product).toLowerCase();
        const sku = String(product.sku || "").toLowerCase();
        return name.includes(query) || sku.includes(query);
      })
      .slice(0, 8);
  }, [products, productQuery]);

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + safeNumber(line.rate) * safeNumber(line.quantity),
        0,
      ),
    [lines],
  );

  const total = Math.max(
    0,
    subtotal + Math.max(0, safeNumber(tax)) - Math.max(0, safeNumber(discount)),
  );

  function selectCustomer(customer: Customer) {
    if (!customer.id) return;
    setCustomerId(String(customer.id));
    setCustomerQuery(getCustomerLabel(customer));
    setCustomerOpen(false);
    setError("");
  }

  function clearCustomer() {
    setCustomerId("");
    setCustomerQuery("");
  }

  function addProduct(product: Product) {
    if (!product?.id) return;

    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);

      if (found) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: clampQuantity(line.quantity + 1) }
            : line,
        );
      }

      return [
        ...current,
        {
          product,
          rate: Math.max(0, safeNumber(product.price)),
          quantity: 0,
        },
      ];
    });

    setProductQuery("");
    setProductOpen(false);
    setError("");
  }

  function changeQty(id: number, delta: number) {
    setLines((current) =>
      current.map((line) =>
        line.product.id === id
          ? { ...line, quantity: clampQuantity(line.quantity + delta) }
          : line,
      ),
    );
  }

  function changeQuantityInput(id: number, value: string) {
    if (value === "") {
      setLines((current) =>
        current.map((line) =>
          line.product.id === id ? { ...line, quantity: 0 } : line,
        ),
      );
      return;
    }

    const quantity = Number(value);
    if (!Number.isFinite(quantity)) return;

    setLines((current) =>
      current.map((line) =>
        line.product.id === id
          ? { ...line, quantity: Math.max(0, quantity) }
          : line,
      ),
    );
  }

  function changeRate(id: number, value: string) {
    const rate = Math.max(0, safeNumber(value));
    setLines((current) =>
      current.map((line) =>
        line.product.id === id ? { ...line, rate } : line,
      ),
    );
  }

  function removeLine(id: number) {
    setLines((current) => current.filter((line) => line.product.id !== id));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!lines.length) {
      setError("Add at least one product.");
      return;
    }

    if (mode === "edit" && !initialInvoice?.id) {
      setError("This invoice cannot be updated because its id is missing.");
      return;
    }

    const payload: InvoiceDraft = {
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      customer: customerId ? { id: Number(customerId) } : null,
      tax: Math.max(0, safeNumber(tax)),
      discount: Math.max(0, safeNumber(discount)),
      status,
      items: lines.map((line) => ({
        productId: Number(line.product.id),
        rate: Math.max(0, safeNumber(line.rate)),
        quantity: clampQuantity(safeNumber(line.quantity, 0.01)),
      })),
    };

    setSaving(true);

    try {
      const invoice =
        mode === "create"
          ? await api.invoices.create(payload)
          : await api.invoices.update(initialInvoice!.id, payload);

      onSaved(invoice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save invoice");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-sm text-slate-500">
        Loading products and customers…
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <Link
          href={
            mode === "edit" && initialInvoice
              ? `/invoices/${initialInvoice.id}`
              : "/invoices"
          }
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {mode === "edit" ? "Back to bill" : "Back to invoices"}
        </Link>
      </div>

      <PageHeader
        eyebrow="Sales"
        title={mode === "create" ? "Create bill" : "Update bill"}
        description="Choose the customer, add products, adjust quantity and selling rate, then save the bill."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="grid items-start gap-5 xl:grid-cols-[1fr_380px]"
      >
        <section className="space-y-5">
          <div className="card p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="font-black">Billing details</h2>
                <p className="text-xs text-slate-500">
                  Search a customer by name, phone or email.
                </p>
              </div>
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <label className="relative block text-sm font-bold sm:col-span-1">
                Customer
                <input
                  className="input mt-1.5 w-full"
                  placeholder="Type customer name…"
                  value={customerQuery}
                  onFocus={() => setCustomerOpen(true)}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setCustomerId("");
                    setCustomerOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setCustomerOpen(false);
                    if (e.key === "Enter" && filteredCustomers[0]) {
                      e.preventDefault();
                      selectCustomer(filteredCustomers[0]);
                    }
                  }}
                  autoComplete="off"
                />

                {customerOpen && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCustomer(customer)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">
                            {getCustomerLabel(customer)}
                          </span>
                          {getCustomerMeta(customer) && (
                            <span className="block truncate text-xs text-slate-400">
                              {getCustomerMeta(customer)}
                            </span>
                          )}
                        </span>
                        {selectedCustomer?.id === customer.id && (
                          <Check size={16} className="shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {customerQuery && customerId && (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="mt-1 text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Clear customer
                  </button>
                )}
              </label>

              <label className="block text-sm font-bold">
                Bill date
                <input
                  className="input mt-1.5"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>

              <label className="block text-sm font-bold">
                Status
                <select
                  className="input mt-1.5"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-black">Bill items</h2>
                <p className="text-xs text-slate-500">
                  Search by product name or SKU. Type "a" to see matching products.
                </p>
              </div>

              <div className="relative ml-auto w-full sm:w-[320px]">
                <input
                  className="input w-full"
                  placeholder="Type product name or SKU…"
                  value={productQuery}
                  onFocus={() => setProductOpen(true)}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    setProductOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setProductOpen(false);
                    if (e.key === "Enter" && filteredProducts[0]) {
                      e.preventDefault();
                      addProduct(filteredProducts[0]);
                    }
                  }}
                  autoComplete="off"
                />

                {productOpen && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addProduct(product)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">
                            {getProductLabel(product)}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {product.sku || "No SKU"} · {formatCurrency(product.price)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                          Add
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {productOpen && productQuery && filteredProducts.length === 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-xl">
                    No products found.
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {lines.map((line) => {
                const id = line.product.id!;
                const amount = safeNumber(line.rate) * safeNumber(line.quantity);

                return (
                  <div
                    key={id}
                    className="grid gap-3 p-5 md:grid-cols-[1fr_130px_175px_120px_40px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <Boxes size={18} />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
  <div className="whitespace-normal font-bold leading-snug">
    {line.product.name}
  </div>
  <div className="mt-0.5 whitespace-normal text-xs leading-relaxed text-slate-500">
    {line.product.sku || "No SKU"} · Catalogue price {formatCurrency(line.product.price)}
  </div>
</div>
                    </div>

                    <label className="text-xs font-bold text-slate-500">
                      Rate
                      <input
                        className="input mt-1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rate}
                        onChange={(e) => changeRate(id, e.target.value)}
                      />
                    </label>

                    <div>
                      <div className="text-xs font-bold text-slate-500">
                        Quantity
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200"
                          onClick={() => changeQty(id, -0.1)}
                          aria-label={`Decrease quantity for ${line.product.name}`}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={line.quantity}
                          className="input w-24 text-center font-black"
                          onChange={(e) => changeQuantityInput(id, e.target.value)}
                          aria-label={`Quantity for ${line.product.name}`}
                        />

                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200"
                          onClick={() => changeQty(id, 0.1)}
                          aria-label={`Increase quantity for ${line.product.name}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        0.1 = 100g · 0.25 = 250g · 0.5 = 500g
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-500">Amount</div>
                      <div className="mt-1 font-black">{formatCurrency(amount)}</div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost !p-2 text-rose-500"
                      onClick={() => removeLine(id)}
                      aria-label={`Remove ${line.product.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              {!lines.length && (
                <div className="p-10 text-center text-sm text-slate-400">
                  No line items yet. Search for a product above and select it.
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-black">Adjustments</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Tax
                <input
                  className="input mt-1.5"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(Math.max(0, safeNumber(e.target.value)))}
                />
              </label>

              <label className="block text-sm font-bold">
                Discount
                <input
                  className="input mt-1.5"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.max(0, safeNumber(e.target.value)))
                  }
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="card p-5 xl:sticky xl:top-24">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white">
              <FileText size={19} />
            </div>
            <div>
              <h2 className="font-black">Bill summary</h2>
              <p className="text-xs text-slate-500">
                {mode === "create" ? "Ready to save." : "Changes will update the same bill."}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-b border-slate-100 pb-5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Items</span>
              <strong>
                {lines.reduce((sum, line) => sum + safeNumber(line.quantity), 0).toFixed(2)}
              </strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <strong>{formatCurrency(tax)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Discount</span>
              <strong>-{formatCurrency(discount)}</strong>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <span className="text-2xl font-black">{formatCurrency(total)}</span>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={saving || !lines.length}>
            <Check size={17} />
            {saving ? "Saving…" : mode === "create" ? "Create bill" : "Update bill"}
          </Button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
            The backend recalculates subtotal, tax, discount and total before saving.
          </p>
        </aside>
      </form>
    </div>
  );
}
