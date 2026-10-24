const { randomUUID } = require("node:crypto");

class DemoStoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function createDemoStore(sourceProducts, now = () => new Date()) {
  const products = sourceProducts.map((product) => ({
    ...product,
    stock: 20,
    description: `${product.name} by ${product.brand}, selected for everyday quality and comfort.`,
    active: true,
    createdAt: now(),
    updatedAt: now()
  }));
  const productById = new Map(products.map((product) => [product.id, product]));
  const carts = new Map();
  const orders = new Map();
  const newsletter = new Set();

  return {
    categories() {
      return [...new Set(products.filter((product) => product.active !== false).map((product) => product.category))];
    },

    listProducts(options, response) {
      const { filter, q, sort, sortOptions, pageNumber, pageSize } = options;
      let result = products.filter((product) => {
        if (product.active === false) return false;
        if (filter.category && product.category !== filter.category) return false;
        if (filter.price && product.price > filter.price.$lte) return false;
        return !q || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(q);
      });
      const sortField = Object.keys(sortOptions[sort] || {})[0];
      if (sortField) {
        const direction = sortOptions[sort][sortField];
        result = [...result].sort((a, b) => {
          const comparison = sortField === "rating"
            ? Number(a[sortField]) - Number(b[sortField])
            : a[sortField] - b[sortField];
          return comparison * direction;
        });
      }
      if (pageSize !== undefined) {
        response.setHeader("X-Total-Count", String(result.length));
        response.setHeader("X-Page", String(pageNumber));
        response.setHeader("X-Page-Size", String(pageSize));
        result = result.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
      }
      return result;
    },

    product(id) {
      const product = productById.get(id);
      return product?.active === false ? undefined : product;
    },

    adminProducts() {
      return [...products].map((product) => ({ ...product }));
    },

    saveProduct(product) {
      const existing = productById.get(product.id);
      if (existing) return false;
      const saved = { ...product, createdAt: now(), updatedAt: now() };
      products.push(saved);
      productById.set(saved.id, saved);
      return true;
    },

    updateProduct(id, changes) {
      const product = productById.get(id);
      if (!product) return false;
      Object.assign(product, changes, { updatedAt: now() });
      return true;
    },

    adminOrders() {
      return [...orders.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ clientId: _clientId, ...order }) => ({ ...order }));
    },

    updateOrder(orderNumber, status) {
      const order = orders.get(orderNumber);
      if (!order) return null;
      if (order.status === "cancelled" && status !== "cancelled") return false;
      if (status === "cancelled" && order.status !== "cancelled") {
        if (!["placed", "processing"].includes(order.status)) return false;
        for (const item of order.items) {
          const product = productById.get(item.productId);
          if (product) product.stock += item.quantity;
        }
      }
      order.status = status;
      order.updatedAt = now();
      return true;
    },

    cart(clientId) {
      return { ...(carts.get(clientId) || {}) };
    },

    saveCart(clientId, items) {
      const unknownProduct = Object.keys(items).find((id) => {
        const product = productById.get(id);
        return !product || product.active === false;
      });
      if (unknownProduct) throw new DemoStoreError(400, "Cart contains an unknown product.");
      const savedItems = { ...items };
      carts.set(clientId, savedItems);
      return savedItems;
    },

    placeOrder(clientId, { items, customer, coupon, userId }) {
      const orderItems = [];
      let subtotal = 0;
      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product || product.active === false) {
          throw new DemoStoreError(400, "One or more products are no longer available.");
        }
        if (!Number.isSafeInteger(product.price) || product.price < 0) {
          throw new DemoStoreError(500, "A product price is unavailable. Please try again later.");
        }
        if (!Number.isInteger(product.stock) || product.stock < item.quantity) {
          throw new DemoStoreError(409, `${product.name} does not have enough stock for that quantity.`);
        }
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

      const discount = coupon === "NOVA10" ? Math.round(subtotal * 0.1) : 0;
      const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 99;
      const totals = { subtotal, discount, shipping, total: subtotal - discount + shipping };
      const orderNumber = randomUUID();
      const createdAt = now();
      for (const item of items) {
        const product = productById.get(item.productId);
        product.stock -= item.quantity;
        product.updatedAt = createdAt;
      }
      const order = {
        orderNumber,
        clientId,
        ...(userId ? { userId } : {}),
        customer,
        items: orderItems,
        ...totals,
        status: "placed",
        paymentStatus: "not_started",
        paymentMethod: "not_selected",
        createdAt,
        updatedAt: createdAt
      };
      orders.set(orderNumber, order);
      carts.delete(clientId);
      return { orderNumber, status: order.status, paymentStatus: order.paymentStatus, totals, items: orderItems };
    },

    recentOrders(clientId, userId) {
      return [...orders.values()]
        .filter((order) => order.clientId === clientId || (userId && order.userId === userId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20)
        .map(({ orderNumber, items, subtotal, discount, shipping, total, status, paymentStatus, createdAt }) =>
          ({ orderNumber, items, subtotal, discount, shipping, total, status, paymentStatus, createdAt }));
    },

    order(clientId, orderNumber, userId) {
      const order = orders.get(orderNumber);
      if (!order || (order.clientId !== clientId && (!userId || order.userId !== userId))) return undefined;
      const { customer, clientId: _clientId, updatedAt, paymentMethod, ...publicOrder } = order;
      return publicOrder;
    },

    subscribe(email) {
      const isNew = !newsletter.has(email);
      newsletter.add(email);
      return isNew;
    }
  };
}

module.exports = { createDemoStore, DemoStoreError };
