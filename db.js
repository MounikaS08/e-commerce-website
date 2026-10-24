require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });
const { MongoClient } = require("mongodb");

const databaseName = (process.env.MONGODB_DB || "novashop").trim();
const mongoUri = process.env.MONGODB_URI?.trim();
const placeholderPattern = /<|>|placeholder|your[-_ ]|example/i;
const configurationDiagnostic = "MONGODB_URI is missing or still contains a template value. Set the real Atlas connection string in the project .env file and restart the server.";
let client;
let connectedDatabase;
let connectionAttempt;
let databaseState = !mongoUri
  ? "configuration-required"
  : placeholderPattern.test(mongoUri)
    ? "configuration-required"
    : "disconnected";
let databaseDiagnostic = databaseState === "configuration-required"
  ? configurationDiagnostic
  : "MongoDB has not connected yet.";

function diagnoseMongoFailure(error) {
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  const codeName = typeof error?.codeName === "string" ? error.codeName : "";
  const code = error?.code;

  if (error?.name === "MongoParseError") {
    return "MongoDB rejected the URI format. Check the mongodb:// or mongodb+srv:// scheme, hostname, and URL-encoded username/password.";
  }
  if (code === 18 || codeName === "AuthenticationFailed" || /authentication failed|auth failed|bad auth/.test(message)) {
    return "Atlas rejected database authentication. Verify the database username/password and URL-encode special characters in the URI credentials.";
  }
  if (/querysrv|enotfound|getaddrinfo|dns/.test(message)) {
    return "MongoDB cluster hostname could not be resolved. Verify the Atlas cluster hostname and local DNS/network connectivity.";
  }
  if (/etimedout|timed out|timeout|econnrefused|enetunreach|ehostunreach|network/.test(message) ||
      error?.name === "MongoServerSelectionError" || error?.name === "MongoNetworkError") {
    return "MongoDB servers could not be reached. Verify that the Atlas cluster is running, your current IP is allowed in Atlas Network Access, and the network permits outbound MongoDB connections.";
  }
  const safeName = typeof error?.name === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name)
    ? error.name
    : "UnknownError";
  return `MongoDB connection failed (${safeName}). Check the Atlas cluster, database user, IP access list, and connection-string format.`;
}

class DatabaseUnavailableError extends Error {
  constructor(state = databaseState) {
    const message = state === "configuration-required"
      ? configurationDiagnostic
      : state === "configuration-invalid"
        ? databaseDiagnostic
        : databaseDiagnostic;
    super(message || "MongoDB is unavailable. Check the server configuration and Atlas connectivity.");
    this.name = "DatabaseUnavailableError";
    this.status = 503;
    this.state = state;
  }
}

async function connectDatabase() {
  if (connectedDatabase) return connectedDatabase;
  if (databaseState === "configuration-required") throw new DatabaseUnavailableError(databaseState);
  if (!connectionAttempt) {
    connectionAttempt = (async () => {
      try {
        if (!client) client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 4000 });
        await client.connect();
        connectedDatabase = client.db(databaseName);
        await connectedDatabase.command({ ping: 1 });
        databaseState = "connected";
        databaseDiagnostic = "";
        console.info(`Connected to MongoDB database "${databaseName}".`);
        return connectedDatabase;
      } catch (error) {
        const failedClient = client;
        client = undefined;
        databaseState = error.name === "MongoParseError" ? "configuration-invalid" : "disconnected";
        databaseDiagnostic = diagnoseMongoFailure(error);
        connectedDatabase = undefined;
        if (failedClient) {
          try {
            await failedClient.close();
          } catch (closeError) {
            console.error(`MongoDB client cleanup failed (${closeError.name}).`);
          }
        }
        console.error(`MongoDB connection failed. ${databaseDiagnostic}`);
        throw new DatabaseUnavailableError(databaseState);
      } finally {
        connectionAttempt = undefined;
      }
    })();
  }
  return connectionAttempt;
}

async function getDatabase() {
  return connectDatabase();
}

async function healthCheck() {
  if (!connectedDatabase) {
    if (databaseState === "configuration-required" || databaseState === "configuration-invalid") {
      return { connected: false, state: databaseState, diagnostic: databaseDiagnostic };
    }
    try {
      await connectDatabase();
      return { connected: true, state: databaseState };
    } catch {
      return { connected: false, state: databaseState, diagnostic: databaseDiagnostic };
    }
  }
  try {
    await connectedDatabase.command({ ping: 1 });
    databaseState = "connected";
    return { connected: true, state: databaseState };
  } catch (error) {
    databaseState = "disconnected";
    databaseDiagnostic = diagnoseMongoFailure(error);
    connectedDatabase = undefined;
    console.error(`MongoDB health check failed. ${databaseDiagnostic}`);
    return { connected: false, state: databaseState, diagnostic: databaseDiagnostic };
  }
}

async function closeDatabase() {
  if (connectionAttempt) {
    try {
      await connectionAttempt;
    } catch (error) {
      if (!(error instanceof DatabaseUnavailableError)) throw error;
    }
  }
  const activeClient = client;
  client = undefined;
  connectedDatabase = undefined;
  connectionAttempt = undefined;
  databaseState = mongoUri && !placeholderPattern.test(mongoUri) ? "disconnected" : "configuration-required";
  databaseDiagnostic = databaseState === "configuration-required"
    ? configurationDiagnostic
    : "MongoDB has not connected yet.";
  if (activeClient) await activeClient.close();
}

module.exports = { DatabaseUnavailableError, closeDatabase, connectDatabase, diagnoseMongoFailure, getDatabase, healthCheck };
