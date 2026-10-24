const test = require("node:test");
const assert = require("node:assert/strict");
process.env.NODE_ENV = "test";
process.env.NOVASHOP_DEMO_MODE = "true";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "test-admin-password-123";
const { app, orderTotals, validateOrderRequest } = require("../server");
const { diagnoseMongoFailure } = require("../db");
const { buildProductUpserts } = require("../scripts/import-products");
const bundledProducts = require("../products.json");

const validOrder = {
  items: [{ productId: "sneakers", quantity: 2 }],
  customer: {
    fullName: "Nova Shopper",
    email: "shopper@example.com",
    phone: "+91 9876543210",
    addressLine1: "12 Sample Street",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411001",
    country: "India"
  }
};

test("MongoDB diagnostics identify common failures without exposing raw error details", () => {
  const authDiagnostic = diagnoseMongoFailure({
    name: "MongoServerError",
    code: 18,
    message: "Authentication failed for user secret-user with password secret-password"
  });
  assert.match(authDiagnostic, /authentication/i);
  assert.doesNotMatch(authDiagnostic, /secret-user|secret-password/i);

  const networkDiagnostic = diagnoseMongoFailure({
    name: "MongoServerSelectionError",
    message: "ETIMEDOUT connection to cluster.example.mongodb.net"
  });
  assert.match(networkDiagnostic, /Atlas|network/i);
  assert.doesNotMatch(networkDiagnostic, /cluster\.example\.mongodb\.net/i);
});

test("validates and normalizes checkout input", () => {
  const result = validateOrderRequest({
    ...validOrder,
    customer: { ...validOrder.customer, email: "  Shopper@Example.com " },
    coupon: "nova10"
  });
  assert.equal(result.customer.email, "shopper@example.com");
  assert.equal(result.coupon, "NOVA10");
  assert.deepEqual(result.items, validOrder.items);
});

test("rejects malformed cart lines and customer details", () => {
  assert.throws(
    () => validateOrderRequest({ ...validOrder, items: [{ productId: "sneakers", quantity: 0 }] }),
    { status: 400 }
  );
  assert.throws(
    () => validateOrderRequest({ ...validOrder, customer: { ...validOrder.customer, email: "not-an-email" } }),
    { status: 400 }
  );
  assert.throws(
    () => validateOrderRequest({ ...validOrder, items: [validOrder.items[0], validOrder.items[0]] }),
    { status: 400 }
  );
});

test("calculates shipping and coupon discount using server-side integer prices", () => {
  assert.deepEqual(orderTotals(1800, "NOVA10"), { subtotal: 1800, discount: 180, shipping: 0, total: 1620 });
  assert.deepEqual(orderTotals(500, ""), { subtotal: 500, discount: 0, shipping: 99, total: 599 });
});

test("catalog importer upserts without overwriting existing product fields", () => {
  const timestamp = new Date("2026-01-01T00:00:00.000Z");
  const operations = buildProductUpserts([
    { id: "sample", name: "Imported Name", price: 100, brand: "Example" }
  ], timestamp);

  assert.equal(operations[0].updateOne.upsert, true);
  assert.deepEqual(operations[0].updateOne.update.$setOnInsert, {
    id: "sample",
    name: "Imported Name",
    price: 100,
    brand: "Example",
    stock: 20,
    description: "Imported Name by Example, selected for everyday quality and comfort.",
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  assert.ok(operations.slice(1).every((operation) => operation.updateOne.upsert === false));
  assert.ok(operations.slice(1).every((operation) => operation.updateOne.filter.id === "sample"));
  assert.ok(operations.slice(1).every((operation) => Object.keys(operation.updateOne.filter).length === 2));
  assert.ok(operations.slice(1).every((operation) => Object.hasOwn(operation.updateOne.filter, Object.keys(operation.updateOne.update.$set)[0])));
});

test("local demo catalog, commerce flows, validation, and API 404 return safe JSON", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const homepageResponse = await fetch(baseUrl);
  const homepage = await homepageResponse.text();
  assert.equal(homepageResponse.status, 200);
  assert.doesNotMatch(homepage, /data-mode-banner|Preview catalog/i);

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  assert.equal(health.application, "ok");
  assert.equal(health.database, "demo");
  assert.equal(health.mode, "local-demo");
  assert.doesNotMatch(JSON.stringify(health), /mongodb\+srv|password/i);

  const catalogResponse = await fetch(`${baseUrl}/api/products`);
  assert.notEqual(catalogResponse.headers.get("x-novashop-catalog-source"), "bundled-preview");
  assert.equal(catalogResponse.status, 200);
  assert.equal(catalogResponse.headers.get("x-novashop-mode"), "local-demo");
  const catalog = await catalogResponse.json();
  assert.equal(catalog.length, bundledProducts.length);
  assert.deepEqual((await (await fetch(`${baseUrl}/api/categories`)).json()).sort(), ["Accessories", "Beauty", "Fashion", "Home", "Tech"]);
  assert.equal((await fetch(`${baseUrl}/api/products/sneakers`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/api/cart`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/api/orders`)).status, 200);

  const paginatedResponse = await fetch(`${baseUrl}/api/products?sort=price-low&page=1&limit=3`);
  const paginatedProducts = await paginatedResponse.json();
  assert.equal(paginatedResponse.headers.get("x-total-count"), String(bundledProducts.length));
  assert.equal(paginatedProducts.length, 3);
  assert.deepEqual(paginatedProducts.map((product) => product.price), [...paginatedProducts.map((product) => product.price)].sort((a, b) => a - b));
  const invalidFilterResponse = await fetch(`${baseUrl}/api/products?sort=not-a-sort`);
  assert.equal(invalidFilterResponse.status, 400);

  const invalidOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [], customer: validOrder.customer })
  });
  assert.equal(invalidOrderResponse.status, 400);
  assert.ok((await invalidOrderResponse.json()).error);

  const invalidCartResponse = await fetch(`${baseUrl}/api/cart`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: { sneakers: 100 } })
  });
  assert.equal(invalidCartResponse.status, 400);

  const invalidNewsletterResponse = await fetch(`${baseUrl}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" })
  });
  assert.equal(invalidNewsletterResponse.status, 400);

  const cookie = catalogResponse.headers.get("set-cookie").split(";")[0];
  const cookieHeaders = { Cookie: cookie };
  const saveCartResponse = await fetch(`${baseUrl}/api/cart`, {
    method: "PUT",
    headers: { ...cookieHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ items: { sneakers: 2 } })
  });
  assert.equal(saveCartResponse.status, 200);
  assert.deepEqual((await saveCartResponse.json()).items, { sneakers: 2 });
  const placeOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { ...cookieHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ...validOrder, coupon: "NOVA10" })
  });
  assert.equal(placeOrderResponse.status, 201);
  const placedOrder = await placeOrderResponse.json();
  assert.equal(placedOrder.totals.total, 16198);
  assert.equal(placedOrder.paymentStatus, "not_started");
  assert.equal((await (await fetch(`${baseUrl}/api/products/sneakers`)).json()).stock, 18);
  const trackedOrderResponse = await fetch(`${baseUrl}/api/orders/${placedOrder.orderNumber}`, { headers: cookieHeaders });
  assert.equal(trackedOrderResponse.status, 200);
  assert.equal((await trackedOrderResponse.json()).orderNumber, placedOrder.orderNumber);
  assert.equal((await (await fetch(`${baseUrl}/api/orders`, { headers: cookieHeaders })).json()).orders.length, 1);
  assert.equal((await (await fetch(`${baseUrl}/api/cart`, { headers: cookieHeaders })).json()).items.sneakers, undefined);
  assert.equal((await fetch(`${baseUrl}/api/orders/${placedOrder.orderNumber}`)).status, 404);

  assert.equal((await fetch(`${baseUrl}/api/admin/overview`, { headers: cookieHeaders })).status, 401);
  const registrationResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { ...cookieHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Nova Shopper", email: "shopper@example.com", password: "customer-password-123" })
  });
  assert.equal(registrationResponse.status, 201);
  const registered = await registrationResponse.json();
  assert.equal(registered.user.role, "customer");
  assert.match(registrationResponse.headers.get("set-cookie"), /HttpOnly/);
  const registeredSessionCookie = registrationResponse.headers.get("set-cookie").match(/novashop-session=[A-Za-z0-9_-]+/)[0];
  const customerHeaders = { Cookie: `${cookie}; ${registeredSessionCookie}` };
  assert.equal((await fetch(`${baseUrl}/api/admin/overview`, { headers: customerHeaders })).status, 403);
  const customerOrderResponse = await fetch(`${baseUrl}/api/orders`, { headers: customerHeaders });
  assert.equal((await customerOrderResponse.json()).orders.length, 1);
  const duplicateAccountResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Duplicate", email: "shopper@example.com", password: "customer-password-123" })
  });
  assert.equal(duplicateAccountResponse.status, 409);
  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: customerHeaders });
  assert.equal(logoutResponse.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/api/auth/session`, { headers: customerHeaders })).json()).user, null);
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { ...cookieHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "shopper@example.com", password: "customer-password-123" })
  });
  assert.equal(loginResponse.status, 200);
  const customerSessionCookie = loginResponse.headers.get("set-cookie").match(/novashop-session=[A-Za-z0-9_-]+/)[0];
  const customerSessionHeaders = { Cookie: `${cookie}; ${customerSessionCookie}` };
  assert.equal((await (await fetch(`${baseUrl}/api/auth/session`, { headers: customerSessionHeaders })).json()).user.email, "shopper@example.com");
  const accountOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { ...customerSessionHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(validOrder)
  });
  assert.equal(accountOrderResponse.status, 201);
  const accountOrder = await accountOrderResponse.json();
  const secondBrowserOrders = await fetch(`${baseUrl}/api/orders`, {
    headers: { Cookie: `novashop-cart-id=another-browser-cart-id; ${customerSessionCookie}` }
  });
  assert.equal((await secondBrowserOrders.json()).orders[0].orderNumber, accountOrder.orderNumber);
  assert.equal((await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "shopper@example.com", password: "wrong-password" })
  })).status, 401);

  const adminLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ADMIN@example.com", password: process.env.ADMIN_PASSWORD })
  });
  assert.equal(adminLoginResponse.status, 200);
  assert.equal((await adminLoginResponse.json()).user.role, "admin");
  const adminSessionCookie = adminLoginResponse.headers.get("set-cookie").match(/novashop-session=[A-Za-z0-9_-]+/)[0];
  const adminHeaders = { Cookie: `${cookie}; ${adminSessionCookie}` };
  const createdProductResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: "POST",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "admin-test-product", name: "Admin Test Product", brand: "Nova", category: "Tech",
      description: "Product created by the admin test.", image: "photo-1234",
      price: 1200, oldPrice: 1500, stock: 9, rating: 4.5, reviews: 0, badge: "", colors: ["#7650d5"]
    })
  });
  assert.equal(createdProductResponse.status, 201);
  const adminProductResponse = await fetch(`${baseUrl}/api/admin/products`, { headers: adminHeaders });
  assert.ok((await adminProductResponse.json()).products.some((product) => product.id === "admin-test-product"));
  const archiveResponse = await fetch(`${baseUrl}/api/admin/products/admin-test-product`, {
    method: "DELETE",
    headers: adminHeaders
  });
  assert.equal(archiveResponse.status, 200);
  assert.equal((await fetch(`${baseUrl}/api/products/admin-test-product`)).status, 404);
  const updateOrderResponse = await fetch(`${baseUrl}/api/admin/orders/${placedOrder.orderNumber}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "shipped" })
  });
  assert.equal(updateOrderResponse.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/api/orders/${placedOrder.orderNumber}`, { headers: cookieHeaders })).json()).status, "shipped");
  const invalidCancellationResponse = await fetch(`${baseUrl}/api/admin/orders/${placedOrder.orderNumber}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" })
  });
  assert.equal(invalidCancellationResponse.status, 409);
  const cancellationResponse = await fetch(`${baseUrl}/api/admin/orders/${accountOrder.orderNumber}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" })
  });
  assert.equal(cancellationResponse.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/api/orders/${accountOrder.orderNumber}`, { headers: customerSessionHeaders })).json()).status, "cancelled");
  assert.equal((await (await fetch(`${baseUrl}/api/products/sneakers`)).json()).stock, 18);

  const firstSubscription = await fetch(`${baseUrl}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@example.com" })
  });
  assert.equal(firstSubscription.status, 201);
  const duplicateSubscription = await fetch(`${baseUrl}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@example.com" })
  });
  assert.equal(duplicateSubscription.status, 200);

  const notFoundResponse = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(notFoundResponse.status, 404);
  assert.ok((await notFoundResponse.json()).error);
});
