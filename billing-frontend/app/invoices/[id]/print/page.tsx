"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Invoice } from "@/types/billing";

function money(value: number | null | undefined) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

export default function PrintInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    api.invoices.get(id)
      .then(setInvoice)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load invoice"));
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [invoice]);

  if (error) return <main className="p-8 font-sans text-red-600">{error}</main>;
  if (!invoice) return <main className="p-8 font-sans text-slate-500">Preparing bill…</main>;

  const customer = invoice.customer?.name || "Walk-in Customer";

  return (
    <>
      <style jsx global>{`
        @page {
          size: 100mm 148mm;
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: white;
        }

        * {
          box-sizing: border-box;
        }

        .print-bill {
          width: 100mm;
          min-height: 148mm;
          padding: 9mm 7mm;
          margin: 0 auto;
          color: #111827;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          line-height: 1.3;
        }

        .title {
          text-align: center;
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 3px;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 8px;
        }

        .customer {
          margin: 8px 0;
          font-size: 12px;
          font-weight: 800;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
td {
  border: 0.4px solid #555;
  padding: 5px 4px;
  vertical-align: middle;
}

th {
  font-size: 14px !important;
  line-height: 1.2;
  text-transform: uppercase;
  font-weight: 900;
}

td {
  font-size: 13px !important;
  line-height: 1.25;
  font-weight: 700;
}

        th:nth-child(1),
td:nth-child(1) {
  width: 9%;
}

th:nth-child(2),
td:nth-child(2) {
  width: 43%;
}

th:nth-child(3),
td:nth-child(3) {
  width: 18%;
}

th:nth-child(4),
td:nth-child(4) {
  width: 30%;
}


        .right { text-align: right; }
        .center { text-align: center; }

        .totals {
          margin-top: 7px;
          margin-left: auto;
          width: 62%;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }

        .grand {
          border-top: 0.7px solid #111827;
          margin-top: 2px;
          padding-top: 4px;
          font-size: 14px;
          font-weight: 900;
        }

        .footer {
          margin-top: 9px;
          text-align: center;
          font-size: 7.5px;
        }

        @media screen {
          body { background: #e5e7eb; }
          .print-bill {
            margin: 24px auto;
            box-shadow: 0 8px 35px rgba(0,0,0,.16);
          }
        }

        @media print {
          .print-bill {
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <main className="print-bill">
        <div className="title">BILL / RECEIPT</div>

        <div className="meta">
          <strong>Invoice: {invoice.invoiceNumber}</strong>
          <span>Date: {date(invoice.createdAt)}</span>
        </div>

        <div className="customer">
          Customer: {customer}
          {invoice.customer?.phone ? ` | ${invoice.customer.phone}` : ""}
        </div>

        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Item</th>
              <th className="right">Rate</th>
              <th className="right">Qty</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={item.id ?? `${item.product?.id}-${index}`}>
                <td className="center">{index + 1}</td>
                <td>{item.product?.name || "Item"}</td>
                <td className="right">{money(item.rate)}</td>
                <td className="right">{item.quantity}</td>
                <td className="right">{money(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-row">
            <span>Subtotal</span>
            <strong>{money(invoice.subtotal)}</strong>
          </div>

          {Number(invoice.tax || 0) !== 0 && (
            <div className="total-row">
              <span>Tax</span>
              <strong>{money(invoice.tax)}</strong>
            </div>
          )}

          {Number(invoice.discount || 0) !== 0 && (
            <div className="total-row">
              <span>Discount</span>
              <strong>-{money(invoice.discount)}</strong>
            </div>
          )}

          <div className="total-row grand">
            <span>TOTAL</span>
            <strong>{money(invoice.total)}</strong>
          </div>
        </div>

        <div className="footer">Thank you for your business.</div>
      </main>
    </>
  );
}
