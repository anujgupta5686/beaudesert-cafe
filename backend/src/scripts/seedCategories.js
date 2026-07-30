/**
 * Seed default categories.
 * Usage: node src/scripts/seedCategories.js
 * Requires MONGODB_URI in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const defaults = [
  { name: 'Coffee', slug: 'coffee', description: 'Hot & cold coffee', sortOrder: 1 },
  { name: 'Snacks', slug: 'snacks', description: 'Light bites', sortOrder: 2 },
  { name: 'Desserts', slug: 'desserts', description: 'Sweet treats', sortOrder: 3 },
  { name: 'Beverages', slug: 'beverages', description: 'Non-coffee drinks', sortOrder: 4 },
  { name: 'Combos', slug: 'combos', description: 'Combo packs', sortOrder: 5 },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const cat of defaults) {
    await Category.updateOne(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, isActive: true } },
      { upsert: true }
    );
  }
  console.log('✅ Categories seeded');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
