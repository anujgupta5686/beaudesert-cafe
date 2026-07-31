const Menu = require('../models/Menu');
const storageService = require('../services/storageService');
const { parseJsonField } = require('../utils/helpers');
const mongoose = require('mongoose');
const { normalizeMenuMedia, normalizeMenuList } = require('../utils/mediaUrl');

const populateMenu = (query) =>
  query
    .populate('category', 'name slug')
    .populate(
      'comboItems.item',
      'name description price image images hasVariants variants isAvailable'
    );

/** Resolve combo line-item ids from payload; skip empty / invalid */
const extractComboItemIds = (itemsPayload) => {
  const ids = [];
  for (const entry of itemsPayload) {
    const raw = entry?.id ?? entry?.item;
    if (raw == null || raw === '') continue;
    const id = typeof raw === 'object' && raw._id ? String(raw._id) : String(raw);
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      ids.push(id);
    }
  }
  return ids;
};

/** Products eligible to be inside a combo (anything that is not itself a combo) */
const findComboSourceProducts = (ids) =>
  Menu.find({
    _id: { $in: ids },
    productType: { $ne: 'combo' },
  }).select('_id name price hasVariants variants');

exports.getMenuItems = async (req, res) => {
  try {
    const { type, category, active } = req.query;
    const filter = {};

    if (type === 'normal' || type === 'combo') {
      filter.productType = type;
    }
    if (category) {
      const Category = require('../models/Category');
      if (mongoose.Types.ObjectId.isValid(category) && String(category).length === 24) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category }).select('_id').lean();
        if (cat) filter.category = cat._id;
        else filter.category = null;
      }
    }
    if (active !== 'false') {
      filter.isActive = { $ne: false };
    }

    const items = await populateMenu(
      Menu.find(filter)
        .select(
          'name description price image images category productType hasVariants variants comboItems originalPrice isActive isAvailable createdAt'
        )
        .sort({ createdAt: -1 })
        .lean()
    );

    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    res.json({ success: true, data: normalizeMenuList(items) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const item = await populateMenu(Menu.findById(req.params.id).lean());
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: normalizeMenuMedia(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      hasVariants,
      variants,
      isAvailable,
    } = req.body;

    const fileBag = storageService.collectImageFiles(req.files);
    if (!fileBag.length) {
      return res
        .status(400)
        .json({ success: false, message: 'At least one image is required' });
    }
    if (fileBag.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 images allowed per product',
      });
    }

    const imageUrls = await storageService.uploadImages(fileBag);
    if (!imageUrls.length) {
      return res
        .status(400)
        .json({ success: false, message: 'Image upload failed' });
    }

    const enableVariants = hasVariants === true || hasVariants === 'true';
    const parsedVariants = enableVariants ? parseJsonField(variants, []) : [];
    const available =
      isAvailable === undefined
        ? true
        : isAvailable === true || isAvailable === 'true';

    const item = await Menu.create({
      name,
      description,
      price: Number(price),
      image: imageUrls[0],
      images: imageUrls,
      category: categoryId || null,
      productType: 'normal',
      hasVariants: enableVariants,
      variants: parsedVariants,
      isAvailable: available,
    });

    const populated = await populateMenu(Menu.findById(item._id).lean());
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: normalizeMenuMedia(populated),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      hasVariants,
      variants,
      isActive,
    } = req.body;

    const updateData = {
      name,
      description,
      price: Number(price),
    };

    if (categoryId !== undefined) {
      updateData.category = categoryId || null;
    }
    if (hasVariants !== undefined) {
      const enableVariants = hasVariants === true || hasVariants === 'true';
      updateData.hasVariants = enableVariants;
      updateData.variants = enableVariants ? parseJsonField(variants, []) : [];
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === 'true';
    }
    if (req.body.isAvailable !== undefined) {
      updateData.isAvailable =
        req.body.isAvailable === true || req.body.isAvailable === 'true';
    }

    const fileBag = storageService.collectImageFiles(req.files);
    const kept = parseJsonField(req.body.existingImages, []).slice(0, 6);

    if (fileBag.length) {
      if (kept.length + fileBag.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 6 images allowed per product',
        });
      }
      const imageUrls = await storageService.uploadImages(fileBag);
      const merged = [...kept, ...imageUrls].filter(Boolean).slice(0, 6);
      if (merged.length) {
        updateData.image = merged[0];
        updateData.images = merged;
      }
    } else if (req.body.existingImages !== undefined) {
      if (kept.length) {
        updateData.image = kept[0];
        updateData.images = kept;
      }
    }

    const item = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const populated = await populateMenu(Menu.findById(item._id).lean());
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: normalizeMenuMedia(populated),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a combo pack from existing normal products
 */
exports.createCombo = async (req, res) => {
  try {
    const { name, description, comboPrice, categoryId, comboItems } = req.body;
    const itemsPayload = parseJsonField(comboItems, []);

    if (!name || !description || comboPrice == null || !itemsPayload.length) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, comboPrice, and comboItems are required',
      });
    }

    if (!req.files) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const fileBag = storageService.collectImageFiles(req.files);
    if (!fileBag.length) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }
    if (fileBag.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 images allowed per combo',
      });
    }

    const ids = extractComboItemIds(itemsPayload);
    if (ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A combo needs at least 2 valid products',
      });
    }

    const products = await findComboSourceProducts(ids);

    if (products.length !== ids.length) {
      const found = new Set(products.map((p) => p._id.toString()));
      const missing = ids.filter((id) => !found.has(id));
      return res.status(400).json({
        success: false,
        message: 'One or more combo items are invalid',
        missingIds: missing,
      });
    }

    let originalPrice = 0;
    const mapped = itemsPayload.map((entry) => {
      const id = (entry.id || entry.item).toString();
      const product = products.find((p) => p._id.toString() === id);
      let unit = product.price;
      if (entry.variantLabel && product.hasVariants) {
        const v = product.variants.find((x) => x.label === entry.variantLabel);
        if (v) unit = v.price;
      }
      const qty = Number(entry.quantity) || 1;
      originalPrice += unit * qty;
      return {
        item: product._id,
        quantity: qty,
        variantLabel: entry.variantLabel || null,
      };
    });

    const imageUrls = await storageService.uploadImages(fileBag);
    if (!imageUrls.length) {
      return res.status(400).json({ success: false, message: 'Image upload failed' });
    }

    const combo = await Menu.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(comboPrice),
      originalPrice,
      image: imageUrls[0],
      images: imageUrls,
      category: categoryId || null,
      productType: 'combo',
      comboItems: mapped,
      hasVariants: false,
      variants: [],
      isAvailable: true,
      isActive: true,
    });

    // Fast response: return created doc; client invalidates & refetches list
    const populated = await populateMenu(Menu.findById(combo._id).lean());
    return res.status(201).json({
      success: true,
      message: 'Combo created successfully',
      data: normalizeMenuMedia(populated),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCombo = async (req, res) => {
  try {
    const combo = await Menu.findById(req.params.id);
    if (!combo || combo.productType !== 'combo') {
      return res.status(404).json({ success: false, message: 'Combo not found' });
    }

    const { name, description, comboPrice, categoryId, comboItems } = req.body;

    if (name) combo.name = name;
    if (description) combo.description = description;
    if (comboPrice != null) combo.price = Number(comboPrice);
    if (categoryId !== undefined) combo.category = categoryId || null;

    if (comboItems) {
      const itemsPayload = parseJsonField(comboItems, []);
      const ids = extractComboItemIds(itemsPayload);
      const products = await findComboSourceProducts(ids);

      if (products.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more combo items are invalid',
        });
      }

      let originalPrice = 0;
      combo.comboItems = itemsPayload.map((entry) => {
        const id = String(entry.id || entry.item);
        const product = products.find((p) => p._id.toString() === id);
        let unit = product?.price || 0;
        if (entry.variantLabel && product?.hasVariants) {
          const v = product.variants.find((x) => x.label === entry.variantLabel);
          if (v) unit = v.price;
        }
        const qty = Number(entry.quantity) || 1;
        originalPrice += unit * qty;
        return {
          item: id,
          quantity: qty,
          variantLabel: entry.variantLabel || null,
        };
      });
      combo.originalPrice = originalPrice;
    }

    const fileBag = storageService.collectImageFiles(req.files);
    const kept = parseJsonField(req.body.existingImages, []).slice(0, 6);

    if (fileBag.length) {
      if (kept.length + fileBag.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 6 images allowed per combo',
        });
      }
      const imageUrls = await storageService.uploadImages(fileBag);
      const merged = [...kept, ...imageUrls].filter(Boolean).slice(0, 6);
      if (merged.length) {
        combo.image = merged[0];
        combo.images = merged;
      }
    } else if (req.body.existingImages !== undefined) {
      if (kept.length) {
        combo.image = kept[0];
        combo.images = kept;
      }
    }

    await combo.save();
    const populated = await populateMenu(Menu.findById(combo._id).lean());
    res.json({ success: true, data: normalizeMenuMedia(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
