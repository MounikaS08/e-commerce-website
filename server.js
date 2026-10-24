const path = require("node:path");
const { randomUUID } = require("node:crypto");
const express = require("express");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { DatabaseUnavailableError, closeDatabase, getDatabase, healthCheck } = require("./db");
const { createDemoStore } = require("./demo-store");
const { createAuthStore } = require("./auth-store");

const app = express();
const port = Number(process.env.PORT || 3000);
const demoSetting = (process.env.NOVASHOP_DEMO_MODE || "").trim().toLowerCase();
const demoMode = process.env.NODE_ENV !== "production" && demoSetting !== "false";
const demoStore = createDemoStore(require("./products.json"));
const authStore = createAuthStore({
  demoMode,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
});
app.set("trust proxy", 1);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

let indexedDatabase;
let databaseIndexesPromise;
let authInitialization;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function cleanText(value, fieldName, maxLength, optional = false) {
  if (value === undefined && optional) return "";
  if (typeof value !== "string" || value.length > maxLength) throw new ApiError(400, `${fieldName} must be text with no more than ${maxLength} characters.`);
  return value.trim();
}

function validateOrderRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new ApiError(400, "Add at least one item to your bag before checkout.");
  }
  const items = [];
  const seen = new Set();
  for (const entry of body.items) {
    if (!entry || typeof entry.productId !== "string" || !/^[\w-]{1,80}$/.test(entry.productId) ||
        !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 99 || seen.has(entry.productId)) {
      throw new ApiError(400, "The bag contains an invalid product or quantity.");
    }
    seen.add(entry.productId);
    items.push({ productId: entry.productId, quantity: entry.quantity });
  }
  const input = body.customer;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "Enter your delivery details to continue.");
  }
  const customer = {
    fullName: cleanText(input.fullName, "Full name", 100),
    email: cleanText(input.email, "Email address", 254).toLowerCase(),
    phone: cleanText(input.phone, "Phone number", 30),
    addressLine1: cleanText(input.addressLine1, "Address line 1", 160),
    addressLine2: cleanText(input.addressLine2, "Address line 2", 160, true),
    city: cleanText(input.city, "City", 80),
    state: cleanText(input.state, "State", 80),
    postalCode: cleanText(input.postalCode, "Postal code", 20),
    country: cleanText(input.country, "Country", 80)
  };
  if (!customer.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
      !/^[+\d][\d\s().-]{6,29}$/.test(customer.phone) ||
      !customer.addressLine1 || !customer.city || !customer.state || !customer.postalCode || !customer.country) {
    throw new ApiError(400, "Check your name, email, phone, and required delivery address fields.");
  }
  const coupon = cleanText(body.coupon, "Coupon", 30, true).toUpperCase();
  if (coupon && coupon !== "NOVA10") throw new ApiError(400, "That discount code is not valid.");
  return { items, customer, coupon };
}

function orderTotals(subtotal, coupon) {
  const discount = coupon === "NOVA10" ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 99;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

async function getAppDatabase() {
  if (demoMode) return null;
  const database = await getDatabase();
  if (indexedDatabase !== database) {
    indexedDatabase = database;
    databaseIndexesPromise = Promise.all([
      database.collection("products").createIndex(
        { id: 1 },
        { unique: true, partialFilterExpression: { id: { $type: "string" } } }
      ),
      database.collection("orders").createIndex({ orderNumber: 1 }, { unique: true }),
      database.collection("orders").createIndex({ clientId: 1, createdAt: -1 }),
      database.collection("newsletter").createIndex({ email: 1 }, { unique: true }),
      database.collection("carts").createIndex({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }),
      database.collection("users").createIndex({ email: 1 }, { unique: true }),
      database.collection("authSessions").createIndex({ tokenHash: 1 }, { unique: true }),
      database.collection("authSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    ]);
  }
  try {
    await databaseIndexesPromise;
    return database;
  } catch (error) {
    indexedDatabase = undefined;
    databaseIndexesPromise = undefined;
    throw error;
  }
}

app.use(express.json({ limit: "16kb" }));
app.use((request, _response, next) => {
  if (process.env.NODE_ENV !== "production") console.info(`${request.method} ${request.path}`);
  next();
});

app.get("/", (_request, response) => response.sendFile(path.join(__dirname, "index.html")));
app.get("/app.js", (_request, response) => response.sendFile(path.join(__dirname, "app.js")));
app.get("/styles.css", (_request, response) => response.sendFile(path.join(__dirname, "styles.css")));

function productQueryOptions(query) {
  const { q, category, maxPrice, sort, page, limit } = query;
  const filter = { active: { $ne: false }, id: { $type: "string" } };
  if (q !== undefined) {
    if (typeof q !== "string" || q.length > 100) throw new ApiError(400, "Search must be 100 characters or fewer.");
    const term = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (term) filter.$or = ["name", "brand", "category"].map((field) => ({ [field]: { $regex: term, $options: "i" } }));
  }
  if (category !== undefined) {
    if (typeof category !== "string" || category.length > 50) throw new ApiError(400, "Category is invalid.");
    if (category && category !== "All") filter.category = category;
  }
  if (maxPrice !== undefined) {
    const price = Number(maxPrice);
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, "Maximum price must be a non-negative number.");
    filter.price = { $lte: price };
  }
  const sortOptions = {
    featured: {},
    "price-low": { price: 1 },
    "price-high": { price: -1 },
    rating: { rating: -1 }
  };
  if (sort !== undefined && !Object.hasOwn(sortOptions, sort)) throw new ApiError(400, "Sort option is invalid.");
  const pageNumber = page === undefined ? 1 : Number(page);
  const pageSize = limit === undefined ? (page === undefined ? undefined : 24) : Number(limit);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50))) {
    throw new ApiError(400, "Page and page size must be valid positive integers; page size cannot exceed 50.");
  }
  return { filter, q: typeof q === "string" ? q.trim().toLowerCase() : "", sort: sort || "featured", pageNumber, pageSize, sortOptions };
}

async function listProducts(database, options, response) {
  const { filter, sort, sortOptions, pageNumber, pageSize } = options;
  const collection = database.collection("products");
  const cursor = collection.find(filter, { projection: { _id: 0 } }).sort(sortOptions[sort]);
  if (pageSize !== undefined) cursor.skip((pageNumber - 1) * pageSize).limit(pageSize);
  const results = await cursor.toArray();
  if (pageSize !== undefined) {
    const total = await collection.countDocuments(filter);
    response.setHeader("X-Total-Count", String(total));
    response.setHeader("X-Page", String(pageNumber));
    response.setHeader("X-Page-Size", String(pageSize));
  }
  return results;
}

app.use("/api", (request, response, next) => {
  response.setHeader("X-NovaShop-Mode", demoMode ? "local-demo" : "mongodb");
  const match = (request.headers.cookie || "").match(/(?:^|;\s*)novashop-cart-id=([\w-]{20,80})(?:;|$)/);
  request.cartClientId = match ? match[1] : randomUUID();

  if (!match) {
    const secure = request.secure || process.env.NODE_ENV === "production" ? "; Secure" : "";
    response.setHeader("Set-Cookie", `novashop-cart-id=${request.cartClientId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`);
  }
  const sessionMatch = (request.headers.cookie || "").match(/(?:^|;\s*)novashop-session=([A-Za-z0-9_-]{40,100})(?:;|$)/);
  request.sessionToken = sessionMatch ? sessionMatch[1] : "";

  next();
});

function sessionCookie(token, request) {
  const secure = request.secure || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `novashop-session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secure}`;
}

function appendSetCookie(response, cookie) {
  const current = response.getHeader("Set-Cookie");
  response.setHeader("Set-Cookie", current
    ? [...(Array.isArray(current) ? current : [current]), cookie]
    : cookie);
}

const authAttemptBuckets = new Map();
function limitAuthAttempts(request, response, next) {
  const now = Date.now();
  const key = `${request.ip}:${request.path}`;
  let bucket = authAttemptBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 15 * 60 * 1000 };
    authAttemptBuckets.set(key, bucket);
  }
  if (bucket.count >= 10) {
    response.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return response.status(429).json({ error: "Too many account attempts. Wait a few minutes and try again." });
  }
  bucket.count += 1;
  if (authAttemptBuckets.size > 1000) {
    for (const [bucketKey, entry] of authAttemptBuckets) {
      if (entry.resetAt <= now) authAttemptBuckets.delete(bucketKey);
    }
  }
  next();
}

async function authDatabase() {
  const database = demoMode ? null : await getAppDatabase();
  if (!authInitialization) authInitialization = authStore.initialize(database);
  await authInitialization;
  return database;
}

async function requireAdmin(request) {
  const user = await authStore.getSessionUser(await authDatabase(), request.sessionToken);
  if (!user) throw new ApiError(401, "Sign in with an administrator account to continue.");
  if (user.role !== "admin") throw new ApiError(403, "Administrator access is required.");
  return user;
}

function validateProduct(body, id = body?.id) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Enter valid product details.");
  const productId = cleanText(id, "Product id", 80);
  const name = cleanText(body.name, "Product name", 120);
  const brand = cleanText(body.brand, "Brand", 100);
  const category = cleanText(body.category, "Category", 50);
  const description = cleanText(body.description, "Description", 1000);
  const image = cleanText(body.image, "Image id", 120);
  if (!/^[\w-]+$/.test(productId) || !name || !brand || !category || !description || !/^[\w-]+$/.test(image)) {
    throw new ApiError(400, "Product id and image id may contain only letters, numbers, underscores, or hyphens; other text fields are required.");
  }
  for (const field of ["price", "oldPrice", "stock", "reviews"]) {
    if (!Number.isSafeInteger(body[field]) || body[field] < 0 || body[field] > 100000000) {
      throw new ApiError(400, `${field} must be a non-negative whole number.`);
    }
  }
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new ApiError(400, "Rating must be between 0 and 5.");
  const colors = Array.isArray(body.colors) ? body.colors : [];
  if (colors.length > 12 || colors.some((color) => typeof color !== "string" || !/^#[\da-f]{3,8}$/i.test(color))) {
    throw new ApiError(400, "Colors must be a list of valid hex colors.");
  }
  const badge = cleanText(body.badge || "", "Badge", 30, true);
  const active = body.active === undefined ? true : body.active;
  if (typeof active !== "boolean") throw new ApiError(400, "Product active state must be true or false.");
  return {
    id: productId, name, brand, category, description, image,
    price: body.price, oldPrice: body.oldPrice, stock: body.stock,
    rating: rating.toFixed(1), reviews: body.reviews, badge, colors, active
  };
}

app.get("/api/auth/session", async (request, response, next) => {
  try {
    response.json({ user: await authStore.getSessionUser(await authDatabase(), request.sessionToken) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", limitAuthAttempts, async (request, response, next) => {
  try {
    const name = cleanText(request.body?.name, "Name", 100);
    const email = cleanText(request.body?.email, "Email address", 254).toLowerCase();
    const password = request.body?.password;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Enter a valid name and email address.");
    if (typeof password !== "string" || password.length < 12 || password.length > 200) {
      throw new ApiError(400, "Password must be between 12 and 200 characters.");
    }
    const database = await authDatabase();
    const user = await authStore.register(database, { name, email, password });
    if (!user) throw new ApiError(409, "An account with that email already exists.");
    const session = await authStore.createSession(database, user.id);
    appendSetCookie(response, sessionCookie(session.token, request));
    response.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", limitAuthAttempts, async (request, response, next) => {
  try {
    const email = cleanText(request.body?.email, "Email address", 254).toLowerCase();
    const password = request.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length > 200) {
      throw new ApiError(400, "Enter a valid email address and password.");
    }
    const database = await authDatabase();
    const user = await authStore.authenticate(database, email, password);
    if (!user) throw new ApiError(401, "Email or password is incorrect.");
    authAttemptBuckets.delete(`${request.ip}:${request.path}`);
    const session = await authStore.createSession(database, user.id);
    appendSetCookie(response, sessionCookie(session.token, request));
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (request, response, next) => {
  try {
    await authStore.deleteSession(await authDatabase(), request.sessionToken);
    appendSetCookie(response, `novashop-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${request.secure || process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    response.json({ loggedOut: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", async (request, response, next) => {
  try {
    await requireAdmin(request);
    if (demoMode) {
      const products = demoStore.adminProducts();
      const orders = demoStore.adminOrders();
      response.json({ productCount: products.filter((product) => product.active !== false).length, orderCount: orders.length, revenue: orders.reduce((sum, order) => sum + order.total, 0), orders: orders.slice(0, 10) });
      return;
    }
    const database = await getAppDatabase();
    const [productCount, orderCount, revenueResult, orders] = await Promise.all([
      database.collection("products").countDocuments({ active: { $ne: false } }),
      database.collection("orders").countDocuments(),
      database.collection("orders").aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]).toArray(),
      database.collection("orders").find({}, { projection: { _id: 0, orderNumber: 1, customer: 1, total: 1, status: 1, paymentStatus: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray()
    ]);
    response.json({ productCount, orderCount, revenue: revenueResult[0]?.total || 0, orders });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/products", async (request, response, next) => {
  try {
    await requireAdmin(request);
    if (demoMode) {
      response.json({ products: demoStore.adminProducts() });
      return;
    }
    const products = await (await getAppDatabase()).collection("products").find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
    response.json({ products });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/products", async (request, response, next) => {
  try {
    await requireAdmin(request);
    const product = validateProduct(request.body);
    product.createdAt = new Date();
    product.updatedAt = product.createdAt;
    if (demoMode) {
      if (!demoStore.saveProduct(product)) throw new ApiError(409, "A product with that id already exists.");
    } else {
      try {
        await (await getAppDatabase()).collection("products").insertOne(product);
      } catch (error) {
        if (error.code === 11000) throw new ApiError(409, "A product with that id already exists.");
        throw error;
      }
    }
    response.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/products/:id", async (request, response, next) => {
  try {
    await requireAdmin(request);
    const changes = validateProduct(request.body, request.params.id);
    delete changes.id;
    if (demoMode) {
      if (!demoStore.updateProduct(request.params.id, changes)) throw new ApiError(404, "Product not found.");
    } else {
      const result = await (await getAppDatabase()).collection("products").updateOne(
        { id: request.params.id },
        { $set: { ...changes, updatedAt: new Date() } }
      );
      if (!result.matchedCount) throw new ApiError(404, "Product not found.");
    }
    response.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/products/:id", async (request, response, next) => {
  try {
    await requireAdmin(request);
    if (demoMode) {
      if (!demoStore.updateProduct(request.params.id, { active: false })) throw new ApiError(404, "Product not found.");
    } else {
      const result = await (await getAppDatabase()).collection("products").updateOne(
        { id: request.params.id },
        { $set: { active: false, updatedAt: new Date() } }
      );
      if (!result.matchedCount) throw new ApiError(404, "Product not found.");
    }
    response.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/orders", async (request, response, next) => {
  try {
    await requireAdmin(request);
    if (demoMode) {
      response.json({ orders: demoStore.adminOrders() });
      return;
    }
    const orders = await (await getAppDatabase()).collection("orders").find(
      {},
      { projection: { _id: 0, orderNumber: 1, customer: 1, items: 1, total: 1, status: 1, paymentStatus: 1, createdAt: 1 } }
    ).sort({ createdAt: -1 }).limit(100).toArray();
    response.json({ orders });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/orders/:orderNumber", async (request, response, next) => {
  try {
    await requireAdmin(request);
    const statuses = new Set(["placed", "processing", "shipped", "delivered", "cancelled"]);
    if (!statuses.has(request.body?.status)) throw new ApiError(400, "Order status is invalid.");
    if (demoMode) {
      const updated = demoStore.updateOrder(request.params.orderNumber, request.body.status);
      if (updated === null) throw new ApiError(404, "Order not found.");
      if (!updated) throw new ApiError(409, "Only placed or processing orders can be cancelled, and cancelled orders cannot be reopened.");
    } else if (request.body.status === "cancelled") {
      const database = await getAppDatabase();
      const orderCollection = database.collection("orders");
      const productsCollection = database.collection("products");
      const session = database.client.startSession();
      try {
        await session.withTransaction(async () => {
          const order = await orderCollection.findOne(
            { orderNumber: request.params.orderNumber },
            { session, projection: { _id: 0, status: 1, items: 1 } }
          );
          if (!order) throw new ApiError(404, "Order not found.");
          if (order.status === "cancelled") return;
          if (!["placed", "processing"].includes(order.status)) {
            throw new ApiError(409, "Only placed or processing orders can be cancelled.");
          }
          const result = await orderCollection.updateOne(
            { orderNumber: request.params.orderNumber, status: order.status },
            { $set: { status: "cancelled", updatedAt: new Date() } },
            { session }
          );
          if (!result.modifiedCount) throw new ApiError(409, "The order status changed. Refresh and try again.");
          for (const item of order.items) {
            const restored = await productsCollection.updateOne(
              { id: item.productId },
              { $inc: { stock: item.quantity }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (!restored.matchedCount) throw new ApiError(409, "An order product is missing; the cancellation could not be completed.");
          }
        });
      } finally {
        await session.endSession();
      }
    } else {
      const ordersCollection = (await getAppDatabase()).collection("orders");
      const result = await ordersCollection.updateOne(
        { orderNumber: request.params.orderNumber, status: { $ne: "cancelled" } },
        { $set: { status: request.body.status, updatedAt: new Date() } }
      );
      if (!result.matchedCount) {
        const order = await ordersCollection.findOne({ orderNumber: request.params.orderNumber }, { projection: { status: 1 } });
        if (!order) throw new ApiError(404, "Order not found.");
        throw new ApiError(409, "A cancelled order cannot be reopened.");
      }
    }
    response.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", async (_request, response) => {
  if (demoMode) {
    response.json({ status: "ok", application: "ok", database: "demo", mode: "local-demo" });
    return;
  }
  const database = await healthCheck();
  response.status(database.connected ? 200 : 503).json({
    status: database.connected ? "ok" : "degraded",
    application: "ok",
    database: database.state,
    ...(database.connected ? {} : { diagnostic: database.diagnostic })
  });
});

app.get("/api/categories", async (_request, response, next) => {
  try {
    if (demoMode) {
      response.json(demoStore.categories());
      return;
    }
    const categories = await (await getAppDatabase()).collection("products").distinct("category", {
      active: { $ne: false },
      id: { $type: "string" }
    });
    response.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products", async (request, response, next) => {
  try {
    const options = productQueryOptions(request.query);
    if (demoMode) {
      response.json(demoStore.listProducts(options, response));
      return;
    }
    response.json(await listProducts(await getAppDatabase(), options, response));
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/:id", async (request, response, next) => {
  try {
    if (demoMode) {
      const product = demoStore.product(request.params.id);
      if (!product) throw new ApiError(404, "Product not found.");
      response.json(product);
      return;
    }
    const product = await (await getAppDatabase()).collection("products").findOne(
      { id: request.params.id, active: { $ne: false } },
      { projection: { _id: 0 } }
    );
    if (!product) throw new ApiError(404, "Product not found.");
    response.json(product);
  } catch (error) {
    next(error);
  }
});

app.get("/api/cart", async (request, response, next) => {
  try {
    if (demoMode) {
      response.json({ items: demoStore.cart(request.cartClientId) });
      return;
    }
    const cart = await (await getAppDatabase()).collection("carts").findOne({ _id: request.cartClientId });
    response.json({ items: cart?.items || {} });
  } catch (error) {
    next(error);
  }
});

app.put("/api/cart", async (request, response, next) => {
  const { items } = request.body || {};
  if (!items || typeof items !== "object" || Array.isArray(items)) {
    return response.status(400).json({ error: "Cart items must be an object." });
  }

  const validItems = Object.create(null);
  for (const [id, quantity] of Object.entries(items)) {
    if (!/^[\w-]{1,80}$/.test(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return response.status(400).json({ error: "Cart contains an invalid product or quantity." });
    }
    validItems[id] = quantity;
  }

  try {
    if (demoMode) {
      response.json({ items: demoStore.saveCart(request.cartClientId, validItems) });
      return;
    }
    const database = await getAppDatabase();
    const knownProducts = await database.collection("products").find(
      { id: { $in: Object.keys(validItems) }, active: { $ne: false } },
      { projection: { id: 1 } }
    ).toArray();
    if (knownProducts.length !== Object.keys(validItems).length) throw new ApiError(400, "Cart contains an unknown product.");
    await database.collection("carts").updateOne(
      { _id: request.cartClientId },
      { $set: { items: validItems, updatedAt: new Date() } },
      { upsert: true }
    );
    response.json({ items: validItems });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (request, response, next) => {
  let session;
  try {
    const { items, customer, coupon } = validateOrderRequest(request.body);
    const account = await authStore.getSessionUser(await authDatabase(), request.sessionToken);
    if (demoMode) {
      response.status(201).json(demoStore.placeOrder(request.cartClientId, { items, customer, coupon, userId: account?.id }));
      return;
    }
    const database = await getAppDatabase();
    const productsCollection = database.collection("products");
    const orderCollection = database.collection("orders");
    const orderNumber = randomUUID();
    const createdAt = new Date();
    let createdOrder;
    session = database.client.startSession();

    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;
      const storedProducts = await productsCollection.find(
        { id: { $in: items.map((item) => item.productId) }, active: { $ne: false } },
        { session, projection: { _id: 0, id: 1, name: 1, brand: 1, price: 1, stock: 1 } }
      ).toArray();
      const productById = new Map(storedProducts.map((product) => [product.id, product]));
      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product) throw new ApiError(400, "One or more products are no longer available.");
        if (!Number.isSafeInteger(product.price) || product.price < 0) throw new ApiError(500, "A product price is unavailable. Please try again later.");
        if (!Number.isInteger(product.stock) || product.stock < item.quantity) {
          throw new ApiError(409, `${product.name} does not have enough stock for that quantity.`);
        }
        const result = await productsCollection.updateOne(
          { id: product.id, stock: { $gte: item.quantity }, active: { $ne: false } },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
          { session }
        );
        if (result.modifiedCount !== 1) throw new ApiError(409, `${product.name} stock changed. Refresh your bag and try again.`);
        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;
        orderItems.push({
          productId: product.id,
          name: product.name,
          brand: product.brand,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal
        });
      }
      const totals = orderTotals(subtotal, coupon);
      await orderCollection.insertOne({
        orderNumber,
        clientId: request.cartClientId,
        ...(account ? { userId: account.id } : {}),
        customer,
        items: orderItems,
        ...totals,
        status: "placed",
        paymentStatus: "not_started",
        paymentMethod: "not_selected",
        createdAt,
        updatedAt: createdAt
      }, { session });
      await database.collection("carts").deleteOne({ _id: request.cartClientId }, { session });
      createdOrder = {
        orderNumber,
        status: "placed",
        paymentStatus: "not_started",
        totals,
        items: orderItems
      };
    });
    response.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
});

app.get("/api/orders", async (request, response, next) => {
  try {
    const account = await authStore.getSessionUser(await authDatabase(), request.sessionToken);
    if (demoMode) {
      response.json({ orders: demoStore.recentOrders(request.cartClientId, account?.id) });
      return;
    }
    const filter = account ? { $or: [{ clientId: request.cartClientId }, { userId: account.id }] } : { clientId: request.cartClientId };
    const orders = await (await getAppDatabase()).collection("orders").find(
      filter,
      {
        projection: {
          _id: 0,
          orderNumber: 1,
          items: 1,
          subtotal: 1,
          discount: 1,
          shipping: 1,
          total: 1,
          status: 1,
          paymentStatus: 1,
          createdAt: 1
        }
      }
    ).sort({ createdAt: -1 }).limit(20).toArray();
    response.json({ orders });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/:orderNumber", async (request, response, next) => {
  try {
    if (!/^[\w-]{20,80}$/.test(request.params.orderNumber)) throw new ApiError(400, "Order number is invalid.");
    const account = await authStore.getSessionUser(await authDatabase(), request.sessionToken);
    if (demoMode) {
      const order = demoStore.order(request.cartClientId, request.params.orderNumber, account?.id);
      if (!order) throw new ApiError(404, "Order not found for this browser.");
      response.json(order);
      return;
    }
    const order = await (await getAppDatabase()).collection("orders").findOne(
      account
        ? { orderNumber: request.params.orderNumber, $or: [{ clientId: request.cartClientId }, { userId: account.id }] }
        : { orderNumber: request.params.orderNumber, clientId: request.cartClientId },
      { projection: { _id: 0, orderNumber: 1, items: 1, subtotal: 1, discount: 1, shipping: 1, total: 1, status: 1, paymentStatus: 1, createdAt: 1 } }
    );
    if (!order) throw new ApiError(404, "Order not found for this browser.");
    response.json(order);
  } catch (error) {
    next(error);
  }
});

app.post("/api/newsletter", async (request, response, next) => {
  try {
    const email = cleanText(request.body?.email, "Email address", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Enter a valid email address.");
    if (demoMode) {
      const isNew = demoStore.subscribe(email);
      response.status(isNew ? 201 : 200).json({ subscribed: true, mode: "local-demo" });
      return;
    }
    const database = await getAppDatabase();
    const result = await database.collection("newsletter").updateOne(
      { email },
      { $setOnInsert: { email, subscribedAt: new Date() } },
      { upsert: true }
    );
    response.status(result.upsertedCount ? 201 : 200).json({ subscribed: true });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_request, _response, next) => next(new ApiError(404, "API endpoint not found.")));

app.use((error, _request, response, _next) => {
  const status = Number.isInteger(error.status) ? error.status : Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (status >= 500) console.error(`NovaShop request failed (${error.name || "Error"}).`);
  response.status(status).json({
    error: status === 503 && error instanceof DatabaseUnavailableError
      ? error.message
      : status >= 500
      ? "NovaShop could not complete the request. Check service availability and try again."
      : status === 413
        ? "Request body is too large."
        : error.message
  });
});

async function initializeDatabase() {
  try {
    await authDatabase();
    if (demoMode) {
      console.info("NovaShop is running in local demo mode; catalog data is bundled and demo submissions are temporary.");
      return;
    }
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      console.error(`MongoDB initialization is unavailable: ${error.message}`);
    } else {
      console.error(`NovaShop initialization failed (${error.name}): ${error.message}`);
    }
  }
}

function startServer() {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`NovaShop frontend and API are listening at http://localhost:${port}`);
    void initializeDatabase();
  });
  server.on("error", (error) => {
    console.error(`Unable to listen on port ${port}: ${error.message}`);
    process.exitCode = 1;
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await closeDatabase();
      process.exit(0);
    });
  }
  return server;
}

if (require.main === module) startServer();

module.exports = { app, orderTotals, startServer, validateOrderRequest };
