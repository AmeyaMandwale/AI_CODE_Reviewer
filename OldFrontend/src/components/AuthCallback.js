import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthCallback = ({ setAccessToken }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      console.log("📩 Code received:", code);

      // Exchange code for access token
      axios
        .post("http://localhost:5142/auth/github", { code })
        .then((res) => {
          const { access_token } = res.data;
          console.log("🎟️ Token received:", access_token);

          // ✅ Update App.js state
          setAccessToken(access_token);

          // ✅ Optional: store in localStorage if you want persistence
          localStorage.setItem("github_token", access_token);

          // ✅ Navigate to dashboard
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("❌ Error fetching access token:", err);
        });
    }
  }, [setAccessToken, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Logging in with GitHub...</h2>
      <p>Please wait while we authenticate your account.</p>
    </div>
  );
};

export default AuthCallback;
