const Order = require('../models/Order');
const Menu = require('../models/Menu');
const nodemailer = require('nodemailer');

// Create new order
exports.createOrder = async (req, res) => {
    console.log('📝 CREATE ORDER - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { customerName, mobile, address, specialInstructions, items, totalAmount } = req.body;

        // Validate items exist
        console.log('🔍 Validating items...');
        for (const item of items) {
            const menuItem = await Menu.findById(item.menuItemId);
            if (!menuItem) {
                console.log('❌ Item not found:', item.name);
                return res.status(404).json({
                    success: false,
                    message: `Item "${item.name}" not found`
                });
            }
        }
        console.log('✅ All items validated');

        const order = await Order.create({
            customerName,
            mobile,
            address,
            specialInstructions: specialInstructions || '',
            items: items.map(item => ({
                menuItemId: item.menuItemId,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            })),
            totalAmount,
            status: 'pending' // Default status
        });

        console.log('✅ Order created:', order._id);

        // Send email to admin
        await sendOrderEmail(order);

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders (Admin)
exports.getOrders = async (req, res) => {
    console.log('📝 GET ALL ORDERS - Request received');

    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        console.log('✅ Found', orders.length, 'orders');
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('❌ Get orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send order email
const sendOrderEmail = async (order) => {
    console.log('📧 Sending order email...');

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `🆕 New Order - ${order.customerName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b45309;">☕ New Order Received!</h2>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details:</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            <p><strong>Mobile:</strong> ${order.mobile}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Items:</h3>
            <ul style="list-style: none; padding: 0;">
              ${order.items.map(item =>
                `<li style="padding: 5px 0; border-bottom: 1px solid #fcd34d;">
                  ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}
                </li>`
            ).join('')}
            </ul>
            <h3 style="color: #b45309;">Total Amount: ₹${order.totalAmount}</h3>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Order placed on: ${new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Order email sent to admin');
    } catch (error) {
        console.error('❌ Email sending failed:', error);
    }
};

// Get customer count (unique customers)
exports.getCustomerCount = async (req, res) => {
    console.log('📝 GET CUSTOMER COUNT - Request received');

    try {
        // Get unique customer names and mobile numbers
        const customers = await Order.aggregate([
            {
                $group: {
                    _id: {
                        customerName: '$customerName',
                        mobile: '$mobile'
                    }
                }
            },
            {
                $count: 'totalCustomers'
            }
        ]);

        const totalCustomers = customers.length > 0 ? customers[0].totalCustomers : 0;
        console.log('✅ Total unique customers:', totalCustomers);

        res.json({
            success: true,
            data: { totalCustomers }
        });
    } catch (error) {
        console.error('❌ Get customer count error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ UPDATE ORDER STATUS - NEW FUNCTION
// ============================================
exports.updateOrderStatus = async (req, res) => {
    console.log('📝 UPDATE ORDER STATUS - Request received');
    console.log('📝 Order ID:', req.params.id);
    console.log('📝 New Status:', req.body.status);

    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // Validate status
        if (!['pending', 'success'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "pending" or "success"'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If already success, don't allow changes
        if (order.status === 'success') {
            return res.status(400).json({
                success: false,
                message: 'Order already marked as success'
            });
        }

        order.status = status;
        await order.save();

        console.log('✅ Order status updated:', order._id, '->', status);
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('❌ Update order status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};