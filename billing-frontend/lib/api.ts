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
      // Retain generic status message if parsing fails
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

// Exported API Methods
export const api = {
  // Customers
  getCustomers: () => request<Customer[]>("/api/customers"),
  getCustomer: (id: string | number) => request<Customer>(`/api/customers/${id}`),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: () => request<Product[]>("/api/products"),
  getProduct: (id: string | number) => request<Product>(`/api/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Invoices
  getInvoices: () => request<Invoice[]>("/api/invoices"),
  getInvoice: (id: string | number) => request<Invoice>(`/api/invoices/${id}`),
  createInvoice: (data: InvoiceDraft) =>
    request<Invoice>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  downloadInvoicePdf: (id: string | number) =>
    request<Blob>(`/api/invoices/${id}/pdf`),
};
