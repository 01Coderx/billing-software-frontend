"use client";

import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/invoice-form";
import type { Invoice } from "@/types/billing";

export default function NewInvoicePage() {
  const router = useRouter();

  return (
    <InvoiceForm
      mode="create"
      onSaved={(invoice: Invoice) => router.push(`/invoices/${invoice.id}`)}
    />
  );
}
