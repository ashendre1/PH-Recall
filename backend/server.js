// ── Recall Backend Server ─────────────────────────────
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, getDB, closeDB } = require("./services/mongo");
const { getEmbedding } = require("./services/embedding");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health check ─────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── POST /api/scrape ─────────────────────────────────
// Splits page into paragraphs, generates an embedding for each,
// and stores them as individual documents in MongoDB Atlas.
app.post("/api/scrape", async (req, res) => {
  try {
    const { url, title, headings, paragraphs } = req.body;

    if (!paragraphs || paragraphs.length === 0) {
      return res.status(400).json({ error: "No paragraphs to store." });
    }

    console.log(`[scrape] Received ${paragraphs.length} paragraphs from ${url}`);

    const db = getDB();
    const collection = db.collection(process.env.MONGO_COLLECTION || "test_para");
    const documents = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i].trim();
      if (text.length < 20) continue;

      console.log(`[scrape] Embedding paragraph ${i + 1}/${paragraphs.length} (${text.length} chars)`);
      const embedding = await getEmbedding(text);

      documents.push({
        url,
        title,
        paragraph: text,
        paragraphIndex: i,
        embedding,
        scrapedAt: new Date(),
      });
    }

    if (documents.length === 0) {
      return res.status(400).json({ error: "No paragraphs long enough to store." });
    }

    const result = await collection.insertMany(documents);
    console.log(`[scrape] Stored ${result.insertedCount} paragraph vectors`);

    res.json({
      success: true,
      message: `Stored ${result.insertedCount} paragraphs with embeddings.`,
      count: result.insertedCount,
    });
  } catch (err) {
    console.error("[scrape] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ─────────────────────────────────────
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] Recall backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down…");
  await closeDB();
  process.exit(0);
});

start();
