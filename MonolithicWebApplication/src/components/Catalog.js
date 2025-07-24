import React, { useEffect, useState } from "react";
import { fetchProducts, placeOrder } from "../api";
import ProductCard from "./ProductCard";

// PUBLIC_INTERFACE
export default function Catalog({ user, onOrderPlaced }) {
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("price");
  const [order, setOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchProducts({
      chest_size: user.chest_size,
      favorite_brand: user.favorite_brand,
      sort,
      order
    })
      .then(setProducts)
      .catch(() => setMsg("Error loading products"))
      .finally(() => setLoading(false));
  }, [user, sort, order]);

  const onOrder = async (product) => {
    setMsg("Placing order...");
    try {
      await placeOrder(product.id, user.phone);
      setMsg("Order placed! Go to My Orders.");
      onOrderPlaced && onOrderPlaced();
    } catch {
      setMsg("Order failed");
    }
  };

  return (
    <div>
      <div className="catalog-header">
        <h2>Dress Catalog</h2>
        <span>
          Sort by price:{" "}
          <select value={order} onChange={e => setOrder(e.target.value)}>
            <option value="asc">Low to high</option>
            <option value="desc">High to low</option>
          </select>
        </span>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div>No matching dresses found.</div>
      ) : (
        <div className="product-list">
          {products.map(prod =>
            <ProductCard key={prod.id} product={prod} onOrder={onOrder} />
          )}
        </div>
      )}
      {msg && <div className="info-msg">{msg}</div>}
    </div>
  );
}
