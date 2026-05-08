import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";
import Navbar        from "./components/Navbar";
import ResumeBuilder from "./pages/ResumeBuilder";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Navigate to="/resume" replace />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="*"       element={<Navigate to="/resume" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        toastStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
      />
    </BrowserRouter>
  );
}
