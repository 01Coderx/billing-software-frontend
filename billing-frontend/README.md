# BillFlow — Next.js Frontend for the Spring Boot Billing API

A responsive billing dashboard built with Next.js App Router, TypeScript, Tailwind CSS 4, shadcn-style primitives, Lucide icons and Recharts.

## Backend connection

The frontend connects to the supplied Spring Boot API through the Next.js `/api/*` rewrite.

```env
BACKEND_URL=http://localhost:8000
```

The supplied backend runs on port `8000`.

## Supported backend endpoints

### Customers
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `DELETE /api/products/:id`

### Bills / invoices
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices`
- `PUT /api/invoices/:id`
- `DELETE /api/invoices/:id`
- `GET /api/invoices/:id/pdf`

## Bill workflow

The frontend now matches the updated backend:

1. Create a bill.
2. Select a customer or use a walk-in customer.
3. Add products.
4. Set the **Rate** independently for every line item.
5. Change quantity.
6. Optionally enter tax and discount.
7. Save the bill.
8. Open, edit or delete the bill later.
9. Print the bill or download the backend-generated PDF.

The backend remains the source of truth for subtotal, tax, discount and total.

### Rate behavior

Each bill line sends:

```json
{
  "product": { "id": 1 },
  "rate": 125.50,
  "quantity": 3
}
```

The backend calculates:

```text
amount = rate × quantity
```

When no rate is supplied, the backend falls back to the product catalogue price.

## PDF / printing

The **Download PDF** button uses:

```text
GET /api/invoices/:id/pdf
```

The Spring Boot PDF includes:

```text
# | ITEM | RATE | QTY | AMOUNT
```

The customer line has been made slightly larger and bolder for readability.

The frontend also has a browser print preview at:

```text
/invoices/:id/print
```

It uses the same five-column layout and enlarged customer text.

## Run locally

Requirements:

- Node.js 20.9+
- Spring Boot backend running on port 8000

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production

Set `BACKEND_URL` to the public Spring Boot API URL before building.

```env
BACKEND_URL=https://your-billing-api.example.com
```

Then:

```bash
npm install
npm run build
npm start
```

## Tailwind / PostCSS

This project intentionally keeps **Tailwind CSS 4** with the matching `@tailwindcss/postcss` plugin.

Do not replace the current `postcss.config.mjs` with an older Tailwind 3 configuration.

Current configuration:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

This avoids the common Tailwind 4 / PostCSS plugin mismatch.

## Project structure

```text
app/
  dashboard/
  customers/
  products/
  invoices/
    page.tsx
    new/page.tsx
    [id]/page.tsx
    [id]/edit/page.tsx
    [id]/print/page.tsx

components/
  invoice-form.tsx

lib/
  api.ts

types/
  billing.ts
```
