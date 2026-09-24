import axios from "axios";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/mailer.js";

// ==========================================
// INITIALIZE FLUTTERWAVE PAYMENT
// ==========================================
export const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid for",
      });
    }

    if (!process.env.FLW_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "Flutterwave secret key is missing",
      });
    }

    const txRef =
      `ORDER-${order._id}-${Date.now()}`;

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: txRef,
        amount: order.totalPrice,
        currency: "NGN",

        redirect_url:
          `${frontendUrl}/payment/callback`,

        customer: {
          email: order.guestEmail,
          name: order.guestName,
          phonenumber: order.guestPhone,
        },

        customizations: {
          title: "Restaurant Order",
          description:
            "Payment for restaurant order",
        },
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    order.paymentReference = txRef;

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment initialized successfully",
      paymentUrl: response.data.data.link,
      reference: txRef,
    });
  } catch (error) {
    console.error(
      "Flutterwave initialization error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to initialize payment",
    });
  }
};

// ==========================================
// VERIFY FLUTTERWAVE PAYMENT
// ==========================================
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const { transactionId } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Flutterwave transaction ID is required",
      });
    }

    if (!process.env.FLW_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "Flutterwave secret key is missing",
      });
    }

    const order = await Order.findOne({
      paymentReference: reference,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found for this payment",
      });
    }

    // Prevent duplicate processing
    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    const paymentData =
      response.data?.data;

    if (!paymentData) {
      return res.status(502).json({
        success: false,
        message:
          "Flutterwave returned an invalid payment response",
      });
    }

    const isPaymentValid =
      ["successful", "success"].includes(
        String(paymentData.status).toLowerCase()
      ) &&
      Number(paymentData.amount) ===
        Number(order.totalPrice) &&
      String(paymentData.currency).toUpperCase() ===
        "NGN" &&
      String(paymentData.tx_ref) ===
        String(order.paymentReference);

    if (!isPaymentValid) {
      order.paymentStatus = "Failed";
      order.paymentTransactionId =
        String(transactionId);

      await order.save();

      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed",
      });
    }

    // ==========================================
    // PAYMENT SUCCESSFUL
    // ==========================================

    order.paymentStatus = "Paid";
    order.paymentTransactionId =
      String(transactionId);

    await order.save();

    // ==========================================
    // SEND CUSTOMER EMAIL
    // ==========================================

    try {
      await sendEmail({
        to: order.guestEmail,
        subject:
          "Order Confirmed - Restaurant Ordering System",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Order Confirmed 🎉</h2>

            <p>Hello ${order.guestName},</p>

            <p>
              Your payment was successful and your
              restaurant order has been confirmed.
            </p>

            <p>
              <strong>Tracking ID:</strong>
              ${order.trackingId}
            </p>

            <p>
              <strong>Total Paid:</strong>
              ₦${Number(
                order.totalPrice
              ).toLocaleString()}
            </p>

            <p>
              Use your tracking ID to check
              your order status.
            </p>

            <p>
              Thank you for ordering with us!
            </p>

            <p>
              Regards,<br />
              Restaurant Ordering System
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        "Customer confirmation email failed:",
        emailError.message
      );
    }

    // ==========================================
    // SEND ADMIN EMAIL
    // ==========================================

    if (process.env.EMAIL_USER) {
      try {
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject:
            "New Restaurant Order Received",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>New Order Received 🔔</h2>

              <p>
                A new paid order has been received.
              </p>

              <p>
                <strong>Tracking ID:</strong>
                ${order.trackingId}
              </p>

              <p>
                <strong>Customer:</strong>
                ${order.guestName}
              </p>

              <p>
                <strong>Phone:</strong>
                ${order.guestPhone}
              </p>

              <p>
                <strong>Email:</strong>
                ${order.guestEmail}
              </p>

              <p>
                <strong>Delivery Address:</strong><br />
                ${order.deliveryAddress}
              </p>

              <p>
                <strong>Total:</strong>
                ₦${Number(
                  order.totalPrice
                ).toLocaleString()}
              </p>

              <p>
                Log in to the admin dashboard
                to view the full order.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(
          "Admin notification email failed:",
          emailError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and order confirmed",
      order,
    });
  } catch (error) {
    console.error(
      "Flutterwave verification error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify payment",
    });
  }
};