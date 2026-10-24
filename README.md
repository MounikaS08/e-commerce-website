# NovaShop

NovaShop is a responsive storefront served by one Express application. By default in development, it runs in a local demo mode using the bundled catalog, a browser-local cart, and temporary in-memory accounts, orders, and newsletter subscriptions. No database account or payment configuration is needed to explore the storefront. Demo accounts, sessions, orders, and newsletter subscriptions are cleared when the server restarts, and no payment is collected.

MongoDB Atlas is optional for the local demo. Set `NOVASHOP_DEMO_MODE=false` and configure `MONGODB_URI` to use persistent MongoDB-backed accounts, sessions, catalog, carts, orders, and newsletter instead. Local demo mode is never enabled when `NODE_ENV=production`; production requires a valid MongoDB configuration and does not fall back to sample data.

## Run the local demo

- Node.js 18 or newer and npm

Install dependencies and start NovaShop:

```powershell
npm install
npm start
```

Open <http://localhost:3000>. The storefront displays a notice when local demo mode is active. The cart is saved in this browser; demo orders and newsletter subscriptions are stored in server memory until restart. Product stock changes made by demo orders also reset when the server restarts.

## Deploy to Render

This repository includes a Render Blueprint in `render.yaml`. Open the [Render Blueprint deploy page](https://render.com/deploy?repo=https://github.com/MounikaS08/e-commerce-website), sign in to Render, and connect the GitHub repository. Render will ask for the private `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values. Enter them only in Render's environment-variable form; do not commit them to the repository. The admin password must be at least 12 characters.

The service uses MongoDB database `NovaShop`, runs the production server, and checks `/api/health` before marking deployment healthy. The MongoDB Atlas network access list must allow connections from Render (use Atlas's documented Render connectivity guidance rather than exposing database access broadly). After the first successful deployment, Render provides the public `https://...onrender.com` URL in the service dashboard. The free web service may sleep when idle, so the first request after inactivity can take longer.

## Optional MongoDB setup

To use persistent data instead of local demo mode, you need a MongoDB Atlas cluster, a database user, and an IP access-list entry for the development machine.

Create a local `.env` file from the example template:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

If `.env` already exists, keep it and edit it locally instead of copying over it.

Edit `.env` locally:

```dotenv
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/novashop?retryWrites=true&w=majority
MONGODB_DB=novashop
PORT=3000
NODE_ENV=development
NOVASHOP_DEMO_MODE=false
ADMIN_EMAIL=store-admin@example.com
ADMIN_PASSWORD=replace-with-a-long-random-password
```

Replace the placeholders with the Atlas connection details and your own admin email/password. The admin password must be at least 12 characters. Set `NOVASHOP_DEMO_MODE=false` to opt into MongoDB-backed behavior. URL-encode special characters in the **MongoDB username and password components**; do not encode the full URI. Never paste database credentials or the admin password into source code or chat. `.env` is ignored by Git.

The account screen supports customer registration, sign-in, and sign-out. Passwords are stored as salted scrypt hashes; login sessions use random HttpOnly, SameSite cookies and expire after 14 days. Sign-in and registration are limited to 10 attempts per IP in a 15-minute window. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server to seed the protected admin account. The Admin button is shown only to that role. The admin dashboard can add/edit/archive products and update order status. In local demo mode account data and sessions exist only in memory and are not suitable for real customers.

The server, database module, and product importer load `.env` from the project directory, independent of the shell's current directory. Environment variables already supplied by the process take precedence.

In Atlas, create a dedicated least-privilege database user for the application and permit only the development machine's current IP in Network Access. Do not open Atlas access to all addresses as a troubleshooting shortcut.

## Import the bundled product catalog

After Atlas is reachable and `.env` is configured with `NOVASHOP_DEMO_MODE=false`, import the existing products once:

```powershell
npm run import:products
```

The importer uses the existing `products.json` structure and upserts by unique `id` using `$setOnInsert`, so existing product fields are not replaced. It fills only missing default fields such as stock, description, active state, and timestamps. Re-running the importer is safe and does not reset stock or overwrite existing catalog values.

Collections are created on use:

- `products`: catalog fields from `products.json`, plus `stock`, `description`, `active`, `createdAt`, and `updatedAt`. `id` has a unique index.
- `carts`: guest browser cart quantities, keyed by an HttpOnly random browser cookie. Old guest carts expire after 180 days.
- `orders`: server-priced item snapshots, delivery contact/address, totals, order/payment states, and timestamps. Order-number and guest/date indexes are created at server startup.
- `newsletter`: unique email and subscription timestamp.
- `users`: unique email, display name, role, and salted password hash.
- `authSessions`: hashed session token and expiry; expired sessions are removed by a TTL index.

Order stock reservation and order insertion run in a MongoDB transaction (Atlas replica-set deployment required). Checkout records an order with payment marked `not_started`; no payment is collected. No card data is requested or stored. Guest orders can be retrieved only from the same browser cookie; signed-in customers can also see orders associated with their account.

## Verify

Check the app with <http://localhost:3000/api/health>. Local demo mode returns `database: "demo"` and `mode: "local-demo"`. In MongoDB mode, a `200` response with `database: "connected"` means Atlas answered a ping; `503` reports `configuration-required`, `configuration-invalid`, or `disconnected` without returning credentials. The storefront does not substitute bundled products when MongoDB mode is selected but unavailable.

Run the project checks:

```powershell
npm run check
npm test
```

## API

All endpoints are same-origin under `/api`; CORS is not enabled.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | App/data-mode status; MongoDB mode returns `503` while the database is unavailable. |
| `POST` | `/api/auth/register` | Create a customer account; password must be at least 12 characters. |
| `POST` | `/api/auth/login` | Sign in and issue an HttpOnly session cookie. |
| `POST` | `/api/auth/logout` | Revoke the current account session. |
| `GET` | `/api/auth/session` | Return the signed-in account, if any. |
| `GET` | `/api/categories` | Active catalog category names. |
| `GET` | `/api/products` | Product list. Optional `q`, `category`, `maxPrice`, `sort`, `page`, and `limit` query parameters; `limit` is capped at 50. Pagination details are returned in `X-Total-Count`, `X-Page`, and `X-Page-Size` headers. |
| `GET` | `/api/products/:id` | One active product by catalog id. |
| `GET` | `/api/cart` | Current browser's cart. |
| `PUT` | `/api/cart` | Validate and store `{ "items": { "product-id": quantity } }`. |
| `POST` | `/api/orders` | Validate customer and item quantities, use server-side prices/stock, reserve stock, and create an order. MongoDB mode uses a transaction; local demo mode stores orders temporarily in memory. `coupon` is optional; `NOVA10` is supported. |
| `GET` | `/api/orders/:orderNumber` | Retrieve tracking status for an order belonging to the current browser cookie or signed-in account. |
| `POST` | `/api/newsletter` | Validate and store `{ "email": "..." }` in MongoDB or temporarily in local demo memory. |
| `GET` | `/api/admin/overview` | Admin-only store totals and recent orders. |
| `GET`, `POST` | `/api/admin/products` | Admin-only product list and product creation. |
| `PATCH`, `DELETE` | `/api/admin/products/:id` | Admin-only product update or soft-archive. |
| `GET` | `/api/admin/orders` | Admin-only order list. |
| `PATCH` | `/api/admin/orders/:orderNumber` | Admin-only order status update. Cancelling a placed/processing order restores stock; shipped/delivered orders cannot be cancelled, and cancelled orders cannot be reopened. |

## Troubleshooting

- `configuration-required`: replace the template `MONGODB_URI` in the local `.env` file, set `NOVASHOP_DEMO_MODE=false`, then restart Node. MongoDB-backed requests remain unavailable until the database connects. To use the local demo instead, remove that setting or set `NOVASHOP_DEMO_MODE=true` outside production.
- `configuration-invalid`: check that the Atlas URI scheme is `mongodb+srv://` or `mongodb://` and that placeholders are removed.
- `disconnected`: check the Atlas cluster state, database username/password (URL-encode special characters), DNS/network access, and Atlas IP access list. Restart after fixing local environment settings.
- Product list empty with a connected database: run `npm run import:products`.
- Transactions unavailable: order creation requires a replica set; MongoDB Atlas clusters provide this, while a standalone local MongoDB may not.
- `EADDRINUSE`: stop the other local server process or set a different `PORT`.

The example social profiles and `hello@novashop.example` contact are placeholders for storefront presentation and should be replaced before public launch. Password reset, multi-factor authentication, a payment gateway, real carrier tracking, and a production privacy/returns policy are not implemented.
