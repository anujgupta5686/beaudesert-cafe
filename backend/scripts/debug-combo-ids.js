require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Menu = require('../src/models/Menu');
  const ids = [
    '6a6b9fd10cccd9a27a4401c8',
    '6a6779be793d6a715410168b',
    '6a6662f8952e647e67d4e15d',
  ];
  const all = await Menu.find({ _id: { $in: ids } })
    .select('name productType isActive')
    .lean();
  console.log('found', all.length, all);
  const asNormal = await Menu.find({
    _id: { $in: ids },
    productType: 'normal',
  })
    .select('_id name productType')
    .lean();
  console.log('as normal', asNormal.length, asNormal);
  const notCombo = await Menu.find({
    _id: { $in: ids },
    productType: { $ne: 'combo' },
  })
    .select('_id name productType')
    .lean();
  console.log('not combo', notCombo.length, notCombo);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
