// ── MongoDB Service ──────────────────────────────────
// Connects to MongoDB Atlas using the official Node.js driver.

const { MongoClient } = require("mongodb");

let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas.
 * Uses MONGO_URI from .env (a standard Atlas connection string).
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in .env — add your Atlas connection string.");
  }

  const dbName = process.env.MONGO_DB || "recall";

  console.log(`[mongo] Connecting to Atlas (database: ${dbName})…`);
  client = new MongoClient(uri);
  await client.connect();

  // Verify connection
  await client.db("admin").command({ ping: 1 });
  console.log("[mongo] Connected to MongoDB Atlas ✓");

  db = client.db(dbName);
  return db;
}

/**
 * Get the current database instance.
 * @returns {import("mongodb").Db}
 */
function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

/**
 * Close the MongoDB connection gracefully.
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log("[mongo] Connection closed.");
    client = null;
    db = null;
  }
}

module.exports = { connectDB, getDB, closeDB };
