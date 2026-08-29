"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Check,
  FileText,
  Minus,
  Plus,
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

function buildLines(invoice: Invoice): Line[] {
  return (invoice.items || [])
    .filter((item) => item.product?.id)
    .map((item) => ({
      product: item.product,
      rate: Number(item.rate ?? item.product.price ?? 0),
      quantity: Math.max(1, Number(item.quantity ?? 1)),
    }));
}

export default function InvoiceForm({ mode, initialInvoice, onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(
    initialInvoice?.customer?.id ? String(initialInvoice.customer.id) : "",
  );
  const [dueDate, setDueDate] = useState(toDateInput(initialInvoice?.dueDate));
  const [status, setStatus] = useState(initialInvoice?.status || "PAID");
  const [tax, setTax] = useState(Number(initialInvoice?.tax || 0));
  const [discount, setDiscount] = useState(Number(initialInvoice?.discount || 0));
  const [lines, setLines] = useState<Line[]>(
    initialInvoice ? buildLines(initialInvoice) : [],
  );
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.products.list(), api.customers.list()])
      .then(([productData, customerData]) => {
        setProducts(productData);
        setCustomers(customerData);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load invoice data"),
      )
      .finally(() => setLoading(false));
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.rate || 0) * line.quantity, 0),
    [lines],
  );

  const total = Math.max(0, subtotal + Number(tax || 0) - Number(discount || 0));

  function addProduct() {
    const product = products.find((item) => String(item.id) === productId);
    if (!product?.id) return;

    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          product,
          rate: Number(product.price || 0),
          quantity: 1,
        },
      ];
    });
    setProductId("");
  }

 function changeQty(id: number, delta: number) {
  setLines((current) =>
    current.map((line) =>
      line.product.id === id
        ? {
            ...line,
            quantity: Math.max(
              0.01,
              Number((line.quantity + delta).toFixed(2)),
            ),
          }
        : line,
    ),
  );
}

  function changeRate(id: number, value: string) {
    const rate = Math.max(0, Number(value) || 0);
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

    if (!lines.length) {
      setError("Add at least one product.");
      return;
    }

    const payload: InvoiceDraft = {
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      customer: customerId ? { id: Number(customerId) } : null,
      tax: Math.max(0, Number(tax) || 0),
      discount: Math.max(0, Number(discount) || 0),
      status,
      items: lines.map((line) => ({
        productId: Number(line.product.id),
        rate: Number(line.rate || 0),
        quantity: Math.max(1, Number(line.quantity || 1)),
      })),
    };

    setSaving(true);
    setError("");

    try {
      // Translate our clean frontend draft into the entity-shaped Spring Boot request.

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
    return <div className="card p-8 text-sm text-slate-500">Loading products and customers…</div>;
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <Link
          href={mode === "edit" && initialInvoice ? `/invoices/${initialInvoice.id}` : "/invoices"}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {mode === "edit" ? "Back to bill" : "Back to invoices"}
        </Link>
      </div>

      <PageHeader
        eyebrow="Sales"
        title={mode === "create" ? "Create bill" : "Update bill"}
        description="Choose the customer, set the selling rate for every item, and save the bill."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="card p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="font-black">Billing details</h2>
                <p className="text-xs text-slate-500">Attach the bill to a customer.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-bold">
                Customer
                <select
                  className="input mt-1.5"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
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
                  Rate is the selling price charged on this bill.
                </p>
              </div>

              <div className="ml-auto flex w-full gap-2 sm:w-auto">
                <select
                  className="input min-w-0 sm:w-64"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select product…</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={addProduct}>
                  <Plus size={16} />
                  Add
                </Button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {lines.map((line) => {
                const id = line.product.id!;
                const amount = Number(line.rate || 0) * line.quantity;

                return (
                  <div
                    key={id}
                    className="grid gap-3 p-5 md:grid-cols-[1fr_130px_125px_120px_40px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <Boxes size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-bold">{line.product.name}</div>
                        <div className="truncate text-xs text-slate-500">
                          {line.product.sku} · Catalogue price {formatCurrency(line.product.price)}
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
                      <div className="text-xs font-bold text-slate-500">Quantity</div>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200"
                          onClick={() => changeQty(id, -0.01)}
                        >
                          <Minus size={15} />
                        </button>
                        <input
  type="number"
  min="0.01"
  step="0.01"
  value={line.quantity}
  className="input w-20 text-center font-black"
  onChange={(e) => {
    const value = Number(e.target.value);

    setLines((current) =>
      current.map((item) =>
        item.product.id === id
          ? {
              ...item,
              quantity: value > 0 ? value : 0.01,
            }
          : item,
      ),
    );
  }}
/>
                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200"
                          onClick={() => changeQty(id, 0.01)}
                        >
                          <Plus size={15} />
                        </button>
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
                  No line items yet. Choose a product above.
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
                  onChange={(e) => setTax(Number(e.target.value) || 0)}
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
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
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
              <strong>{lines.reduce((sum, line) => sum + line.quantity, 0)}</strong>
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
            The Spring Boot backend recalculates subtotal, tax, discount and total before saving.
          </p>
        </aside>
      </form>
    </div>
  );
}
