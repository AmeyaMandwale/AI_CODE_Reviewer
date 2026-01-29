import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Dashboard = ({ accessToken }) => {
  const [fetchResponse, setFetchResponse] = useState(null);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [activityResponse, setActivityResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewRules, setReviewRules] = useState("");
  const [generatedTests, setGeneratedTests] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const files = [
      "CustomRules/SolidDesignPrincipal.txt",
      "CustomRules/Formating.txt",
      "CustomRules/Security.txt",
      "CustomRules/Node.txt",
      "CustomRules/React.txt",
      "CustomRules/TestCase.txt",
    ];

    Promise.all(files.map((file) => fetch(file).then((res) => res.text())))
      .then((contents) => setReviewRules(contents.join("\n\n")))
      .catch((err) => console.error("❌ Error loading review rules:", err));
  }, []);

  useEffect(() => {
    if (!accessToken) {
      console.warn("⚠️ No access token provided via props.");
      return;
    }

    if (!reviewRules) {
      console.log("⏳ Waiting for review rules to load...");
      return; // Wait until rules are fetched
    }
    // 1️⃣ Fetch Pull Requests
    const fetchPRs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "https://api.github.com/repos/AmeyaMandwale/auth_demo/pulls",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        setFetchResponse(res.data);
        console.log("📦 Pull Requests:", res.data);

        if (res.data.length > 0) {
          const pr = res.data[0];
          const filesRes = await axios.get(pr.url + "/files", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const files = filesRes.data;
          generateGeminiReview(pr, files);
        } else {
          setAnalysisResponse({ summary: "No PRs available for analysis." });
        }
      } catch (err) {
        console.error("❌ Error fetching PRs:", err);
        setAnalysisResponse({ summary: "Failed to fetch PRs." });
      } finally {
        setLoading(false);
      }
    };

    const fetchActivity = async () => {
      try {
        const res = await axios.get(
          "https://api.github.com/users/AmeyaMandwale/events",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setActivityResponse(res.data.slice(0, 5));
      } catch (err) {
        console.error("❌ Error fetching activity:", err);
      }
    };

    fetchPRs();
    fetchActivity();
  }, [accessToken, reviewRules]);

  // 3️⃣ Gemini Review Generation + Post to GitHub
  const generateGeminiReview = async (pr, files = []) => {
    try {
      const codeText = files.length
        ? files
            .map((f) => `File: ${f.filename}\n${f.patch || f.contents || ""}`)
            .join("\n\n")
        : "No code changes available for review.";

      const prompt = `
You are an expert AI code reviewer.
You are reviewing code changes from the pull request titled: **"${pr.title}"**
Branch: **${pr.head.ref} → ${pr.base.ref}**
Below are the **custom code review rules** to follow (each rule is numbered):
${reviewRules}

---

### Your Task:
1. Analyze ONLY the code changes from this PR (not all PRs).
2. Apply the above review rules carefully.
3. Identify which **rule numbers** (from the provided list) are **not being followed**.
4. For each violated rule, explain:
   - What part of the code violates the rule.
   - Why it violates the rule.
   - The corrected or improved code snippet.
5. If all rules are followed, clearly state that no violations were found.
6. Check All Testcases pass or not give at last how many Test case passed by code.
6. Also show how percentage of code acc/to our Rules

---

### Code Changes to Review:
${codeText}

---

Provide your response in this structured format:
**Rule Violations:**
- Rule [number]: [brief summary of issue]
  - **Details:** [explanation]
  - **Fix:** [suggested change]

If no rules are violated, respond with:
> ✅ All review rules are properly followed in this PR.

Provide a response of up to 350 words including:
1️⃣ Summary of the code changes
2️⃣ Major Suggestions
3️⃣ Key Changes Required
      `;

      // 🔹 Call Gemini API
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSyBaEdh8gGQ-jhUWz_l6NLM4YCE_M4AeEuI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      console.log("prompt" + prompt);

      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No meaningful response received.";

      // 🔹 Update UI summary immediately
      setAnalysisResponse({
        summary: text,
        status: "AI review generated successfully.",
      });

      // 🔹 Post Gemini review to GitHub via backend
      try {
        const backendRes = await axios.post(
          "http://localhost:5142/github/postReview",
          {
            repoOwner: "AmeyaMandwale",
            repoName: "auth_demo",
            prNumber: pr.number,
            geminiResponse: {
              summary: text,
              keyChanges: "Automatically analyzed by Gemini AI.",
              suggestions: "Review suggestions are included in the summary.",
            },
            accessToken,
          }
        );

        if (backendRes.data?.success) {
          console.log(
            "✅ Gemini AI review posted successfully:",
            backendRes.data.commentUrl
          );
        } else {
          console.warn(
            "⚠️ Gemini AI review posting returned unexpected response:",
            backendRes.data
          );
        }
      } catch (err) {
        console.error(
          "❌ Error posting Gemini review:",
          err.response?.data || err.message
        );
        setAnalysisResponse((prev) => ({
          summary: prev?.summary + "\n\n⚠️ Failed to post AI review to GitHub.",
        }));
      }
    } catch (err) {
      console.error("❌ Error generating Gemini review:", err);
      setAnalysisResponse({
        summary: "Error generating AI review.",
        status: "❌ Generation failed.",
      });
    }
  };

  const generateTestCases = async () => {
    try {
      setTestLoading(true);

      const pr = fetchResponse?.[0];
      if (!pr) {
        alert("No PR found!");
        return;
      }

      const filesRes = await axios.get(pr.url + "/files", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const prFiles = filesRes.data.map((file) => ({
        name: file.filename,
        patch: file.patch,
      }));

      const prompt = `
You are an expert AI test case generator.
You are an expert  developer and test automation engineer.
You are analyzing code changes from the pull request titled: **"${pr.title}"**
Branch: **${pr.head.ref} → ${pr.base.ref}**
Generate comprehensive 5 unit tests in JUnit 5 (Jupiter) format for the following Java class.
Follow these rules strictly:
1.Use @Test, @DisplayName, @Nested, and @ParameterizedTest annotations.
2.Group related tests inside @Nested classes (one per method).
3.Include positive, negative, zero, and boundary cases (Integer.MAX_VALUE, Integer.MIN_VALUE, etc.).
4.Add parameterized tests with @CsvSource for common combinations.
5.Each test method must have a clear, behavior-style name and @DisplayName (e.g., "should handle negative input correctly").
6.Use assertions from org.junit.jupiter.api.Assertions (assertEquals, assertTrue, etc.).
7.Maintain clean formatting and indentation with descriptive variable names.
8.Include integration tests combining multiple methods, if applicable.
9.Do not include main() or unnecessary boilerplate — only the test class.
10.Output should be a fully formatted JUnit 5 test class ready to run.

PR Code:
\`\`\`
${prFiles.map((f) => f.patch).join("\n\n")}
\`\`\`
`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSyBaEdh8gGQ-jhUWz_l6NLM4YCE_M4AeEuI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      // ✅ Properly parse JSON from fetch
      const data = await response.json();
      console.log("Gemini API response:", data);

      // ✅ Extract text safely
      const outputText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No output generated.";

      // ✅ Split into test cases (optional)
      const tests = outputText.split(/\n\s*\n/); // split by blank lines
      setGeneratedTests(tests);
    } catch (err) {
      console.error("❌ Error generating test cases:", err);
    } finally {
      setTestLoading(false);
    }
  };

  const runTestCases = async () => {
    if (generatedTests.length === 0) {
      alert("❗ No test cases generated yet");
      return;
    }

    try {
      setTestLoading(true);

      // Convert test array to plain text
      const testPrompt = `
You are an expert QA tester.
You are an expert test case validator.
Run the following test cases against the given code or logic.
For each test case, only show whether it "Follows ✅" or "Does Not Follow ❌" the expected behavior — no extra explanation.
give in proper format in proper numbering.

${generatedTests.join("\n\n")}
`;

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSyBaEdh8gGQ-jhUWz_l6NLM4YCE_M4AeEuI",
        {
          contents: [
            {
              parts: [{ text: testPrompt }],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // ✅ Extract text properly
      const resultText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No result generated.";

      setTestResult(resultText);
    } catch (err) {
      console.error("❌ Error running tests:", err);
    } finally {
      setTestLoading(false);
    }
  };

  // ✅ Push generated test cases into /tests folder in repo
  // ✅ Push generated test cases into /tests folder in the repo
  const pushTestsToRepo = async (options = {}) => {
    const {
      owner = "AmeyaMandwale",
      repo = "auth_demo",
      prNumber,
      accessToken,
      fileContent, // The test code to push
    } = options;

    if (!prNumber || !accessToken || !fileContent) {
      console.error(
        "❌ Missing required info (PR number, token, or file content)."
      );
      return;
    }

    try {
      // 1️⃣ Identify PR and branch
      const pr =
        fetchResponse?.find((p) => p.number === prNumber) || fetchResponse?.[0];
      const branch = pr?.head?.ref;
      if (!branch) throw new Error("❌ PR branch not found.");

      // 2️⃣ Fetch PR files from GitHub
      console.log(`📦 Fetching changed files for PR #${prNumber}...`);
      const filesRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const files = filesRes.data || [];
      console.log(`📄 ${files.length} file(s) found in PR.`);

      // 3️⃣ Derive base name from first Java file
      let baseFileName = "Generated";
      const javaFile = files.find((f) => f.filename.endsWith(".java"));
      if (javaFile) {
        const match = javaFile.filename.match(/([^/]+)\.java$/i);
        if (match) baseFileName = match[1];
      }

      const testFileName = `${baseFileName}Test.java`; // e.g., HelloTest.java
      const testsFolder = "tests";
      const testFilePath = `${testsFolder}/${testFileName}`;

      // 4️⃣ Prepare GitHub API headers
      const ghHeaders = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      };

      // 5️⃣ Base64 encode the content
      const encodeBase64 = (str) =>
        window.btoa(unescape(encodeURIComponent(str)));
      const contentBase64 = encodeBase64(fileContent);

      // 6️⃣ Check if /tests folder exists
      let folderExists = false;
      try {
        const res = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${testsFolder}?ref=${branch}`,
          { headers: ghHeaders }
        );
        if (Array.isArray(res.data)) {
          folderExists = true;
          console.log("📁 /tests folder already exists.");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log(
            "🆕 /tests folder not found. It will be created automatically."
          );
        } else {
          throw err;
        }
      }

      // 7️⃣ Check if test file already exists
      let existingSha = null;
      let fileAlreadyExists = false;
      try {
        const res = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
            testFilePath
          )}?ref=${branch}`,
          { headers: ghHeaders }
        );
        if (res.status === 200 && res.data?.sha) {
          existingSha = res.data.sha;
          fileAlreadyExists = true;
          console.log(
            `♻️ File ${testFileName} already exists. It will be updated.`
          );
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log(`🆕 Creating new test file: ${testFileName}`);
        } else {
          throw err;
        }
      }

      // 8️⃣ Create or update file on GitHub
      const commitMessage = fileAlreadyExists
        ? `chore: update auto-generated test ${testFileName} (PR ${prNumber})`
        : `chore: add auto-generated test ${testFileName} (PR ${prNumber})`;

      const body = {
        message: commitMessage,
        content: contentBase64,
        branch: branch,
        ...(existingSha ? { sha: existingSha } : {}),
      };

      const putRes = await axios.put(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
          testFilePath
        )}`,
        body,
        { headers: ghHeaders }
      );

      console.log(
        `✅ Test pushed successfully as /${testFilePath} on branch ${branch}`
      );
      console.log("📦 GitHub Response:", putRes.data);
    } catch (err) {
      console.error(
        "❌ Error pushing test file:",
        err.response?.data || err.message
      );
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>GitHub Data Dashboard</h2>
      {/* Pull Requests */}
      <section>
        <h3>1️⃣ Pull Requests</h3>
        {fetchResponse && fetchResponse.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "15px",
              marginTop: "10px",
            }}
          >
            {fetchResponse.map((pr) => (
              <div
                key={pr.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  backgroundColor: "#fff",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                }}
              >
                <p>
                  <strong>Title:</strong> {pr.title}
                </p>
                <p>
                  <strong>Branch:</strong> {pr.head.ref} → {pr.base.ref}
                </p>
                <p>
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#007bff", textDecoration: "none" }}
                  >
                    🔗 View PR
                  </a>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No pull requests found.</p>
        )}
      </section>
      {/* Gemini AI Summary */}
      <section>
        <h3>2️⃣ Gemini AI Summary</h3>
        {loading ? (
          <p>Analyzing PR with Gemini...</p>
        ) : analysisResponse?.summary ? (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysisResponse.summary}
            </ReactMarkdown>
          </div>
        ) : (
          <p>No summary available</p>
        )}
      </section>
      {/* ✅ TEST CASE GENERATOR */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        {/* ✅ Generate Test Cases Button */}
        <button
          onClick={generateTestCases}
          style={{
            padding: "10px 18px",
            background: "#4CAF50",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✅ Generate Test Cases
        </button>

        {/* ⏳ Loading Indicator */}
        {testLoading && <p>⏳ Processing...</p>}

        {/* ✅ Show Generated Test Cases */}
        {generatedTests.length > 0 && (
          <div
            style={{
              marginTop: "15px",
              background: "#f4f4f4",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>✅ Generated Test Cases</h4>

            {/* Render test cases with markdown */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedTests.join("\n\n")}
            </ReactMarkdown>

            {/* ▶️ Run Test Cases Button */}
            <button
              onClick={runTestCases}
              style={{
                padding: "10px 18px",
                background: "#007bff",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              ▶️ Run Test Cases
            </button>
          </div>
        )}
        {/* 📤 Push Tests to Repo */}
        <button
          onClick={async () => {
            const pr = fetchResponse?.[0];
            if (!pr) return alert("No PR found!");

            // Fetch PR files to know original filename
            const filesRes = await axios.get(pr.url + "/files", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const prFiles = filesRes.data;

            // Combine generated tests text
            const fileContent = generatedTests.join("\n\n");

            await pushTestsToRepo({
              owner: "AmeyaMandwale",
              repo: "auth_demo",
              prNumber: pr.number,
              accessToken,
              fileContent,
              originalFiles: prFiles, // pass files for proper test naming
            });
          }}
          style={{
            padding: "10px 18px",
            background: "#6f42c1",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          📤 Push Tests to Repo
        </button>

        {/* ✅ Test Results */}
        {testResult && (
          <div
            style={{
              marginTop: "15px",
              background: "#e8f5e9",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>✅ Test Results</h4>

            {/* Render formatted test results */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {`\`\`\`json\n${JSON.stringify(testResult, null, 2)}\n\`\`\``}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {/* Recent GitHub Activity */}
      <section
        style={{
          backgroundColor: "#fafafa",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h3 style={{ textAlign: "center" }}>3️⃣ Recent GitHub Activity</h3>

        {activityResponse && activityResponse.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            {activityResponse.map((event) => (
              <div
                key={event.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                }}
              >
                <p>
                  <strong>Type:</strong> {event.type}
                </p>
                <p>
                  <strong>Repo:</strong> {event.repo.name}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "gray" }}>
            No recent activity found.
          </p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
