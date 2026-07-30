const Menu = require('../models/Menu');
const storageService = require('../services/storageService');
const { parseJsonField } = require('../utils/helpers');

const populateMenu = (query) =>
  query
    .populate('category', 'name slug')
    .populate('comboItems.item', 'name price image hasVariants variants');

exports.getMenuItems = async (req, res) => {
  try {
    const { type, category, active } = req.query;
    const filter = {};

    if (type === 'normal' || type === 'combo') {
      filter.productType = type;
    }
    if (category) {
      const Category = require('../models/Category');
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category) && String(category).length === 24) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
        else filter.category = null; // force empty if unknown slug
      }
    }
    if (active !== 'false') {
      filter.isActive = { $ne: false };
    }
    // Unavailable items stay visible (faded / out-of-stock on frontend).
    // includeUnavailable is kept for admin parity but no longer filters public list.

    const items = await populateMenu(
      Menu.find(filter).sort({ createdAt: -1 })
    );

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const item = await populateMenu(Menu.findById(req.params.id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: item });
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

    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const uploaded = await storageService.uploadImage(req.files.image);
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
      image: uploaded.url,
      category: categoryId || null,
      productType: 'normal',
      hasVariants: enableVariants,
      variants: parsedVariants,
      isAvailable: available,
    });

    const populated = await populateMenu(Menu.findById(item._id));
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    if (req.files && req.files.image) {
      const uploaded = await storageService.uploadImage(req.files.image);
      updateData.image = uploaded.url;
    }

    const item = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const populated = await populateMenu(Menu.findById(item._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const ids = itemsPayload.map((i) => i.id || i.item);
    const products = await Menu.find({
      _id: { $in: ids },
      productType: 'normal',
    });

    if (products.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more combo items are invalid',
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

    const uploaded = await storageService.uploadImage(req.files.image);

    const combo = await Menu.create({
      name,
      description,
      price: Number(comboPrice),
      originalPrice,
      image: uploaded.url,
      category: categoryId || null,
      productType: 'combo',
      comboItems: mapped,
      hasVariants: false,
      variants: [],
    });

    const populated = await populateMenu(Menu.findById(combo._id));
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      const ids = itemsPayload.map((i) => i.id || i.item);
      const products = await Menu.find({
        _id: { $in: ids },
        productType: 'normal',
      });

      let originalPrice = 0;
      combo.comboItems = itemsPayload.map((entry) => {
        const id = (entry.id || entry.item).toString();
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

    if (req.files && req.files.image) {
      const uploaded = await storageService.uploadImage(req.files.image);
      combo.image = uploaded.url;
    }

    await combo.save();
    const populated = await populateMenu(Menu.findById(combo._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
