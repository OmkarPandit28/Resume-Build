import React from "react";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">InternHub</span>
        </div>
        <div className="nav-right">
          <span className="badge-premium">⭐ Premium Feature</span>
        </div>
      </div>
    </nav>
  );
}
