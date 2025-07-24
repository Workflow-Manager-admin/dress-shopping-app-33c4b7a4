import React, { useState, useEffect } from 'react';
import './App.css';

// Component imports
import Login from './components/Login';
import Catalog from './components/Catalog';
import Orders from './components/Orders';

function Navbar({ user, onRoute, route }) {
  return (
    <nav className="navbar">
      <span className="navbar-title" onClick={() => onRoute("catalog")}>👗 Dress Shop</span>
      <div className="navbar-links">
        {user && (
          <>
            <button className={route === "catalog" ? "active" : ""} onClick={() => onRoute("catalog")}>Catalog</button>
            <button className={route === "orders" ? "active" : ""} onClick={() => onRoute("orders")}>My Orders</button>
            <span className="navbar-user">Hi {user.name}!</span>
          </>
        )}
      </div>
    </nav>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('catalog');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // persist user in sessionStorage (omitted logout for brevity)
  useEffect(() => {
    const u = sessionStorage.getItem("user_profile");
    if (u) setUser(JSON.parse(u));
  }, []);
  useEffect(() => {
    if (user) sessionStorage.setItem("user_profile", JSON.stringify(user));
  }, [user]);

  return (
    <div className="App">
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <Navbar user={user} onRoute={setRoute} route={route} />
      <div className="main-content">
        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          route === "orders" ? <Orders user={user} /> : <Catalog user={user} />
        )}
      </div>
    </div>
  );
}

export default App;
