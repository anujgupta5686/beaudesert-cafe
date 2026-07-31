const Order = require('../models/Order');
const Menu = require('../models/Menu');
const emailService = require('../services/emailService');
const feedbackService = require('../services/feedbackService');
const notificationService = require('../services/notificationService');
const { generateOrderNumber } = require('../utils/orderNumber');
const logger = require('../utils/logger');

const resolveUnitPrice = (menuItem, size) => {
  if (menuItem.productType === 'combo') return menuItem.price;
  if (size && menuItem.hasVariants && menuItem.variants?.length) {
    const variant = menuItem.variants.find((v) => v.label === size);
    if (variant) return variant.price;
  }
  return menuItem.price;
};

exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      email,
      mobile,
      address,
      specialInstructions,
      items,
    } = req.body;

    if (!customerName || !email || !mobile || !address || !items?.length) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const customerEmail = String(email).trim().toLowerCase();
    if (!customerEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required',
      });
    }

    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Item "${item.name}" not found`,
        });
      }

      if (menuItem.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: `"${menuItem.name}" is currently unavailable`,
        });
      }

      const size = item.size || null;
      if (menuItem.hasVariants && menuItem.variants?.length && !size) {
        return res.status(400).json({
          success: false,
          message: `Please select a size for "${menuItem.name}"`,
        });
      }

      const unitPrice = resolveUnitPrice(menuItem, size);
      const quantity = item.quantity || 1;
      totalAmount += unitPrice * quantity;

      const displayName =
        size && menuItem.productType !== 'combo'
          ? `${menuItem.name} (${size})`
          : menuItem.name;

      validatedItems.push({
        menuItemId: menuItem._id,
        name: displayName,
        price: unitPrice,
        quantity,
        image: menuItem.image || '',
        size,
        productType: menuItem.productType || 'normal',
      });
    }

    let order;
    let attempts = 0;
    while (attempts < 5) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          customerName,
          email: customerEmail,
          mobile,
          address,
          specialInstructions: specialInstructions || '',
          items: validatedItems,
          totalAmount,
          status: 'pending',
        });
        break;
      } catch (err) {
        if (err.code === 11000) {
          attempts += 1;
          continue;
        }
        throw err;
      }
    }

    if (!order) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate unique order ID',
      });
    }

    let userEmailSent = false;
    let adminEmailSent = false;
    let emailError = null;

    try {
      await emailService.sendOrderConfirmationToUser(order);
      userEmailSent = true;
    } catch (err) {
      emailError = err.message;
      logger.error('Order confirmation email to user failed', {
        orderId: order._id,
        email: order.email,
        error: err.message,
      });
    }

    try {
      await emailService.sendOrderNotificationToAdmin(order);
      adminEmailSent = true;
    } catch (err) {
      emailError = emailError || err.message;
      logger.error('Order notification email to admin failed', {
        orderId: order._id,
        error: err.message,
      });
    }

    notificationService.createOrderNotification(order).catch(() => {});

    res.status(201).json({
      success: true,
      userEmailSent,
      adminEmailSent,
      emailError,
      data: order,
      message: 'Order placed successfully!',
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order',
    });
  }
};

/**
 * Backend search + pagination + sorting
 * Query: ?search=&status=&page=&limit=&sortBy=&sortOrder=
 */
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = req.query.status;
    const sortBy = ['createdAt', 'totalAmount', 'customerName', 'orderNumber', 'status'].includes(
      req.query.sortBy
    )
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = {};
    if (status === 'pending' || status === 'success') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { email: regex },
        { mobile: regex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order =
      (await Order.findOne({ orderNumber: req.params.id.toUpperCase() })) ||
      (await Order.findById(req.params.id).catch(() => null));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerCount = async (req, res) => {
  try {
    const customers = await Order.aggregate([
      {
        $group: {
          _id: { customerName: '$customerName', mobile: '$mobile' },
        },
      },
      { $count: 'totalCustomers' },
    ]);

    const totalCustomers = customers[0]?.totalCustomers || 0;
    res.json({ success: true, data: { totalCustomers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['pending', 'success'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "pending" or "success"',
      });
    }

    const order =
      (await Order.findById(orderId).catch(() => null)) ||
      (await Order.findOne({ orderNumber: orderId }));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'success') {
      return res.status(400).json({
        success: false,
        message: 'Order already marked as success',
      });
    }

    order.status = status;
    await order.save();

    let emailSent = false;
    let emailError = null;
    if (status === 'success') {
      try {
        await feedbackService.createAndEmail(order);
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        logger.error('Order completion email failed', {
          orderId: order._id,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Order completed — confirmation email sent to customer'
        : emailError
          ? `Order completed, but email failed: ${emailError}`
          : 'Order status updated successfully',
      data: order,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
