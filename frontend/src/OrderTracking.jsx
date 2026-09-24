import { useState } from "react";
import axios from "axios";
import "./OrderTracking.css";

const API_URL = "http://localhost:5000";

function OrderTracking() {
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackOrder = async (e) => {
    e.preventDefault();

    if (!trackingId.trim()) {
      setError("Please enter your tracking ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const response = await axios.get(
        `${API_URL}/orders/track/${trackingId.trim()}`
      );

      setOrder(response.data.order);
    } catch (error) {
      console.error(
        "Tracking error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to find this order."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-page">
      <div className="tracking-container">
        <p className="tracking-small">
          ORDER TRACKING
        </p>

        <h1>Track Your Order</h1>

        <p>
          Enter your tracking ID to check the
          current status of your order.
        </p>

        <form onSubmit={trackOrder}>
          <input
            type="text"
            placeholder="Example: ORD-A1B2C3D4"
            value={trackingId}
            onChange={(e) =>
              setTrackingId(e.target.value)
            }
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="tracking-error">
            {error}
          </div>
        )}

        {order && (
          <div className="tracking-result">
            <h2>Order Found</h2>

            <p>
              <strong>Tracking ID:</strong>{" "}
              {order.trackingId}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {order.orderStatus}
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              {order.paymentStatus}
            </p>

            <p>
              <strong>Total:</strong>{" "}
              ₦{Number(order.totalPrice).toLocaleString()}
            </p>

            <h3>Items</h3>

            {order.items?.map((item) => (
              <div
                className="tracking-item"
                key={item._id}
              >
                <span>
                  {item.menuItem?.name ||
                    "Menu Item"}
                </span>

                <span>
                  × {item.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTracking;