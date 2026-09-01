"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, FileText, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Invoice } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LoadingState, EmptyState } from "@/components/data-state";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  
  async function load() {
    setLoading(true);
    setError("");
    try {
      setInvoices(await api.invoices.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
  return bills.filter((bill) => {
    // Existing search match logic
    const matchesSearch = searchQuery 
      ? (bill.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (bill.status || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // New date filtering logic (adjust property name if your date field is named differently, e.g. dueDate or createdAt)
    const billDateString = bill.createdAt || bill.dueDate || bill.date;
    const matchesDate = dateFilter && billDateString
      ? new Date(billDateString).toISOString().slice(0, 10) === dateFilter
      : true;

    return matchesSearch && matchesDate;
  });
}, [bills, searchQuery, dateFilter]);
  async function remove(id: number) {
    if (!window.confirm("Delete this bill permanently?")) return;

    setDeletingId(id);
    setError("");
    try {
      await api.invoices.remove(id);
      setInvoices((current) => current.filter((invoice) => invoice.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete invoice");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingState label="Loading bills…" />;

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Sales"
        title="Bills"
        description="Create, inspect, update, delete and download bills directly from your Spring Boot database."
        actionHref="/invoices/new"
        actionLabel="New bill"
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!invoices.length ? (
        <EmptyState
          title="No bills yet"
          description="Create your first bill and it will appear here from the backend."
          action={
            <Button asChild>
              <Link href="/invoices/new">
                <Plus size={17} />
                Create bill
              </Link>
            </Button>
          }
        />
) : (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input pl-10"
                placeholder="Search bill, customer or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Add Date Filter Input Here */}
            <input
              type="date"
              className="input w-full sm:w-[180px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter bills by date"
            />

            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="text-sm font-bold text-slate-500 hover:text-slate-900"
              >
                Clear Date
              </button>
            )}

            <Button variant="secondary" onClick={load}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>

          <div className="hidden grid-cols-[1.2fr_1.2fr_.8fr_.8fr_90px] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400 md:grid">
            <div>Bill</div>
            <div>Customer</div>
            <div>Date</div>
            <div>Status</div>
            <div />
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-3 p-5 md:grid-cols-[1.2fr_1.2fr_.8fr_.8fr_90px] md:items-center"
              >
                <Link href={`/invoices/${invoice.id}`} className="min-w-0">
                  <div className="font-black">{invoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">#{invoice.id}</div>
                </Link>

                <Link
                  href={`/invoices/${invoice.id}`}
                  className="text-sm font-semibold text-slate-700"
                >
                  {invoice.customer?.name || "Walk-in customer"}
                </Link>

                <div className="text-xs font-semibold text-slate-500">
                  {formatDate(invoice.createdAt)}
                </div>

                <div>
                  <StatusBadge status={invoice.status} />
                </div>

                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="btn btn-ghost !p-2 text-slate-500"
                    aria-label={`Open ${invoice.invoiceNumber}`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                  <button
                    onClick={() => remove(invoice.id)}
                    disabled={deletingId === invoice.id}
                    className="btn btn-ghost !p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                    aria-label={`Delete ${invoice.invoiceNumber}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 md:hidden">
                  <span className="text-xs text-slate-500">Total</span>
                  <strong>{formatCurrency(invoice.total)}</strong>
                </div>
              </div>
            ))}

            {!filtered.length && (
              <div className="p-12 text-center text-sm text-slate-400">
                No bill matches.
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <FileText size={14} />
        PDF downloads use the backend&apos;s <code>/api/invoices/:id/pdf</code> endpoint.
      </div>
    </div>
  );
}
