import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000";

const EMPTY_FORM = {
  name: "",
  price: "",
  image: "",
  description: "",
  category: "",
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [orderFilter, setOrderFilter] = useState("All");

  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);

  const [menuForm, setMenuForm] = useState(EMPTY_FORM);

  const [savingMenu, setSavingMenu] = useState(false);

  // =========================
  // FETCH ORDERS
  // =========================
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);

      const response = await fetch(`${API_URL}/orders`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // =========================
  // FETCH MENU
  // =========================
  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);

      const response = await fetch(`${API_URL}/menu`);
      const data = await response.json();

      console.log("Admin menu response:", data);

      if (data.success) {
        setMenuItems(data.menuItems || []);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, []);

  // =========================
  // SOCKET.IO
  // =========================
  useEffect(() => {
    const socket = io(API_URL);

    socket.on("newOrder", (newOrder) => {
      setOrders((currentOrders) => [
        newOrder,
        ...currentOrders,
      ]);
    });

    socket.on("orderUpdated", (updatedOrder) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === updatedOrder._id
            ? updatedOrder
            : order
        )
      );
    });

    socket.on("menuUpdated", () => {
      fetchMenu();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // =========================
  // ORDER FILTER
  // =========================
  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") {
      return orders;
    }

    return orders.filter(
      (order) => order.orderStatus === orderFilter
    );
  }, [orders, orderFilter]);

  // =========================
  // UPDATE ORDER STATUS
  // =========================
  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderStatus: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update order.");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus:
                  data.order?.orderStatus || status,
              }
            : order
        )
      );
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Something went wrong while updating the order.");
    }
  };

  // =========================
  // CANCEL ORDER
  // =========================
  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to cancel order.");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: "Cancelled",
              }
            : order
        )
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Something went wrong while cancelling the order.");
    }
  };

  // =========================
  // MENU FORM
  // =========================
  const handleMenuFormChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files && files[0]) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setMenuForm((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };

      reader.readAsDataURL(files[0]);
      return;
    }

    setMenuForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddMenuForm = () => {
    setEditingMenuId(null);
    setMenuForm(EMPTY_FORM);
    setShowMenuForm(true);
  };

  const resetMenuForm = () => {
    setEditingMenuId(null);
    setMenuForm(EMPTY_FORM);
  };

  const openEditMenuForm = (item) => {
    setEditingMenuId(item._id);

    setMenuForm({
      name: item.name || "",
      price: item.price || "",
      image: item.image || "",
      description: item.description || "",
      category: item.category || "",
    });

    setShowMenuForm(true);
  };

  const closeMenuForm = () => {
    setShowMenuForm(false);
    setEditingMenuId(null);
    setMenuForm(EMPTY_FORM);
  };

  // =========================
  // SAVE MENU ITEM
  // =========================
  const handleMenuSubmit = async (e) => {
    e.preventDefault();

    if (!menuForm.name.trim()) {
      alert("Please enter the menu item name.");
      return;
    }

    if (!menuForm.price) {
      alert("Please enter the price.");
      return;
    }

    if (!menuForm.image.trim()) {
      alert("Please enter an image URL.");
      return;
    }

    if (!menuForm.description.trim()) {
      alert("Please enter a description.");
      return;
    }

    if (!menuForm.category.trim()) {
      alert("Please enter a category.");
      return;
    }

    try {
      setSavingMenu(true);

      const payload = {
        name: menuForm.name.trim(),
        price: Number(menuForm.price),
        image: menuForm.image.trim(),
        description: menuForm.description.trim(),
        category: menuForm.category.trim(),
      };

      const url = editingMenuId
        ? `${API_URL}/menu/${editingMenuId}`
        : `${API_URL}/menu`;

      const method = editingMenuId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Menu save response:", data);

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            `Failed to ${
              editingMenuId ? "update" : "create"
            } menu item.`
        );
        return;
      }

      await fetchMenu();
      closeMenuForm();
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Something went wrong while saving the menu item.");
    } finally {
      setSavingMenu(false);
    }
  };

  // =========================
  // DELETE MENU ITEM
  // =========================
  const deleteMenuItem = async (menuId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu item?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/menu/${menuId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete menu item.");
        return;
      }

      setMenuItems((currentItems) =>
        currentItems.filter((item) => item._id !== menuId)
      );
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Something went wrong while deleting the menu item.");
    }
  };

  // =========================
  // TOGGLE AVAILABILITY
  // =========================
  const toggleAvailability = async (item) => {
    try {
      const response = await fetch(
        `${API_URL}/menu/${item._id}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            availability: !item.availability,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message || "Failed to update availability."
        );
        return;
      }

      setMenuItems((currentItems) =>
        currentItems.map((menuItem) =>
          menuItem._id === item._id
            ? {
                ...menuItem,
                availability:
                  data.menuItem?.availability ??
                  !item.availability,
              }
            : menuItem
        )
      );
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Something went wrong while updating availability.");
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("adminLoggedIn");
    window.location.href = "/admin";
  };

  return (
    <div className="admin-dashboard">
      {/* =========================
          SIDEBAR
      ========================= */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Restaurant.
          <span>ADMIN</span>
        </div>

        <div className="admin-nav-wrapper">
          <button
            className={`admin-nav ${
              activeTab === "orders" ? "active" : ""
            }`}
            onClick={() => setActiveTab("orders")}
          >
            📦 Orders
          </button>

          <button
            className={`admin-nav ${
              activeTab === "menu" ? "active" : ""
            }`}
            onClick={() => setActiveTab("menu")}
          >
            🍽️ Menu
          </button>
        </div>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      {/* =========================
          MAIN
      ========================= */}
      <main className="admin-main">
        {/* =========================
            ORDERS
        ========================= */}
        {activeTab === "orders" && (
          <>
            <div className="admin-header">
              <div>
                <p>ADMIN DASHBOARD</p>
                <h1>Orders</h1>
              </div>

              <div className="admin-live">
                <span></span>
                Live
              </div>
            </div>

            <div className="order-filters">
              {[
                "All",
                "Incoming",
                "Preparing",
                "Ready",
                "Completed",
                "Cancelled",
              ].map((status) => (
                <button
                  key={status}
                  className={`order-filter ${
                    orderFilter === status ? "active" : ""
                  }`}
                  onClick={() => setOrderFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-admin">
                <h2>No Orders</h2>
                <p>
                  There are no orders in the selected category.
                </p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div
                    className="order-card"
                    key={order._id}
                  >
                    <div className="order-top">
                      <div>
                        <span className="order-label">
                          ORDER
                        </span>

                        <h2>
                          #
                          {order.trackingId ||
                            order._id.slice(-6).toUpperCase()}
                        </h2>
                      </div>

                      <span
                        className={`order-status ${String(
                          order.orderStatus || ""
                        )
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="order-details">
                      <p>
                        <strong>Customer:</strong>{" "}
                        {order.guestName}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {order.guestEmail}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {order.guestPhone}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {order.deliveryAddress}
                      </p>

                      <p>
                        <strong>Payment:</strong>{" "}
                        {order.paymentStatus}
                      </p>
                    </div>

                    <div className="order-items">
                      <h3>Order Items</h3>

                      {order.items?.map((item, index) => (
                        <div
                          className="order-item"
                          key={item._id || index}
                        >
                          <span>
                            {item.menuItem?.name ||
                              "Menu Item"}
                          </span>

                          <span>
                            × {item.quantity}
                          </span>

                          <span>
                            ₦
                            {Number(
                              item.price * item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-bottom">
                      <strong>
                        Total: ₦
                        {Number(
                          order.totalPrice
                        ).toLocaleString()}
                      </strong>

                      <div className="order-actions">
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            updateOrderStatus(
                              order._id,
                              e.target.value
                            )
                          }
                          disabled={
                            order.orderStatus ===
                              "Cancelled" ||
                            order.orderStatus ===
                              "Completed"
                          }
                        >
                          <option value="Incoming">
                            Incoming
                          </option>

                          <option value="Preparing">
                            Preparing
                          </option>

                          <option value="Ready">
                            Ready
                          </option>

                          <option value="Completed">
                            Completed
                          </option>

                          <option value="Cancelled">
                            Cancelled
                          </option>
                        </select>

                        {order.orderStatus !==
                          "Cancelled" &&
                          order.orderStatus !==
                            "Completed" && (
                            <button
                              className="cancel-order"
                              onClick={() =>
                                cancelOrder(order._id)
                              }
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* =========================
            MENU
        ========================= */}
        {activeTab === "menu" && (
          <>
            <div className="admin-header">
              <div>
                <p>MENU MANAGEMENT</p>
                <h1>Menu</h1>
              </div>

              <button
                className="add-menu-button"
                onClick={() => {
                  if (showMenuForm) {
                    resetMenuForm();
                  }

                  setShowMenuForm(!showMenuForm);
                }}
              >
                {showMenuForm ? "Close Form" : "+ Add Menu Item"}
              </button>
            </div>

            {/* =========================
                ADD / EDIT FORM
            ========================= */}
            {showMenuForm && (
              <form
                className="menu-form"
                onSubmit={handleMenuSubmit}
              >
                <div className="menu-form-header">
                  <div>
                    <span>
                      {editingMenuId
                        ? "EDIT MENU ITEM"
                        : "NEW MENU ITEM"}
                    </span>

                    <h2>
                      {editingMenuId
                        ? "Edit Menu Item"
                        : "Add Menu Item"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="modal-close"
                    onClick={closeMenuForm}
                  >
                    ×
                  </button>
                </div>

                <div className="menu-form-grid">
                  <div className="form-group">
                    <label>Menu Name</label>

                    <input
                      type="text"
                      name="name"
                      value={menuForm.name}
                      onChange={handleMenuFormChange}
                      placeholder="e.g. Jollof Rice"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Price</label>

                    <input
                      type="number"
                      name="price"
                      value={menuForm.price}
                      onChange={handleMenuFormChange}
                      placeholder="e.g. 3500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group menu-form-full">
                    <label>Menu Image</label>

                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleMenuFormChange}
                      placeholder="https://images.unsplash.com/..."
                      required
                    />

                    <small>
                      Choose an image of the food to show on the menu.
                    </small>
                  </div>

                  {menuForm.image && (
                    <div className="image-url-preview menu-form-full">
                      <img
                        src={menuForm.image}
                        alt="Preview"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="form-group menu-form-full">
                    <label>Description</label>

                    <textarea
                      name="description"
                      value={menuForm.description}
                      onChange={handleMenuFormChange}
                      placeholder="Describe the meal..."
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>

                    <input
                      type="text"
                      name="category"
                      value={menuForm.category}
                      onChange={handleMenuFormChange}
                      placeholder="e.g. Rice"
                      required
                    />
                  </div>
                </div>

                <div className="menu-form-actions">
                  <button
                    type="button"
                    className="cancel-form"
                    onClick={closeMenuForm}
                    disabled={savingMenu}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-menu-button"
                    disabled={savingMenu}
                  >
                    {savingMenu
                      ? "Saving..."
                      : editingMenuId
                      ? "Update Menu Item"
                      : "Add Menu Item"}
                  </button>
                </div>
              </form>
            )}

            {/* =========================
                MENU LIST
            ========================= */}
            {loadingMenu ? (
              <p>Loading menu...</p>
            ) : menuItems.length === 0 ? (
              <div className="empty-admin">
                <h2>No Menu Items</h2>

                <p>
                  Add your first menu item using the button
                  above.
                </p>
              </div>
            ) : (
              <div className="admin-menu-grid">
                {menuItems.map((item) => (
                  <div
                    className="admin-menu-card"
                    key={item._id}
                  >
                    <div className="admin-menu-image">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/600x400/111827/ffffff?text=Food+Image";
                        }}
                      />

                      <span
                        className={
                          item.availability
                            ? "available-badge"
                            : "unavailable-badge"
                        }
                      >
                        {item.availability
                          ? "Available"
                          : "Unavailable"}
                      </span>
                    </div>

                    <div className="admin-menu-content">
                      <span className="menu-category">
                        {item.category}
                      </span>

                      <h2>{item.name}</h2>

                      <p>{item.description}</p>

                      <strong className="admin-menu-price">
                        ₦
                        {Number(
                          item.price
                        ).toLocaleString()}
                      </strong>

                      <div className="menu-actions">
                        <button
                          className="edit-menu"
                          onClick={() =>
                            openEditMenuForm(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            toggleAvailability(item)
                          }
                        >
                          {item.availability
                            ? "Make Unavailable"
                            : "Make Available"}
                        </button>

                        <button
                          className="delete-menu"
                          onClick={() =>
                            deleteMenuItem(item._id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;