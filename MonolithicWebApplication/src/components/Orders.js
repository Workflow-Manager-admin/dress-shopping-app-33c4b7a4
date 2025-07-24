import React, { useEffect, useState } from "react";
import { fetchOrders, initiatePayment, confirmPayment } from "../api";

// PUBLIC_INTERFACE
export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");

  function load() {
    fetchOrders(user.phone)
      .then(setOrders)
      .catch(() => setMsg("Failed to load orders"));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const handlePay = async (order) => {
    setMsg("Redirecting to PhonePe...");
    try {
      const res = await initiatePayment(order.id);
      window.location.href = res.payment_url; // For demo, simulate redirect
    } catch {
      setMsg("Failed to initiate payment");
    }
  };

  return (
    <div>
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <div>You have no dresses ordered yet.</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Dress</th>
              <th>Brand</th>
              <th>Size</th>
              <th>Price</th>
              <th>Paid</th>
              <th>Pay</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.product.name}</td>
                <td>{order.product.brand}</td>
                <td>{order.product.size}</td>
                <td>₹{order.product.price}</td>
                <td>{order.is_paid ? '✅' : '❌'}</td>
                <td>
                  {!order.is_paid && (
                    <button className="btn" onClick={() => handlePay(order)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {msg && <div className="info-msg">{msg}</div>}
    </div>
  );
}
