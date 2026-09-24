import { useEffect, useState } from "react";
import axios from "axios";

import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import ResetPassword from "./ResetPassword";
import OrderTracking from "./OrderTracking";
import PaymentCallback from "./PaymentCallback";

import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");

  const [orderData, setOrderData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // --------------------------------------------------
  // UPDATE PAGE WHEN URL CHANGES
  // --------------------------------------------------

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // --------------------------------------------------
  // FETCH MENU
  // --------------------------------------------------

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/menu`);

        console.log("MENU RESPONSE:", response.data);

        setMenuItems(response.data.menuItems || []);
      } catch (error) {
        console.error(
          "Failed to fetch menu:",
          error.response?.data || error.message
        );
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenu();
  }, []);

  // --------------------------------------------------
  // ADD TO CART
  // --------------------------------------------------

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem._id === item._id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem._id === item._id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  // --------------------------------------------------
  // REMOVE FROM CART
  // --------------------------------------------------

  const removeFromCart = (itemId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== itemId)
    );
  };

  // --------------------------------------------------
  // UPDATE QUANTITY
  // --------------------------------------------------

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === itemId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // --------------------------------------------------
  // CART TOTAL
  // --------------------------------------------------

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  // --------------------------------------------------
  // CART COUNT
  // --------------------------------------------------

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // --------------------------------------------------
  // CHECKOUT FORM
  // --------------------------------------------------

  const handleOrderChange = (e) => {
    setOrderData((currentData) => ({
      ...currentData,
      [e.target.name]: e.target.value,
    }));
  };

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    if (
      !orderData.name ||
      !orderData.phone ||
      !orderData.email ||
      !orderData.address
    ) {
      setOrderError("Please fill in all your delivery details.");
      return;
    }

    setOrderLoading(true);
    setOrderMessage("");
    setOrderError("");

    try {
      // --------------------------------------------------
      // PAYLOAD MATCHES BACKEND createOrder()
      // --------------------------------------------------

      const orderPayload = {
        guestName: orderData.name,
        guestEmail: orderData.email,
        guestPhone: orderData.phone,
        deliveryAddress: orderData.address,

        items: cart.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
        })),
      };

      console.log("ORDER PAYLOAD:", orderPayload);

      // --------------------------------------------------
      // CREATE ORDER
      // --------------------------------------------------

      const response = await axios.post(
        `${API_URL}/orders`,
        orderPayload
      );

      console.log("ORDER RESPONSE:", response.data);

      const order = response.data.order;

      if (!order) {
        throw new Error("Order was not returned by the server.");
      }

      setOrderMessage("Order created successfully!");

      // --------------------------------------------------
      // INITIALIZE FLUTTERWAVE PAYMENT
      // --------------------------------------------------

      try {
        const paymentResponse = await axios.post(
          `${API_URL}/payments/initialize`,
          {
            orderId: order._id,
            email: orderData.email,
            amount: order.totalPrice,
          }
        );

        console.log(
          "PAYMENT RESPONSE:",
          paymentResponse.data
        );

        const paymentUrl =
          paymentResponse.data.paymentUrl;

        if (paymentUrl) {
          localStorage.setItem(
            "pendingPaymentReference",
            paymentResponse.data.reference || ""
          );

          localStorage.setItem(
            "pendingOrderTrackingId",
            order.trackingId || ""
          );

          // Clear cart before leaving for Flutterwave
          setCart([]);

          setShowCheckout(false);
          setShowCart(false);

          // Go to Flutterwave
          window.location.href = paymentUrl;

          return;
        }

        setOrderError(
          "Order was created, but no payment link was returned."
        );
      } catch (paymentError) {
        console.error(
          "Payment initialization error:",
          paymentError.response?.data ||
            paymentError.message
        );

        setOrderError(
          "Order was created, but payment could not be initialized."
        );
      }
    } catch (error) {
      console.error(
        "Place order error:",
        error.response?.data || error.message
      );

      setOrderError(
        error.response?.data?.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setOrderLoading(false);
    }
  };

  // --------------------------------------------------
  // ADMIN LOGIN
  // --------------------------------------------------

  if (path === "/admin") {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    if (adminLoggedIn) {
      return <AdminDashboard />;
    }

    return <AdminLogin />;
  }

  // --------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------

  if (
    path === "/admin/reset-password" ||
    path.startsWith("/admin/reset-password/")
  ) {
    return <ResetPassword />;
  }

  // --------------------------------------------------
  // ORDER TRACKING
  // --------------------------------------------------

  if (path === "/track-order") {
    return <OrderTracking />;
  }

  // --------------------------------------------------
  // PAYMENT CALLBACK
  // --------------------------------------------------

  if (path === "/payment/callback") {
    return <PaymentCallback />;
  }

  // --------------------------------------------------
  // MAIN RESTAURANT PAGE
  // --------------------------------------------------

  return (
    <div className="app">
      {/* ==========================================
          NAVBAR
      ========================================== */}

      <nav className="navbar">
        <div className="navbar-container">
          <div
            className="logo"
            onClick={() => {
              window.history.pushState({}, "", "/");
              setPath("/");
            }}
            style={{ cursor: "pointer" }}
          >
            Restaurant
          </div>

          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#menu">Menu</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>

            <button
              className="track-nav-button"
              onClick={() => {
                window.history.pushState(
                  {},
                  "",
                  "/track-order"
                );
                setPath("/track-order");
              }}
            >
              Track Order
            </button>

            <button
              className="cart-button"
              onClick={() => setShowCart(true)}
            >
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO
      ========================================== */}

      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-small-text">
              FRESH • DELICIOUS • FAST
            </span>

            <h1>
              Delicious Food,
              <br />
              Delivered To You.
            </h1>

            <p>
              Enjoy freshly prepared meals made with quality
              ingredients and delivered straight to your door.
            </p>

            <a href="#menu" className="hero-button">
              Explore Menu
            </a>
          </div>

          <div className="hero-image-container">
            <img
              src="https://images.unsplash.com/photo-1763048443535-1243379234e2?q=80&w=972&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Delicious food"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* ==========================================
          MENU
      ========================================== */}

      <section id="menu" className="menu-section">
        <div className="section-heading">
          <span>OUR MENU</span>
          <h2>Choose Your Favourite Meal</h2>
          <p>
            Freshly prepared dishes made just for you.
          </p>
        </div>

        {loadingMenu ? (
          <div className="menu-loading">
            <p>Loading menu...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="menu-empty">
            <p>No menu items available right now.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {menuItems.map((item) => (
              <div className="menu-card" key={item._id}>
                {/* IMAGE */}

                {item.image && (
                  <div className="menu-image">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-image"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/600x400/111827/ffffff?text=Food+Image";
                      }}
                    />
                  </div>
                )}

                {/* CARD CONTENT */}

                <div className="menu-card-content">
                  <div className="menu-card-top">
                    <span className="menu-category">
                      {item.category}
                    </span>

                    {!item.availability && (
                      <span className="unavailable-badge">
                        Unavailable
                      </span>
                    )}
                  </div>

                  <h3>{item.name}</h3>

                  <p className="menu-description">
                    {item.description}
                  </p>

                  <div className="menu-card-bottom">
                    <strong>
                      ₦{Number(item.price).toLocaleString()}
                    </strong>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={item.availability === false}
                    >
                      {item.availability === false
                        ? "Unavailable"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          ABOUT
      ========================================== */}

      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <span>ABOUT US</span>

            <h2>
              Good Food.
              <br />
              Great Experience.
            </h2>

            <p>
              We believe that great food should be fresh,
              delicious and convenient. Our restaurant
              prepares quality meals using carefully selected
              ingredients.
            </p>

            <p>
              Whether you're ordering lunch, dinner or a quick
              meal, we're here to make your experience simple
              and enjoyable.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          CONTACT
      ========================================== */}

      <section id="contact" className="contact-section">
        <div className="section-heading">
          <span>CONTACT</span>
          <h2>We'd Love To Hear From You</h2>

          <p>
            Have a question about your order? Get in touch
            with us.
          </p>
        </div>

        <div className="contact-info">
          <div className="contact-card">
            <h3>Phone</h3>
            <p>08057194594</p>
          </div>

          <div className="contact-card">
            <h3>Email</h3>
            <p>orderingsystemrestaurant@gmail.com</p>
          </div>

          <div className="contact-card">
            <h3>Address</h3>
            <p>Lagos, Nigeria</p>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Restaurant Ordering
          System. All rights reserved.
        </p>
      </footer>

      {/* ==========================================
          CART MODAL
      ========================================== */}

      {showCart && (
        <div
          className="modal-overlay"
          onClick={() => setShowCart(false)}
        >
          <div
            className="cart-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowCart(false)}
            >
              ×
            </button>

            <h2>Your Cart</h2>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty.</p>

                <button
                  onClick={() => setShowCart(false)}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div
                      className="cart-item"
                      key={item._id}
                    >
                      {/* IMAGE */}

                      <img
                        src={
                          item.image ||
                          "https://placehold.co/100x100/111827/ffffff?text=Food"
                        }
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/100x100/111827/ffffff?text=Food";
                        }}
                      />

                      {/* ITEM INFO */}

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>

                        <p>
                          ₦
                          {Number(
                            item.price
                          ).toLocaleString()}
                        </p>
                      </div>

                      {/* QUANTITY */}

                      <div className="quantity-controls">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity - 1
                            )
                          }
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      {/* REMOVE */}

                      <button
                        className="remove-item"
                        onClick={() =>
                          removeFromCart(item._id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}

                <div className="cart-total">
                  <strong>Total:</strong>

                  <strong>
                    ₦{cartTotal.toLocaleString()}
                  </strong>
                </div>

                {/* CHECKOUT */}

                <button
                  className="checkout-button"
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                    setOrderMessage("");
                    setOrderError("");
                  }}
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          CHECKOUT MODAL
      ========================================== */}

      {showCheckout && (
        <div
          className="modal-overlay"
          onClick={() => setShowCheckout(false)}
        >
          <div
            className="checkout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowCheckout(false)}
            >
              ×
            </button>

            <h2>Checkout</h2>

            <p>
              Enter your delivery details to place your
              order.
            </p>

            <form onSubmit={handlePlaceOrder}>
              {/* NAME */}

              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={orderData.name}
                onChange={handleOrderChange}
                placeholder="John Doe"
                required
              />

              {/* PHONE */}

              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                name="phone"
                value={orderData.phone}
                onChange={handleOrderChange}
                placeholder="08012345678"
                required
              />

              {/* EMAIL */}

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={orderData.email}
                onChange={handleOrderChange}
                placeholder="john@example.com"
                required
              />

              {/* ADDRESS */}

              <label htmlFor="address">
                Delivery Address
              </label>

              <textarea
                id="address"
                name="address"
                value={orderData.address}
                onChange={handleOrderChange}
                placeholder="Enter your delivery address"
                rows="4"
                required
              />

              {/* TOTAL */}

              <div className="checkout-total">
                <span>Order Total</span>

                <strong>
                  ₦{cartTotal.toLocaleString()}
                </strong>
              </div>

              {/* SUBMIT */}

              <button
                className="checkoutBtn"
                type="submit"
                disabled={orderLoading}
              >
                {orderLoading
                  ? "Processing..."
                  : "Place Order & Pay"}
              </button>
            </form>

            {/* SUCCESS */}

            {orderMessage && (
              <p className="success-message">
                {orderMessage}
              </p>
            )}

            {/* ERROR */}

            {orderError && (
              <p className="error-message">
                {orderError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;