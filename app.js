const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  gem: '<path d="m6 3-4 6 10 12L22 9l-4-6H6Z"/><path d="M2 9h20M6 3l3 6 3 12 3-12 3-6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7V8Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  heart: '<path d="M20.8 8.6c0 4.5-8.8 11.1-8.8 11.1S3.2 13.1 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/>',
  ticket: '<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 1 0-6V5H2v4Z"/><path d="M13 5v2m0 4v2m0 4v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  headset: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M5 14h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm14 0h-2v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Zm-2 8h-5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  shirt: '<path d="m16 4 5 3-3 5-3-2v11H9V10l-3 2-3-5 5-3a4 4 0 0 0 8 0Z"/>',
  headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M5 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm14 0h-3v6h3a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/>',
  lamp: '<path d="M9 18h6m-5 3h4m-2-3V9m-5 0h10l-2-6H9L7 9Z"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  bag: '<path d="M5 8h14l1 12H4L5 8Z"/><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/>',
};

document.querySelectorAll("[data-icon]").forEach((node) => {
  const name = node.dataset.icon;
  if (icons[name]) node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
});

let products = [];
let catalogState = "loading";
let localDemo = false;
const imageUrl = (id, width = 520) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const currency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
function loadStoredValue(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored);
  } catch (error) {
    if (key === "novashop-theme" && (stored === "light" || stored === "dark")) return stored;
    console.error(`Unable to read saved ${key} data.`, error);
    return fallback;
  }
}

const cart = new Map();
const favorites = new Set();
let activeCategory = "All";
let searchTerm = "";
let promoApplied = false;
let wishlistOnly = false;
let sortOrder = "featured";
let maxPrice = Infinity;
let toastTimeout;
let cartSaveQueue = Promise.resolve();
let cartDirty = false;
let activeOrderNumber = "";
let currentUser = null;
let authMode = "login";
let adminProducts = [];
let editingProductId = "";

const bestGrid = document.getElementById("best-product-grid");
const recommendedGrid = document.getElementById("recommended-product-grid");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartSummary = document.getElementById("cart-summary");
const toast = document.getElementById("toast");
const imageFallback = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#f1edf7"/><path d="M250 205h140l10 120H240l10-120Z" fill="none" stroke="#b9aacd" stroke-width="8"/><path d="M280 205v-35a40 40 0 0 1 80 0v35" fill="none" stroke="#b9aacd" stroke-width="8" stroke-linecap="round"/><text x="320" y="380" text-anchor="middle" fill="#8e7aa8" font-family="Arial,sans-serif" font-size="26">NovaShop</text></svg>')}`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

async function readJsonResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

document.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.src !== imageFallback) {
    event.target.src = imageFallback;
  }
}, true);

function saveCart() {
  cartDirty = true;
  const items = Object.fromEntries(cart);
  localStorage.setItem("novashop-cart", JSON.stringify(items));
  if (localDemo) return Promise.resolve();
  cartSaveQueue = cartSaveQueue.then(async () => {
    const response = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `Cart save failed (${response.status}).`);
    }
  }).catch((error) => {
    console.error("Unable to sync cart with the server.", error);
    showToast("Your bag changed on this device, but couldn't sync with the server.");
  });
  return cartSaveQueue;
}

async function initializeApp() {
  try {
    const response = await fetch("/api/products");
    localDemo = response.headers.get("X-NovaShop-Mode") === "local-demo";
    document.getElementById("demo-mode-notice").hidden = !localDemo;
    products = await readJsonResponse(response);
    if (!Array.isArray(products)) throw new Error("The product catalog response is invalid.");
    if (products.length === 0) {
      catalogState = "empty";
      bestGrid.innerHTML = '<div class="empty-results">Your MongoDB catalog is empty. Import the catalog with <code>npm run import:products</code>, then refresh.</div>';
      recommendedGrid.innerHTML = "";
      document.getElementById("results-count").textContent = "No catalog products";
      return;
    }
    catalogState = "ready";
  } catch (error) {
    catalogState = "unavailable";
    console.error("Unable to load the product catalog.", error);
    bestGrid.innerHTML = `<div class="empty-results" role="alert">The product catalog could not be loaded. ${escapeHtml(error.message)} Refresh the page after resolving the database connection.</div>`;
    recommendedGrid.innerHTML = "";
    document.getElementById("results-count").textContent = "Catalog unavailable";
    return;
  }

  const validProductIds = new Set(products.map((product) => product.id));
  const savedFavorites = loadStoredValue("novashop-wishlist", []);
  for (const id of Array.isArray(savedFavorites) ? savedFavorites : []) {
    if (validProductIds.has(id)) favorites.add(id);
  }

  const savedCart = loadStoredValue("novashop-cart", {});
  for (const [id, quantity] of Object.entries(savedCart && typeof savedCart === "object" ? savedCart : {})) {
    if (validProductIds.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) cart.set(id, quantity);
  }
  renderProducts();
  renderCart();
  await initializeAccount();

  if (localDemo) return;

  try {
    const response = await fetch("/api/cart");
    if (!response.ok) throw new Error(`Cart request failed (${response.status}).`);
    const { items } = await response.json();
    if (cartDirty) {
      void saveCart();
    } else {
      cart.clear();
      for (const [id, quantity] of Object.entries(items || {})) {
        if (validProductIds.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) cart.set(id, quantity);
      }
      renderCart();
    }
  } catch (error) {
    console.error("Unable to load the saved cart from MongoDB.", error);
    showToast("Couldn't load your saved cart from the server. Showing this device's saved cart.");
  }
}

function renderAccount() {
  const name = document.getElementById("account-name");
  const status = document.getElementById("account-status");
  const adminButton = document.getElementById("admin-button");
  const form = document.getElementById("auth-form");
  const modeToggle = document.getElementById("account-mode-toggle");
  const logout = document.getElementById("account-logout");
  const message = document.getElementById("account-message");
  const title = document.getElementById("account-title");
  if (currentUser) {
    name.textContent = currentUser.name;
    status.textContent = currentUser.role === "admin" ? "Administrator" : "Personal account";
    adminButton.hidden = currentUser.role !== "admin";
    form.hidden = true;
    modeToggle.hidden = true;
    logout.hidden = false;
    title.textContent = "Your account";
    message.textContent = `Signed in as ${currentUser.email}. Your orders are linked to this account.`;
  } else {
    name.textContent = "Your account";
    status.textContent = "Sign in or register";
    adminButton.hidden = true;
    form.hidden = false;
    modeToggle.hidden = false;
    logout.hidden = true;
    title.textContent = authMode === "login" ? "Sign in" : "Create account";
    message.textContent = authMode === "login"
      ? "Sign in to keep your order history with your account."
      : "Create a secure account to keep your order history in one place.";
    document.getElementById("auth-name-field").hidden = authMode !== "register";
    document.querySelector('#auth-form [name="name"]').required = authMode === "register";
    document.querySelector('#auth-form [name="password"]').autocomplete = authMode === "login" ? "current-password" : "new-password";
    document.getElementById("auth-submit").innerHTML = `${authMode === "login" ? "Sign in" : "Create account"} <span aria-hidden="true">→</span>`;
    modeToggle.textContent = authMode === "login" ? "Create a new account" : "Already have an account? Sign in";
  }
}

async function initializeAccount() {
  try {
    const result = await readJsonResponse(await fetch("/api/auth/session"));
    currentUser = result.user;
    renderAccount();
  } catch (error) {
    console.error("Unable to load the account session.", error);
    document.getElementById("account-status").textContent = "Account unavailable";
  }
}

function adminProductRow(product) {
  return `<article class="admin-row">
    <div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.id)} · ${currency(product.price)} · ${product.stock} in stock · ${product.active === false ? "Archived" : "Active"}</span></div>
    <div class="admin-row-actions">
      <button type="button" data-edit-product="${escapeHtml(product.id)}">Edit</button>
      <button type="button" data-toggle-product="${escapeHtml(product.id)}" data-active="${product.active === false ? "false" : "true"}">${product.active === false ? "Restore" : "Archive"}</button>
    </div>
  </article>`;
}

function adminOrderRow(order) {
  const customer = order.customer?.fullName || "Guest checkout";
  return `<article class="admin-row admin-order-row">
    <div><strong>${escapeHtml(order.orderNumber)}</strong><span>${escapeHtml(customer)} · ${currency(order.total)} · Payment ${escapeHtml(order.paymentStatus || "not_started")}</span></div>
    <label>Status<select data-order-status="${escapeHtml(order.orderNumber)}">
      ${["placed", "processing", "shipped", "delivered", "cancelled"].map((status) => `<option value="${status}"${order.status === status ? " selected" : ""}>${status}</option>`).join("")}
    </select></label>
  </article>`;
}

async function loadAdminDashboard() {
  const message = document.getElementById("admin-message");
  message.textContent = "Loading store data…";
  document.getElementById("admin-stats").replaceChildren();
  document.getElementById("admin-products").replaceChildren();
  document.getElementById("admin-orders").replaceChildren();
  if (!document.getElementById("admin-dialog").open) document.getElementById("admin-dialog").showModal();
  try {
    const [overview, productResult, orderResult] = await Promise.all([
      readJsonResponse(await fetch("/api/admin/overview")),
      readJsonResponse(await fetch("/api/admin/products")),
      readJsonResponse(await fetch("/api/admin/orders"))
    ]);
    adminProducts = productResult.products;
    document.getElementById("admin-stats").innerHTML = [
      ["Active products", overview.productCount],
      ["Orders", overview.orderCount],
      ["Recorded sales", currency(overview.revenue)]
    ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
    document.getElementById("admin-products").innerHTML = adminProducts.length
      ? adminProducts.map(adminProductRow).join("")
      : '<p class="admin-empty">No products in the catalog yet.</p>';
    document.getElementById("admin-orders").innerHTML = orderResult.orders.length
      ? orderResult.orders.map(adminOrderRow).join("")
      : '<p class="admin-empty">No orders have been placed yet.</p>';
    message.textContent = "Manage catalog items and update order status. Product deletion archives the item to preserve order history.";
  } catch (error) {
    message.textContent = `Admin dashboard could not load. ${error.message}`;
  }
}

function openProductEditor(product) {
  const form = document.getElementById("admin-product-form");
  form.reset();
  document.getElementById("admin-form-error").hidden = true;
  editingProductId = product?.id || "";
  document.getElementById("admin-product-form-title").textContent = product ? "Edit product" : "Add product";
  if (product) {
    for (const field of ["id", "name", "brand", "category", "price", "oldPrice", "stock", "rating", "reviews", "image", "badge", "description"]) {
      form.elements[field].value = product[field] ?? "";
    }
    form.elements.colors.value = (product.colors || []).join(", ");
    form.elements.id.disabled = true;
  } else {
    form.elements.id.disabled = false;
  }
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function productCard(product) {
  const favorite = favorites.has(product.id);
  const colorDots = (Array.isArray(product.colors) ? product.colors : []).filter((color) => /^#[\da-f]{3,8}$/i.test(color)).map((color) => `<span class="color-dot" style="background:${color}" aria-hidden="true"></span>`).join("");
  const soldOut = !Number.isInteger(product.stock) || product.stock < 1;
  return `<article class="product-card">
    <div class="product-image-wrap">
      <img class="product-image" src="${imageUrl(escapeHtml(product.image))}" alt="${escapeHtml(product.name)}" loading="lazy" />
      <span class="sale-badge">${escapeHtml(product.badge)}</span>
      <button class="quick-view-trigger" data-quick-view="${escapeHtml(product.id)}" type="button">Quick view</button>
      <button class="favorite-button${favorite ? " is-favorite" : ""}" data-favorite="${escapeHtml(product.id)}" aria-label="${favorite ? "Remove from" : "Add to"} wishlist" aria-pressed="${favorite}">
        <span class="icon" data-icon="heart"><svg viewBox="0 0 24 24" aria-hidden="true">${icons.heart}</svg></span>
      </button>
    </div>
    <div class="product-info">
      <span class="product-brand">${escapeHtml(product.brand)}</span>
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <span class="stock-status ${soldOut ? "out-of-stock" : product.stock < 6 ? "low-stock" : ""}">${soldOut ? "Out of stock" : product.stock < 6 ? `Only ${product.stock} left` : "In stock"}</span>
      <div class="product-price-line"><span class="product-price">${currency(product.price)}</span><span class="product-old-price">${currency(product.oldPrice)}</span></div>
      <div class="product-rating"><span class="rating-star">★</span><strong>${escapeHtml(product.rating)}</strong><span>(${escapeHtml(product.reviews)} reviews)</span></div>
      <div class="product-card-footer"><span class="color-dots">${colorDots}</span><button class="add-to-cart" data-add="${escapeHtml(product.id)}" aria-label="Add ${escapeHtml(product.name)} to bag" ${soldOut ? "disabled" : ""}><span class="icon" data-icon="plus"><svg viewBox="0 0 24 24" aria-hidden="true">${icons.plus}</svg></span></button></div>
    </div>
  </article>`;
}

function renderProducts() {
  if (catalogState !== "ready") return;
  const matching = products.filter((product) => {
    const categoryMatches = activeCategory === "All" || product.category === activeCategory;
    const searchable = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
    return categoryMatches && searchable.includes(searchTerm) && (product.price <= maxPrice || maxPrice === Infinity) && (!wishlistOnly || favorites.has(product.id));
  });
  if (sortOrder === "price-low") matching.sort((a, b) => a.price - b.price);
  if (sortOrder === "price-high") matching.sort((a, b) => b.price - a.price);
  if (sortOrder === "rating") matching.sort((a, b) => Number(b.rating) - Number(a.rating));
  const firstSet = matching.slice(0, 4);
  const secondSet = matching.slice(4);
  bestGrid.innerHTML = firstSet.length ? firstSet.map(productCard).join("") : '<div class="empty-results">No products match that search. Try another name or category.</div>';
  recommendedGrid.innerHTML = secondSet.map(productCard).join("");
  document.getElementById("new-arrivals").hidden = secondSet.length === 0;
  document.getElementById("wishlist-count").textContent = favorites.size;
  document.getElementById("results-count").textContent = `${matching.length} ${matching.length === 1 ? "find" : "finds"}${activeCategory !== "All" ? ` in ${activeCategory}` : ""}${wishlistOnly ? " in your wishlist" : ""}`;
}

function renderCart() {
  const entries = [...cart.entries()].filter(([, quantity]) => quantity > 0);
  const itemCount = entries.reduce((total, [, quantity]) => total + quantity, 0);
  const subtotal = entries.reduce((total, [id, quantity]) => total + (products.find((product) => product.id === id)?.price || 0) * quantity, 0);
  const discount = promoApplied ? subtotal * .1 : 0;
  const shippingFee = subtotal === 0 || subtotal >= 999 ? 0 : 99;
  localStorage.setItem("novashop-cart", JSON.stringify(Object.fromEntries(entries)));

  document.getElementById("cart-count").textContent = `(${itemCount})`;
  document.getElementById("cart-empty").classList.toggle("visible", itemCount === 0);
  document.getElementById("cart-summary").style.display = itemCount ? "" : "none";
  document.getElementById("clear-cart").style.visibility = itemCount ? "visible" : "hidden";
  cartItems.innerHTML = entries.map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return `<article class="cart-item">
      <img class="cart-item-image" src="${imageUrl(escapeHtml(product?.image), 180)}" alt="${escapeHtml(product?.name || id)}" />
      <div class="cart-item-details">
        <div class="cart-item-top"><div><h3 class="cart-item-name">${escapeHtml(product?.name || id)}</h3><span class="cart-item-variant">${escapeHtml(product?.brand || "")}</span></div><button class="remove-item" data-remove="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(product?.name || id)}"><span class="icon" data-icon="trash"><svg viewBox="0 0 24 24" aria-hidden="true">${icons.trash}</svg></span></button></div>
        <div class="cart-item-price">${currency(product.price)}</div>
        <div class="quantity-control"><button data-quantity="${escapeHtml(id)}" data-change="-1" aria-label="Decrease quantity">−</button><span>${quantity}</span><button data-quantity="${escapeHtml(id)}" data-change="1" aria-label="Increase quantity">+</button></div>
      </div>
    </article>`;
  }).join("");
  document.getElementById("subtotal").textContent = currency(subtotal);
  document.getElementById("discount").textContent = `−${currency(discount)}`;
  document.getElementById("shipping").textContent = shippingFee ? currency(shippingFee) : "Free";
  document.getElementById("shipping-progress").textContent = subtotal === 0
    ? ""
    : subtotal >= 999
      ? "Free delivery unlocked"
      : `Add ${currency(999 - subtotal)} for free delivery`;
  document.getElementById("shipping-progress").hidden = subtotal === 0;
  document.getElementById("total").textContent = currency(subtotal - discount + shippingFee);
  document.getElementById("checkout-total").textContent = currency(subtotal - discount + shippingFee);
  document.getElementById("discount-line").classList.toggle("visible", promoApplied && subtotal > 0);
  document.getElementById("checkout-button").disabled = itemCount === 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

let activeQuickProductId = "";

async function showQuickView(productId) {
  activeQuickProductId = productId;
  const dialog = document.getElementById("quick-view-dialog");
  const content = document.getElementById("quick-view-content");
  content.innerHTML = '<p class="quick-view-loading" role="status">Loading product details…</p>';
  if (!dialog.open) dialog.showModal();
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
    const product = await readJsonResponse(response);
    if (activeQuickProductId !== productId) return;
    const colors = (Array.isArray(product.colors) ? product.colors : [])
      .filter((color) => /^#[\da-f]{3,8}$/i.test(color))
      .map((color) => `<span class="color-dot" style="background:${color}" aria-hidden="true"></span>`).join("");
    const inStock = Number.isInteger(product.stock) && product.stock > 0;
    content.innerHTML = `<img class="quick-view-image" src="${imageUrl(escapeHtml(product.image), 720)}" alt="${escapeHtml(product.name)}" /><div class="quick-view-details"><span class="product-brand">${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</span><h2 id="quick-view-name">${escapeHtml(product.name)}</h2><div class="quick-view-rating"><span class="rating-star">★</span> ${escapeHtml(product.rating)} <span>(${escapeHtml(product.reviews)} reviews)</span></div><div class="stock-status ${inStock ? "" : "out-of-stock"}">${inStock ? `${product.stock} in stock` : "Currently unavailable"}</div><div class="product-price-line"><span class="product-price">${currency(product.price)}</span><span class="product-old-price">${currency(product.oldPrice)}</span><span class="sale-badge">${escapeHtml(product.badge)} OFF</span></div><p>${escapeHtml(product.description || `${product.name} by ${product.brand}, selected for everyday quality and comfort.`)}</p><div class="quick-view-colors"><strong>Available colors</strong><span class="color-dots">${colors || "—"}</span></div><button class="checkout-button" data-add="${escapeHtml(product.id)}" ${inStock ? "" : "disabled"}>${inStock ? `Add to bag · ${currency(product.price)}` : "Out of stock"} <span>→</span></button></div>`;
  } catch (error) {
    if (activeQuickProductId === productId) content.innerHTML = `<p class="empty-results" role="alert">Product details are unavailable. ${escapeHtml(error.message)}</p>`;
  }
}

document.getElementById("search-input").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
});

document.getElementById("sort-select").addEventListener("change", (event) => {
  sortOrder = event.target.value;
  renderProducts();
});

document.getElementById("price-filter").addEventListener("change", (event) => {
  maxPrice = event.target.value === "all" ? Infinity : Number(event.target.value);
  renderProducts();
});

document.getElementById("clear-filters").addEventListener("click", () => {
  activeCategory = "All";
  searchTerm = "";
  wishlistOnly = false;
  sortOrder = "featured";
  maxPrice = Infinity;
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = sortOrder;
  document.getElementById("price-filter").value = "all";
  document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
  renderProducts();
});

document.querySelectorAll(".category-item").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    wishlistOnly = false;
    document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item === button));
    renderProducts();
  });
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const id = addButton.dataset.add;
    const product = products.find((item) => item.id === id);
    if (!product) return;
    if (!Number.isInteger(product.stock) || product.stock < 1) {
      showToast("This item is currently out of stock.");
      return;
    }
    if ((cart.get(id) || 0) >= Math.min(99, product.stock)) {
      showToast(product.stock < 99 ? `Only ${product.stock} are currently available.` : "You can add up to 99 of one item.");
      return;
    }
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    void saveCart();
    document.getElementById("quick-view-dialog").close();
    showToast(`${product.name} added to your bag`);
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    localStorage.setItem("novashop-wishlist", JSON.stringify([...favorites]));
    renderProducts();
    showToast(favorites.has(id) ? "Added to your wishlist" : "Removed from your wishlist");
    return;
  }

  const quickViewButton = event.target.closest("[data-quick-view]");
  if (quickViewButton) {
    void showQuickView(quickViewButton.dataset.quickView);
    return;
  }

  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    const nextQuantity = (cart.get(id) || 0) + Number(quantityButton.dataset.change);
    if (nextQuantity <= 0) cart.delete(id);
    else if (nextQuantity <= 99 && nextQuantity <= (products.find((product) => product.id === id)?.stock || 0)) cart.set(id, nextQuantity);
    else {
      showToast("The requested quantity is not currently in stock.");
      return;
    }
    renderCart();
    void saveCart();
    return;
  }

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
    void saveCart();
    showToast("Item removed from your bag");
  }
});

document.getElementById("clear-cart").addEventListener("click", () => {
  cart.clear();
  promoApplied = false;
  document.getElementById("promo-message").textContent = "";
  renderCart();
  void saveCart();
  showToast("Your bag is all cleared out");
});

document.getElementById("promo-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("promo-code");
  const message = document.getElementById("promo-message");
  if (input.value.trim().toUpperCase() === "NOVA10") {
    promoApplied = true;
    message.textContent = "Lovely! 10% off has been applied.";
    message.style.color = "var(--green)";
    renderCart();
  } else {
    promoApplied = false;
    message.textContent = "That code didn't work. Try NOVA10.";
    message.style.color = "#df7275";
    renderCart();
  }
});

document.getElementById("checkout-button").addEventListener("click", () => {
  if (!cart.size) return;
  document.getElementById("checkout-error").hidden = true;
  if (currentUser) {
    const form = document.getElementById("checkout-form");
    form.elements.fullName.value = currentUser.name;
    form.elements.email.value = currentUser.email;
  }
  document.getElementById("checkout-form").hidden = false;
  document.getElementById("order-confirmation").hidden = true;
  document.getElementById("checkout-dialog").showModal();
});

document.getElementById("checkout-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const errorMessage = document.getElementById("checkout-error");
  errorMessage.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Placing your order…";
  const customer = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        items: [...cart].map(([productId, quantity]) => ({ productId, quantity })),
        coupon: promoApplied ? "NOVA10" : ""
      })
    });
    const order = await readJsonResponse(response);
    activeOrderNumber = order.orderNumber;
    document.getElementById("confirmation-number").textContent = order.orderNumber;
    document.getElementById("confirmation-tracking").textContent = `Order total: ${currency(order.totals.total)}. Payment status: ${order.paymentStatus.replaceAll("_", " ")}.`;
    form.hidden = true;
    document.getElementById("order-confirmation").hidden = false;
    cart.clear();
    promoApplied = false;
    renderCart();
    void saveCart();
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `Place order · <span id="checkout-total">${escapeHtml(document.getElementById("total").textContent)}</span> <span aria-hidden="true">→</span>`;
  }
});

document.getElementById("track-order").addEventListener("click", async () => {
  const status = document.getElementById("confirmation-tracking");
  status.textContent = "Checking order status…";
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(activeOrderNumber)}`);
    const order = await readJsonResponse(response);
    status.textContent = `Order ${order.status.replaceAll("_", " ")} · Payment ${order.paymentStatus.replaceAll("_", " ")}.`;
  } catch (error) {
    status.textContent = `Could not retrieve this order status. ${error.message}`;
  }
});

document.getElementById("newsletter-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("newsletter-message");
  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  message.textContent = "Subscribing…";
  try {
    await readJsonResponse(await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: new FormData(form).get("email") })
    }));
    message.textContent = "You're on the list. Thanks for joining us!";
    form.reset();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById("checkout-close").addEventListener("click", () => document.getElementById("checkout-dialog").close());
document.getElementById("checkout-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  document.querySelector("#theme-toggle > span:nth-child(2)").textContent = isDark ? "Dark mode" : "Light mode";
  localStorage.setItem("novashop-theme", JSON.stringify(isDark ? "dark" : "light"));
});

document.getElementById("quick-view-close").addEventListener("click", () => document.getElementById("quick-view-dialog").close());
document.getElementById("quick-view-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.getElementById("copyright-year").textContent = new Date().getFullYear();

document.querySelectorAll("[data-footer-category]").forEach((link) => {
  link.addEventListener("click", () => {
    const category = link.dataset.footerCategory;
    activeCategory = category;
    wishlistOnly = false;
    document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === category));
    renderProducts();
  });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("search-input").focus();
  }
});

document.getElementById("wishlist-button").addEventListener("click", () => {
  if (!wishlistOnly && !favorites.size) {
    showToast("Tap a heart on anything you love to save it here");
    return;
  }
  wishlistOnly = !wishlistOnly;
  activeCategory = "All";
  searchTerm = "";
  sortOrder = "featured";
  maxPrice = Infinity;
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = sortOrder;
  document.getElementById("price-filter").value = "all";
  document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
  renderProducts();
  showToast(wishlistOnly ? `Showing ${favorites.size} saved ${favorites.size === 1 ? "item" : "items"}` : "Showing all products");
  document.getElementById("best-sellers").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("view-all-deals").addEventListener("click", () => {
  activeCategory = "All";
  searchTerm = "";
  wishlistOnly = false;
  sortOrder = "featured";
  maxPrice = Infinity;
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = sortOrder;
  document.getElementById("price-filter").value = "all";
  document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
  renderProducts();
  document.getElementById("best-sellers").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("view-all-recommended").addEventListener("click", () => {
  activeCategory = "All";
  searchTerm = "";
  wishlistOnly = false;
  sortOrder = "featured";
  maxPrice = Infinity;
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = sortOrder;
  document.getElementById("price-filter").value = "all";
  document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
  renderProducts();
  document.getElementById("new-arrivals").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("mobile-menu").addEventListener("click", () => document.body.classList.toggle("menu-open"));

document.getElementById("account-button").addEventListener("click", () => {
  document.getElementById("auth-error").hidden = true;
  renderAccount();
  document.getElementById("account-dialog").showModal();
});

document.getElementById("account-mode-toggle").addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  document.getElementById("auth-form").reset();
  document.getElementById("auth-error").hidden = true;
  renderAccount();
});

document.getElementById("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = document.getElementById("auth-submit");
  const error = document.getElementById("auth-error");
  const body = Object.fromEntries(new FormData(form).entries());
  submit.disabled = true;
  error.hidden = true;
  try {
    const result = await readJsonResponse(await fetch(`/api/auth/${authMode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }));
    currentUser = result.user;
    renderAccount();
    document.getElementById("account-dialog").close();
    showToast(`Welcome${currentUser.name ? `, ${currentUser.name}` : ""}!`);
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

document.getElementById("account-logout").addEventListener("click", async () => {
  try {
    await readJsonResponse(await fetch("/api/auth/logout", { method: "POST" }));
    currentUser = null;
    renderAccount();
    document.getElementById("account-dialog").close();
    showToast("You have been signed out.");
  } catch (error) {
    document.getElementById("account-message").textContent = `Unable to sign out. ${error.message}`;
  }
});

document.getElementById("account-close").addEventListener("click", () => document.getElementById("account-dialog").close());
document.getElementById("account-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.getElementById("admin-button").addEventListener("click", () => void loadAdminDashboard());
document.getElementById("admin-close").addEventListener("click", () => document.getElementById("admin-dialog").close());
document.getElementById("admin-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.getElementById("admin-add-product").addEventListener("click", () => openProductEditor());
document.getElementById("admin-cancel-product").addEventListener("click", () => {
  document.getElementById("admin-product-form").hidden = true;
});

document.getElementById("admin-products").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    openProductEditor(adminProducts.find((product) => product.id === editButton.dataset.editProduct));
    return;
  }
  const toggleButton = event.target.closest("[data-toggle-product]");
  if (!toggleButton) return;
  const product = adminProducts.find((item) => item.id === toggleButton.dataset.toggleProduct);
  if (!product) return;
  try {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, active: product.active === false })
    });
    await readJsonResponse(response);
    products = await readJsonResponse(await fetch("/api/products"));
    renderProducts();
    await loadAdminDashboard();
  } catch (error) {
    document.getElementById("admin-message").textContent = `Product could not be updated. ${error.message}`;
  }
});

document.getElementById("admin-orders").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;
  try {
    await readJsonResponse(await fetch(`/api/admin/orders/${encodeURIComponent(select.dataset.orderStatus)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: select.value })
    }));
    document.getElementById("admin-message").textContent = "Order status updated.";
  } catch (error) {
    document.getElementById("admin-message").textContent = `Order status could not be updated. ${error.message}`;
  }
});

document.getElementById("admin-product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formError = document.getElementById("admin-form-error");
  const values = Object.fromEntries(new FormData(form).entries());
  const product = {
    ...values,
    price: Number(values.price),
    oldPrice: Number(values.oldPrice),
    stock: Number(values.stock),
    rating: Number(values.rating),
    reviews: Number(values.reviews),
    colors: values.colors ? values.colors.split(",").map((color) => color.trim()).filter(Boolean) : [],
    ...(editingProductId ? { active: adminProducts.find((item) => item.id === editingProductId)?.active !== false } : {})
  };
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  formError.hidden = true;
  try {
    const path = editingProductId
      ? `/api/admin/products/${encodeURIComponent(editingProductId)}`
      : "/api/admin/products";
    const result = await readJsonResponse(await fetch(path, {
      method: editingProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    }));
    if (result.product) {
      const position = products.findIndex((item) => item.id === result.product.id);
      if (position === -1) products.push(result.product);
      else products[position] = result.product;
    } else {
      const refreshed = await readJsonResponse(await fetch("/api/products"));
      products = refreshed;
    }
    renderProducts();
    form.hidden = true;
    await loadAdminDashboard();
    showToast(editingProductId ? "Product updated." : "Product added.");
  } catch (error) {
    formError.textContent = error.message;
    formError.hidden = false;
  } finally {
    button.disabled = false;
  }
});

async function showOrderHistory() {
  const dialog = document.getElementById("orders");
  const message = document.getElementById("orders-message");
  const list = document.getElementById("orders-list");
  message.textContent = "Loading your orders…";
  list.replaceChildren();
  if (!dialog.open) dialog.showModal();
  try {
    const { orders } = await readJsonResponse(await fetch("/api/orders"));
    if (!Array.isArray(orders)) throw new Error("The order history response is invalid.");
    if (orders.length === 0) {
      message.textContent = "No orders have been placed from this browser yet.";
      return;
    }
    message.textContent = `${orders.length} recent ${orders.length === 1 ? "order" : "orders"}`;
    list.innerHTML = orders.map((order) => {
      const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
      const created = new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" });
      return `<article class="order-history-item">
        <div><strong>${escapeHtml(order.orderNumber)}</strong><span>${escapeHtml(created)} · ${itemCount} ${itemCount === 1 ? "item" : "items"}</span></div>
        <div><strong>${currency(order.total)}</strong><span>${escapeHtml(order.status.replaceAll("_", " "))} · Payment ${escapeHtml(order.paymentStatus.replaceAll("_", " "))}</span></div>
      </article>`;
    }).join("");
  } catch (error) {
    message.textContent = `Order history is unavailable. ${error.message}`;
  }
}

document.getElementById("orders-close").addEventListener("click", () => document.getElementById("orders").close());
document.getElementById("orders").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    document.body.classList.remove("menu-open");
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item === link));
    if (link.dataset.nav === "My orders") {
      event.preventDefault();
      void showOrderHistory();
    } else if (link.dataset.nav === "Account settings") {
      event.preventDefault();
      showToast("Guest checkout is available. Customer accounts are not enabled yet.");
    } else if (link.dataset.nav === "Coupons") {
      document.getElementById("promo-code").focus();
    } else if (link.dataset.nav === "Wishlist") {
      wishlistOnly = true;
      activeCategory = "All";
      searchTerm = "";
      sortOrder = "featured";
      maxPrice = Infinity;
      document.getElementById("search-input").value = "";
      document.getElementById("sort-select").value = sortOrder;
      document.getElementById("price-filter").value = "all";
      document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
      renderProducts();
    } else if (wishlistOnly) {
      wishlistOnly = false;
      renderProducts();
    }
  });
});

if (loadStoredValue("novashop-theme", "light") === "dark") {
  document.body.classList.add("dark");
  document.querySelector("#theme-toggle > span:nth-child(2)").textContent = "Dark mode";
}
void initializeApp();
