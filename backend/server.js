import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Debug logs — check if .env loaded properly
console.log("✅ GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log(
  "✅ GITHUB_CLIENT_SECRET:",
  process.env.GITHUB_CLIENT_SECRET ? "Loaded successfully ✅" : "❌ Missing!"
);

// Exchange code for access token
app.post("/auth/github", async (req, res) => {
  const { code } = req.body;
  console.log("📩 Received code from frontend:", code);

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = response.data.access_token;
    console.log("🎟️ Access Token received from GitHub:", accessToken);

    res.json({ access_token: accessToken });
  } catch (err) {
    console.error(
      "❌ Error while exchanging code for token:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
});

// ✨ Post Gemini review to GitHub PR as a comment
app.post("/github/postReview", async (req, res) => {
  const { repoOwner, repoName, prNumber, geminiResponse, accessToken } =
    req.body;

  try {
    const commentBody = `
###  Gemini AI Code Review
**Summary:** ${geminiResponse.summary}

**Key Changes:**  
${geminiResponse.keyChanges}

**Suggestions:**  
${geminiResponse.suggestions}
`;

    const response = await axios.post(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/comments`,
      { body: commentBody },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, commentUrl: response.data.html_url });
  } catch (error) {
    console.error(
      "❌ Error posting comment:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to post review comment" });
  }
});

// ✅ NEW: Fetch PRs via backend (to avoid frontend 401 errors)
app.get("/github/prs", async (req, res) => {
  const { repoOwner, repoName, accessToken } = req.query;
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "❌ Error fetching PRs:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch PRs" });
  }
});

// ✅ NEW: Fetch user activity via backend
app.get("/github/activity", async (req, res) => {
  const { username, accessToken } = req.query;
  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}/events`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "❌ Error fetching activity:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

const PORT = 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
