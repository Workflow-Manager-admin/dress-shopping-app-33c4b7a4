import React, { useState } from "react";
import { loginUser } from "../api";

// PUBLIC_INTERFACE
export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    chest_size: "",
    favorite_brand: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.phone || !form.chest_size || !form.favorite_brand) {
      setError("All fields required");
      return;
    }
    try {
      const user = await loginUser({ ...form, chest_size: parseInt(form.chest_size, 10) });
      onLogin(user);
    } catch (err) {
      setError("Error logging in. Try again.");
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome to Dress Shop</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Name:
          <input name="name" required value={form.name} onChange={handleChange} />
        </label>
        <label>
          Phone:
          <input name="phone" required value={form.phone} onChange={handleChange} />
        </label>
        <label>
          Chest Size:
          <input name="chest_size" type="number" required value={form.chest_size} onChange={handleChange} />
        </label>
        <label>
          Favorite Brand:
          <input name="favorite_brand" required value={form.favorite_brand} onChange={handleChange} />
        </label>
        <button className="btn" type="submit">Login / Register</button>
        {error && <div className="error-msg">{error}</div>}
      </form>
    </div>
  );
}
