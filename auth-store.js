const { createHash, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 14 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = await scrypt(password, salt, 64);
  return { salt, hash: derivedKey.toString("hex") };
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function createAuthStore({ demoMode, adminEmail, adminPassword }) {
  const demoUsers = new Map();
  const demoSessions = new Map();

  async function initialize(database) {
    if (!adminEmail && !adminPassword) return;
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      throw new Error("Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters to configure the admin account.");
    }
    const email = adminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL must be a valid email address.");
    const passwordData = await hashPassword(adminPassword);
    const user = {
      _id: "admin",
      name: "NovaShop Admin",
      email,
      role: "admin",
      salt: passwordData.salt,
      passwordHash: passwordData.hash,
      createdAt: new Date()
    };
    if (demoMode) {
      demoUsers.set(email, user);
      return;
    }
    await database.collection("users").updateOne(
      { email },
      { $set: { role: "admin", name: user.name, salt: user.salt, passwordHash: user.hash, updatedAt: new Date() }, $setOnInsert: { _id: user._id, email, createdAt: user.createdAt } },
      { upsert: true }
    );
  }

  async function register(database, { name, email, password }) {
    const passwordData = await hashPassword(password);
    const user = {
      _id: randomBytes(16).toString("hex"),
      name,
      email,
      role: "customer",
      salt: passwordData.salt,
      passwordHash: passwordData.hash,
      createdAt: new Date()
    };
    if (demoMode) {
      if (demoUsers.has(email)) return null;
      demoUsers.set(email, user);
      return publicUser(user);
    }
    try {
      await database.collection("users").insertOne(user);
    } catch (error) {
      if (error.code === 11000) return null;
      throw error;
    }
    return publicUser(user);
  }

  async function authenticate(database, email, password) {
    const user = demoMode
      ? demoUsers.get(email)
      : await database.collection("users").findOne({ email });
    if (!user) {
      await hashPassword(password, "novashop-login-timing-salt");
      return null;
    }
    const passwordData = await hashPassword(password, user.salt);
    const expectedHash = user.passwordHash;
    const actual = Buffer.from(passwordData.hash, "hex");
    const expected = Buffer.from(expectedHash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    return publicUser(user);
  }

  async function createSession(database, userId) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionLifetimeMs);
    const session = { tokenHash: hashToken(token), userId, expiresAt, createdAt: new Date() };
    if (demoMode) demoSessions.set(session.tokenHash, session);
    else await database.collection("authSessions").insertOne(session);
    return { token, expiresAt };
  }

  async function getSessionUser(database, token) {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const session = demoMode
      ? demoSessions.get(tokenHash)
      : await database.collection("authSessions").findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!session || session.expiresAt <= new Date()) return null;
    const user = demoMode
      ? [...demoUsers.values()].find((entry) => entry._id === session.userId)
      : await database.collection("users").findOne({ _id: session.userId });
    return user ? publicUser(user) : null;
  }

  async function deleteSession(database, token) {
    if (!token) return;
    const tokenHash = hashToken(token);
    if (demoMode) demoSessions.delete(tokenHash);
    else await database.collection("authSessions").deleteOne({ tokenHash });
  }

  return { authenticate, createSession, deleteSession, getSessionUser, initialize, register };
}

module.exports = { createAuthStore, sessionLifetimeMs };
