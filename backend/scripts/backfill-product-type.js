require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Menu = require('../src/models/Menu');
  const r = await Menu.updateMany(
    { $or: [{ productType: { $exists: false } }, { productType: null }] },
    { $set: { productType: 'normal' } }
  );
  console.log('backfilled productType=normal:', r.modifiedCount);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
