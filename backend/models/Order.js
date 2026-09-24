import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        guestName: {
            type: String,
            required: true,
            trim: true,
        },

        guestEmail: {
            type: String,
            required: true,
            trim: true,
        },

        guestPhone: {
            type: String,
            required: true,
            trim: true,
        },

        deliveryAddress: {
            type: String,
            required: true,
            trim: true,
        },

        items: [
            {
                menuItem: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Menu",
                    required: true,
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],

        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        orderStatus: {
            type: String,
            enum: [
                "Incoming",
                "Preparing",
                "Ready",
                "Completed",
                "Cancelled",
            ],
            default: "Incoming",
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Failed",
            ],
            default: "Pending",
        },

   paymentReference: {
    type: String,
    default: null,
},

paymentTransactionId: {
    type: String,
    default: null,
},
trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
},
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;