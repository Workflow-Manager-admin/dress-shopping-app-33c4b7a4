const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

// PUBLIC_INTERFACE
export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to login');
  return await res.json();
}

// PUBLIC_INTERFACE
export async function fetchProducts(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE}/products?${query}`);
  if (!res.ok) throw new Error('Fetch products failed');
  return await res.json();
}

// PUBLIC_INTERFACE
export async function placeOrder(product_id, user_phone) {
  const res = await fetch(`${API_BASE}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, user_phone })
  });
  if (!res.ok) throw new Error('Order creation failed');
  return await res.json();
}

// PUBLIC_INTERFACE
export async function fetchOrders(user_phone) {
  const res = await fetch(`${API_BASE}/orders/${user_phone}`);
  if (!res.ok) throw new Error('Fetch orders failed');
  return await res.json();
}

// PUBLIC_INTERFACE
export async function initiatePayment(order_id) {
  const res = await fetch(`${API_BASE}/pay/${order_id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Payment API failure');
  return await res.json();
}

// PUBLIC_INTERFACE
export async function confirmPayment(order_id) {
  const res = await fetch(`${API_BASE}/pay/success/${order_id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Payment confirmation failed');
  return await res.json();
}
