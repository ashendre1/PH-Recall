// ── Recall Backend Server ──────────────────────────
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, getDB, closeDB } = require("./services/mongo");
const { getEmbedding } = require("./services/embedding");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health check ─────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── POST /api/scrape ─────────────────────────────────
// Receives scraped page data from the Chrome extension,
// generates a vector embedding, and stores it in MongoDB Atlas.
app.post("/api/scrape", async (req, res) => {
  try {
    const { url, title, headings, paragraphs, fullText } = req.body;

    // Validate
    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ error: "No content provided (fullText is empty)." });
    }

    console.log(`[scrape] Received ${fullText.length} chars from ${url}`);

    // 1. Generate vector embedding via Hugging Face
    console.log("[scrape] Generating embedding…");
    const embedding = await getEmbedding(fullText);
    console.log(`[scrape] Embedding generated (${embedding.length} dimensions)`);

    // 2. Build the document
    const document = {
      url: url || "",
      title: title || "",
      headings: headings || [],
      paragraphs: paragraphs || [],
      fullText,
      embedding,
      scrapedAt: new Date(),
    };

    // 3. Insert into MongoDB Atlas
    console.log("[scrape] Inserting into MongoDB…");
    const db = getDB();
    const collection = db.collection(process.env.MONGO_COLLECTION || "scraped_pages");
    const result = await collection.insertOne(document);
    console.log(`[scrape] Inserted document: ${result.insertedId}`);

    res.json({
      success: true,
      insertedId: result.insertedId,
      embeddingDimensions: embedding.length,
    });
  } catch (err) {
    console.error("[scrape] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/documents ───────────────────────────────
// List recent scraped documents (without embedding to save bandwidth).
app.get("/api/documents", async (_req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.MONGO_COLLECTION || "scraped_pages");
    const docs = await collection
      .find({}, { projection: { embedding: 0 } })
      .sort({ scrapedAt: -1 })
      .limit(50)
      .toArray();

    res.json({ documents: docs, count: docs.length });
  } catch (err) {
    console.error("[documents] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/search ─────────────────────────────────
// Vector similarity search using Atlas Vector Search.
app.post("/api/search", async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query text is required." });
    }

    // Generate embedding for the search query
    const queryEmbedding = await getEmbedding(query);

    const db = getDB();
    const collection = db.collection(process.env.MONGO_COLLECTION || "scraped_pages");

    // Atlas Vector Search aggregation pipeline
    // Requires a vector search index named "vector_index" on the "embedding" field
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: limit * 10,
            limit: limit,
          },
        },
        {
          $project: {
            embedding: 0,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    res.json({ results, count: results.length });
  } catch (err) {
    console.error("[search] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ─────────────────────────────────────
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n✓ Recall backend running on http://localhost:${PORT}`);
      console.log(`  POST /api/scrape   — receive & store scraped data`);
      console.log(`  GET  /api/documents — list recent documents`);
      console.log(`  POST /api/search   — vector similarity search`);
      console.log(`  GET  /api/health   — health check\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down…");
  await closeDB();
  process.exit(0);
});

start();
