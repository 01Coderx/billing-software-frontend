"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoiceForm from "@/components/invoice-form";
import { api } from "@/lib/api";
import type { Invoice } from "@/types/billing";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid invoice id.");
      setLoading(false);
      return;
    }

    api.invoices
      .get(id)
      .then(setInvoice)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load invoice"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="card p-8 text-sm text-slate-500">Loading bill…</div>;
  }

  if (!invoice) {
    return <div className="card p-8 text-rose-600">{error || "Bill not found."}</div>;
  }

  return (
    <InvoiceForm
      mode="edit"
      initialInvoice={invoice}
      onSaved={(saved) => router.push(`/invoices/${saved.id}`)}
    />
  );
}
