import React from "react";

// PUBLIC_INTERFACE
export default function ProductCard({ product, onOrder }) {
  return (
    <div className="product-card">
      <img src={product.image_url.startsWith("http") ? product.image_url : (process.env.REACT_APP_API_BASE || "http://localhost:8000") + product.image_url} alt={product.name} className="product-img" />
      <h3>{product.name}</h3>
      <p>Brand: <strong>{product.brand}</strong></p>
      <p>Size: <strong>{product.size}</strong></p>
      <p>Price: <strong>₹{product.price}</strong></p>
      <button className="btn" onClick={() => onOrder(product)}>Buy</button>
    </div>
  );
}
