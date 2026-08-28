export type Product = {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  taxable?: boolean;
};

export type Customer = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type InvoiceItem = {
  id?: number;
  product: Product;
  rate: number;
  quantity: number;
  amount: number;
};

export type Invoice = {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  customer?: Customer | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED" | string;
  items: InvoiceItem[];
};

export type InvoiceItemDraft = {
  productId: number;
  rate: number;
  quantity: number;
};

export type InvoiceDraft = {
  dueDate?: string | null;
  customer?: { id: number } | null;
  tax?: number;
  discount?: number;
  status?: Invoice["status"];
  items: InvoiceItemDraft[];
};
