import React, { useEffect, useState } from "react";
import axios from "axios";
import { GITHUB_CLIENT_ID, REDIRECT_URI } from "../config";

const Login = () => {
  const [accessToken, setAccessToken] = useState(null);

  const handleLogin = () => {
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo,user`;
    window.location.href = githubAuthURL;
  };

  // 👇 This runs after GitHub redirects back with the code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      axios.post("http://localhost:5142/auth/github", { code })
        .then(res => {
          const { access_token } = res.data;
          console.log("✅ Access token from backend:", access_token);
          setAccessToken(access_token);
          localStorage.setItem("github_token", access_token);
        })
        .catch(err => console.error("❌ Error fetching access token:", err));
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>AI Code Reviewer</h1>
      <p>Login with GitHub to analyze pull requests</p>
      <button onClick={handleLogin}>Login with GitHub</button>
    </div>
  );
};

export default Login;
