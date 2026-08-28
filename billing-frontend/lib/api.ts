import type { Customer, Invoice, InvoiceDraft, Product } from "@/types/billing";

const API_BASE_URL =
  process.env.NEXT_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    return (await response.blob()) as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  customers: {
    list: () => request<Customer[]>("/api/customers"),
    get: (id: number) => request<Customer>(`/api/customers/${id}`),
    create: (payload: Customer) =>
      request<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  products: {
    list: () => request<Product[]>("/api/products"),
    get: (id: number) => request<Product>(`/api/products/${id}`),
    create: (payload: Product) =>
      request<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      request<void>(`/api/products/${id}`, { method: "DELETE" }),
  },

  invoices: {
    list: () => request<Invoice[]>("/api/invoices"),
    get: (id: number) => request<Invoice>(`/api/invoices/${id}`),
    create: (payload: InvoiceDraft) =>
      request<Invoice>("/api/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: InvoiceDraft) =>
      request<Invoice>(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      request<void>(`/api/invoices/${id}`, { method: "DELETE" }),
    pdf: (id: number) =>
  request<Blob>(`/api/invoices/${id}/pdf`, {
    headers: {
      Accept: "application/pdf",
    },
  }),
  },
};
