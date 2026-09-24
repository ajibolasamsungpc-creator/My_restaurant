import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import crypto from "crypto";
import { io } from "../server.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
    try {
        const {
            guestName,
            guestEmail,
            guestPhone,
            deliveryAddress,
            items,
        } = req.body;

        if (!guestName || !guestEmail || !guestPhone || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: "All guest details are required",
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one item",
            });
        }

        const orderItems = [];
        let totalPrice = 0;

        for (const item of items) {
            const menuItem = await Menu.findById(item.menuItem);

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: "Menu item not found",
                });
            }

            if (!menuItem.availability) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is currently unavailable`,
                });
            }

            const quantity = Number(item.quantity);

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be at least 1",
                });
            }

            const itemTotal = menuItem.price * quantity;

            orderItems.push({
                menuItem: menuItem._id,
                quantity,
                price: menuItem.price,
            });

            totalPrice += itemTotal;
        }

        const trackingId = `ORD-${crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()}`;

        const order = await Order.create({
            guestName,
            guestEmail,
            guestPhone,
            deliveryAddress,
            items: orderItems,
            totalPrice,
            trackingId,
        });

        // REAL-TIME: notify connected admin clients
        io.emit("newOrder", order);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create order error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// GET ALL ORDERS - ADMIN ONLY
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("items.menuItem")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// UPDATE ORDER STATUS - ADMIN ONLY
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Incoming",
            "Preparing",
            "Ready",
            "Completed",
            "Cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: status },
            {
                new: true,
                runValidators: true,
            }
        ).populate("items.menuItem");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // REAL-TIME: notify connected admin clients
        io.emit("orderStatusUpdated", order);

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update order status error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// GET SINGLE ORDER - ADMIN ONLY
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate("items.menuItem");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// CANCEL ORDER - ADMIN ONLY
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: "Cancelled" },
            { new: true }
        ).populate("items.menuItem");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // REAL-TIME: notify connected admin clients
        io.emit("orderCancelled", order);

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// TRACK ORDER - PUBLIC
export const trackOrder = async (req, res) => {
    try {
        const { trackingId } = req.params;

        const order = await Order.findOne({ trackingId })
            .populate("items.menuItem");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            order: {
                trackingId: order.trackingId,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                items: order.items,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error) {
        console.error("Track order error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};