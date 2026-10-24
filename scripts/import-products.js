const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { closeDatabase, getDatabase } = require("../db");

function buildProductUpserts(products, now = new Date()) {
  return products.flatMap((product) => {
    const defaults = {
      stock: 20,
      description: `${product.name} by ${product.brand}, selected for everyday quality and comfort.`,
      active: true,
      createdAt: now,
      updatedAt: now
    };
    return [
      {
        updateOne: {
          filter: { id: product.id },
          update: { $setOnInsert: { ...product, ...defaults } },
          upsert: true
        }
      },
      ...Object.entries(defaults).map(([field, value]) => ({
        updateOne: {
          filter: { id: product.id, [field]: { $exists: false } },
          update: { $set: { [field]: value } },
          upsert: false
        }
      }))
    ];
  });
}

async function importProducts() {
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "products.json"), "utf8"));
  const database = await getDatabase();
  const collection = database.collection("products");

  await collection.createIndex(
    { id: 1 },
    { unique: true, partialFilterExpression: { id: { $type: "string" } } }
  );
  if (products.length) await collection.bulkWrite(buildProductUpserts(products), { ordered: true });
  console.info(`Imported ${products.length} products into MongoDB.`);
}

if (require.main === module) {
  importProducts()
    .catch((error) => {
      console.error(`Product import failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}

module.exports = { buildProductUpserts };
