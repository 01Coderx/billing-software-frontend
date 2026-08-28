import type { Customer, Invoice, InvoiceDraft, Product } from "@/types/billing";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_API_URL || 
  ""
).replace(/\/$/, "");

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;

  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData && init?.body ? { "Content-Type": "application/json" } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Retain generic message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    return (await response.blob()) as unknown as T;
  }

  return response.json() as Promise<T>;
}

// Structured Nested API Object
export const api = {
  customers: {
    getAll: () => request<Customer[]>("/api/customers"),
    getById: (id: string | number) => request<Customer>(`/api/customers/${id}`),
    create: (data: Partial<Customer>) =>
      request<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: Partial<Customer>) =>
      request<Customer>(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      request<void>(`/api/customers/${id}`, { method: "DELETE" }),
  },

  products: {
    getAll: () => request<Product[]>("/api/products"),
    getById: (id: string | number) => request<Product>(`/api/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: Partial<Product>) =>
      request<Product>(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      request<void>(`/api/products/${id}`, { method: "DELETE" }),
  },

  invoices: {
    getAll: () => request<Invoice[]>("/api/invoices"),
    getById: (id: string | number) => request<Invoice>(`/api/invoices/${id}`),
    create: (data: InvoiceDraft) =>
      request<Invoice>("/api/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: Partial<InvoiceDraft>) =>
      request<Invoice>(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      request<void>(`/api/invoices/${id}`, { method: "DELETE" }),
    downloadPdf: (id: string | number) =>
      request<Blob>(`/api/invoices/${id}/pdf`),
  },
};
