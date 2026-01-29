import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import AuthCallback from "./components/AuthCallback";
import Dashboard from "./components/Dashboard";

function App() {
  const [accessToken, setAccessToken] = useState("");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/auth/callback"
          element={<AuthCallback setAccessToken={setAccessToken} />}
        />

        <Route
          path="/dashboard"
          element={
            accessToken ? (
              <Dashboard accessToken={accessToken} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
