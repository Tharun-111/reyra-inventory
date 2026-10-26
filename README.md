# REYRA Inventory

REYRA Inventory is a business operations app for managing a product catalog, stock, purchasing, sales, customers, and invoices in one workspace. Its dashboard and reports bring day-to-day activity together, while barcode tools, global search, and data backup help teams handle routine work.

## Product areas

- **Dashboard:** View sales and order activity, procurement totals, fulfillment progress, and inventory health over selectable date ranges. Low-stock items are highlighted for follow-up.
- **Products:** Maintain products and variants, SKUs, barcodes, pricing, discounts, and product details. Find items by name, SKU, or barcode, and create printable barcode labels.
- **Inventory:** Review stock levels and low-stock items, record adjustments, and track stock movement history. Sales, purchases, returns, and cancellations update stock through the inventory workflow.
- **Sales and orders:** Create customer orders, associate sales channels, follow order statuses, manage customer records, and process returns.
- **Invoices:** Generate invoices from orders, review invoice details, and print or download invoices as PDF or standalone HTML.
- **Procurement:** Maintain supplier purchase records and purchase line items, and record received stock.
- **Reports and analytics:** Review sales, product, and sales-channel summaries; generate period-based statements; export order data as CSV; and create a full data backup.
- **Settings:** Configure business details, logo, currency, tax, invoice and purchase numbering, stock thresholds, negative-stock behavior, and terms and conditions. Theme and role-specific access options are also available.
- **Global search:** Search products, variants, orders, purchases, and customers from a single interface, then navigate directly to a matching record.
- **AI assistant:** Ask inventory, sales, or procurement questions using a business-data snapshot from the app. The assistant uses the Gemini API through the app's server endpoint.

## Business workflows

The app connects common inventory operations. Purchase records represent incoming goods; sales orders represent outgoing goods; returns and order cancellations reconcile stock and record movement history. Order records can be used to create invoices, while reports summarize order and catalog activity for review.

Products can be tracked as single items or as variant-based products. SKU and barcode fields support both manual lookup and barcode scanning. USB/HID scanners can enter scanned codes directly into the app, and camera-based scanning is available through the barcode scanner interface.

## Access and data

The interface includes role-aware access for **admin**, **manager**, **sales**, **inventory**, **purchase**, and **viewer** roles. The intended permissions vary by role, from broad administration to focused sales, stock, or purchasing work and read-only access.

Business records, settings, authentication session details, and theme preference are currently persisted in the browser's local storage. This makes the application usable without a continuously connected database, but local browser data is specific to that browser profile and device. The Reports and Settings areas provide export and backup/restore tools for moving or preserving data.

The repository includes a Supabase client configuration and a database migration for a hosted schema. The current application data service uses browser local storage; the presence of the Supabase schema does not by itself synchronize local records to a Supabase project.

The AI assistant requires the application's server endpoint and a configured Gemini API key. When a question is sent, the app may include a snapshot of relevant catalog, inventory, order, and purchase information as context for the response.

## Experience

REYRA Inventory is a responsive React and TypeScript application styled with Tailwind CSS. It includes light and dark themes, chart-based dashboards, installable Progressive Web App support, and mobile-friendly layouts. The codebase also contains Android/Capacitor and Windows/Electron packaging projects.

## Technology

- React 19 and TypeScript
- Vite and Tailwind CSS
- Express server with the Google Gemini API integration
- Browser local storage for application data
- Supabase client and SQL schema assets
- Capacitor for Android packaging
- Electron for Windows desktop packaging
