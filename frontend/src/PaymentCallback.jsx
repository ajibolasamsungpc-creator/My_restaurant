import { useEffect, useState } from "react";
import axios from "axios";
import "./PaymentCallback.css";

const API_URL = "http://localhost:5000";

function PaymentCallback() {
  const [status, setStatus] = useState(
    "Verifying your payment..."
  );

  const [success, setSuccess] =
    useState(false);

  const [trackingId, setTrackingId] =
    useState("");

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const paymentStatus = (
          params.get("status") || ""
        ).toLowerCase();

        const transactionId =
          params.get("transaction_id") ||
          params.get("transactionId") ||
          params.get("id");

        const reference =
          params.get("tx_ref") ||
          params.get("reference") ||
          localStorage.getItem(
            "pendingPaymentReference"
          );

        const savedTrackingId =
          localStorage.getItem(
            "pendingOrderTrackingId"
          );

        setTrackingId(
          savedTrackingId || ""
        );

        if (
          ["failed", "cancelled", "canceled"].includes(
            paymentStatus
          )
        ) {
          setStatus(
            "Payment was not successful."
          );
          setChecking(false);
          return;
        }

        if (!transactionId) {
          setStatus(
            "Transaction ID was not found."
          );
          setChecking(false);
          return;
        }

        if (!reference) {
          setStatus(
            "Payment reference was not found."
          );
          setChecking(false);
          return;
        }

        const response =
          await axios.get(
            `${API_URL}/payments/verify/${encodeURIComponent(
              reference
            )}`,
            {
              params: {
                transactionId,
              },
            }
          );

        if (response.data.success) {
          setSuccess(true);

          setStatus(
            "Payment successful!"
          );

          localStorage.removeItem(
            "pendingOrderTrackingId"
          );

          localStorage.removeItem(
            "pendingPaymentReference"
          );
        } else {
          setStatus(
            response.data.message ||
              "Payment verification failed."
          );
        }
      } catch (error) {
        console.error(
          "Payment verification error:",
          error.response?.data ||
            error.message
        );

        setStatus(
          error.response?.data?.message ||
            "Unable to verify payment."
        );
      } finally {
        setChecking(false);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="payment-callback">
      <div className="payment-card">

        {checking ? (
          <>
            <div className="payment-icon loading">
              ...
            </div>

            <h1>
              Verifying Payment
            </h1>

            <p>
              Please wait while we confirm
              your payment.
            </p>
          </>
        ) : success ? (
          <>
            <div className="payment-icon success">
              ✓
            </div>

            <h1>
              Payment Successful!
            </h1>

            <p>
              Your payment has been verified
              successfully and your order has
              been confirmed.
            </p>

            {trackingId && (
              <div className="tracking-box">
                <span>
                  Your Tracking ID
                </span>

                <strong>
                  {trackingId}
                </strong>
              </div>
            )}

            <div className="payment-actions">
              {trackingId && (
                <a
                  href={`/track-order?trackingId=${trackingId}`}
                  className="payment-home-button"
                >
                  Track Order
                </a>
              )}

              <a
                href="/"
                className="payment-secondary-button"
              >
                Back to Home
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="payment-icon failed">
              !
            </div>

            <h1>
              Payment Verification
            </h1>

            <p>
              {status}
            </p>

            {trackingId && (
              <div className="tracking-box">
                <span>
                  Tracking ID
                </span>

                <strong>
                  {trackingId}
                </strong>
              </div>
            )}

            <div className="payment-actions">
              {trackingId && (
                <a
                  href={`/track-order?trackingId=${trackingId}`}
                  className="payment-home-button"
                >
                  Track Order
                </a>
              )}

              <a
                href="/"
                className="payment-secondary-button"
              >
                Back to Home
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default PaymentCallback;