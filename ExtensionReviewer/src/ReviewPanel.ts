import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { marked } from "marked";
import { getGitDiff } from "./extension";

export class ReviewPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiCodeReview.panel";
  private view?: vscode.WebviewView;
  private _content = "Waiting for commit or manual trigger...";
  private _hasGeneratedTests = false;
  private _lastGeneratedTests = "";
  private _lastFilePath: string | null = null;
  private _token: string | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    this._token = (await this.context.secrets.get("authToken")) ?? null;

    if (!this._token) {
      webviewView.webview.html = this._getLoginHtml();
    } else {
      webviewView.webview.html = this._getHtml(
        this._content,
        this._hasGeneratedTests
      );
    }

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "login":
          try {
            const res = await fetch("http://localhost:5142/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: message.email,
                password: message.password,
              }),
            });

            if (!res.ok) {
              const text = await res.text();
              vscode.window.showErrorMessage(`Login failed: ${text}`);
              return;
            }

            const data = await res.json();
            this._token = data.token;

            await this.context.secrets.store("authToken", data.token);

            vscode.window.showInformationMessage("✅ Login successful!");
            this._refreshSidebar();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Login error: ${err.message}`);
          }
          break;

        case "reanalyze":
          this.update(
            '<div><span class="spinner"></span> Re-analyzing the code...</div>'
          );
          vscode.window.showInformationMessage("Re-Analyze the code...!");
          vscode.commands.executeCommand("aicodereview.start");
          break;

        case "generateTest":
          try {
            const activeEditor = vscode.window.activeTextEditor;
            this._lastFilePath = activeEditor?.document.uri.fsPath || null;

            this.update(
              '<div><span class="spinner"></span> Generating test cases...</div>'
            );
            vscode.window.showInformationMessage(
              "Generating The Test Case...!"
            );

            const diff = await getGitDiff();
            if (!diff || diff.startsWith("⚠️")) {
              this.update("⚠️ No new commit diff found.");
              return;
            }

            const response = await fetch(
              "http://localhost:5142/api/test/generate",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${this._token}`,
                },
                body: JSON.stringify({ code: diff }),
              }
            );

            if (!response.ok) {
              const text = await response.text();
              throw new Error(text);
            }

            const data = await response.json();

            const result = data.result || "⚠️ No test cases generated.";

            this._lastGeneratedTests = result;
            this._hasGeneratedTests = true;
            this.update(result);
          } catch (err: any) {
            this.update(`❌ Failed to generate test cases: ${err.message}`);
          }
          break;

        case "validateTest":
          try {
            if (!this._lastGeneratedTests.trim()) {
              vscode.window.showWarningMessage("⚠️ No test cases available.");
              return;
            }

            this.update(
              '<div><span class="spinner"></span> Validating test cases...</div>'
            );
            vscode.window.showInformationMessage(
              "Validating The Test Case...!"
            );

            const res = await fetch("http://localhost:5142/api/test/validate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this._token}`,
              },
              body: JSON.stringify({ tests: this._lastGeneratedTests }),
            });

            if (!res.ok) {
              throw new Error(await res.text());
            }

            const data = await res.json();
            const result = data.result || "❌ Validation failed.";

            this.update(result);
          } catch (err: any) {
            this.update(`❌ Validation failed: ${err.message}`);
          }
          break;

        case "saveTest":
          try {
            if (!this._lastGeneratedTests.trim()) {
              vscode.window.showWarningMessage("⚠️ No test cases to save.");
              return;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
              throw new Error("No workspace open");
            }

            const workspacePath = workspaceFolders[0].uri.fsPath;
            const testFolderPath = path.join(workspacePath, "tests");

            if (!fs.existsSync(testFolderPath)) {
              fs.mkdirSync(testFolderPath, { recursive: true });
            }

            const originalName = this._lastFilePath
              ? path.basename(
                  this._lastFilePath,
                  path.extname(this._lastFilePath)
                )
              : "Generated";

            const fileName = `${originalName}Test.java`;
            const fullPath = path.join(testFolderPath, fileName);

            let cleanTest = this._lastGeneratedTests
              .replace(/```[a-zA-Z]*\n?/g, "")
              .replace(/```/g, "")
              .trim();

            fs.writeFileSync(fullPath, cleanTest, "utf8");
            vscode.window.showInformationMessage(
              `💾 Test saved to tests/${fileName}`
            );
          } catch (err: any) {
            vscode.window.showErrorMessage(
              `❌ Failed to save test: ${err.message}`
            );
          }
          break;

        case "logout":
          await this.context.secrets.delete("authToken");
          this._token = null;
          vscode.window.showInformationMessage("👋 Logged out.");
          this._refreshSidebar();
          break;

         case "generateJestTest":
      try {
        const activeEditor = vscode.window.activeTextEditor;
        this._lastFilePath = activeEditor?.document.uri.fsPath || null;

        this.update('<div><span class="spinner"></span> Generating Jest test cases...</div>');
        vscode.window.showInformationMessage("Generating Jest Test Cases...");

        const diff = await getGitDiff();
        if (!diff || diff.startsWith("⚠️")) {
          this.update("⚠️ No new commit diff found.");
          return;
        }

        const response = await fetch("http://localhost:5142/api/Test/jestGenerate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this._token}`,
          },
          body: JSON.stringify({ code: diff }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        const result = data.result || "⚠️ No Jest tests generated.";

        this._lastGeneratedTests = result;
        this._hasGeneratedTests = true;

        this.update(result);
      } catch (err: any) {
        this.update(`❌ Failed to generate Jest tests: ${err.message}`);
      }
      break;
      case "validateJestTest":
      try {
        if (!this._lastGeneratedTests.trim()) {
          vscode.window.showWarningMessage("⚠️ No Jest tests available.");
          return;
        }

        this.update('<div><span class="spinner"></span> Validating Jest tests...</div>');
        vscode.window.showInformationMessage("Validating Jest Test Cases...");

        const res = await fetch("http://localhost:5142/api/Test/jestValidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this._token}`,
          },
          body: JSON.stringify({ tests: this._lastGeneratedTests }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        const result = data.result || "❌ Validation failed.";

        this.update(result);
      } catch (err: any) {
        this.update(`❌ Validation failed: ${err.message}`);
      }
      break;

      case "saveJestTest":
  try {
    if (!this._lastGeneratedTests.trim()) {
      vscode.window.showWarningMessage("⚠️ No Jest tests to save.");
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No workspace open");
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const testFolderPath = path.join(workspacePath, "__tests__");

    if (!fs.existsSync(testFolderPath)) {
      fs.mkdirSync(testFolderPath, { recursive: true });
    }

    const baseName = this._lastFilePath
      ? path.basename(this._lastFilePath, path.extname(this._lastFilePath))
      : "generated";

    const fileName = `${baseName}.test.js`;
    const fullPath = path.join(testFolderPath, fileName);

    let cleanTest = this._lastGeneratedTests
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .trim();

    fs.writeFileSync(fullPath, cleanTest, "utf8");

    vscode.window.showInformationMessage(`💾 Jest test saved: __tests__/${fileName}`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`❌ Failed to save Jest test: ${err.message}`);
  }
  break;

case "updateReadme":
    try {
        vscode.window.showInformationMessage("📄 Updating README...");

        // 1. Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const readmePath = path.join(workspacePath, "README.md");

        // 2. Read current README content (if exists)
        let currentReadme = "";
        const readmeExists = fs.existsSync(readmePath);

        if (readmeExists) {
            currentReadme = fs.readFileSync(readmePath, "utf8");
        }

        // 3. Get Git diff
        const diff = await getGitDiff();
        if (!diff || diff.startsWith("⚠️")) {
            vscode.window.showWarningMessage("⚠️ No new code changes found.");
            return;
        }

        // 4. Call backend API
        const res = await fetch("http://localhost:5142/api/docs/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this._token}`,
            },
            body: JSON.stringify({ readme: currentReadme, diff }),
        });

        const data = await res.text();

        if (!res.ok) {
            throw new Error(JSON.stringify(data));
        }

        // 5. Write to README.md
        if (!readmeExists) {
            // README does not exist → Create new one
            fs.writeFileSync(readmePath, data, "utf8");
        } else {
            // README exists → Append new content
            fs.appendFileSync(readmePath, "\n\n" + data, "utf8");
        }

        // 6. Notify user & update UI
        vscode.window.showInformationMessage("✅ README.md updated successfully!");
        this.update("✅ README.md updated successfully!");

    } catch (err: any) {
        vscode.window.showErrorMessage(`❌ Failed to update README: ${err.message}`);
        this.update(`❌ Failed to update README: ${err.message}`);
    }
    break;

        case "clear":
          vscode.window.showInformationMessage("Clearing the Panel...!");
          this._content = "Waiting for commit or manual trigger...";
          this._hasGeneratedTests = false;
          this._lastGeneratedTests = "";
          this._lastFilePath = null;
          this._refreshSidebar();
          break;
      }
    });

    setTimeout(() => this._refreshSidebar(), 400);
  }

  async update(content: string) {
    try {
      const html = await marked.parse(content);
      this._content = html as string;
    } catch {
      this._content = content;
    }

    this._refreshSidebar();
  }

  private _refreshSidebar() {
    if (!this.view) return;
    if (!this._token) {
      this.view.webview.html = this._getLoginHtml();
    } else {
      this.view.webview.html = this._getHtml(
        this._content,
        this._hasGeneratedTests
      );
    }
  }

  private _getLoginHtml(): string {
    return `
      <html>
      <head>
        <style>
          body { background:#1e1e1e; color:#ddd; font-family:Segoe UI; padding:24px; }
          input { width:100%; padding:8px; margin-top:6px; border-radius:6px; }
          button { background:#007acc; color:#fff; padding:8px 14px; border:none; border-radius:6px; cursor:pointer; }
        </style>
      </head>

      <body>
        <h2>🔐 Login Required</h2>

        <label>Email:</label>
        <input type="email" id="email" />

        <label>Password:</label>
        <input type="password" id="password" />

        <button id="loginBtn">Login</button>

        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById("loginBtn").addEventListener("click", () => {
            vscode.postMessage({
              command: "login",
              email: document.getElementById("email").value,
              password: document.getElementById("password").value
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private _getHtml(
    content: string = this._content,
    showValidate: boolean = false
  ): string {
    return `
    <html>
    <head>
      <style>
        body { background:#1e1e1e; color:#ddd; font-family:Segoe UI; padding:16px; }

        .box {
          background:#252526;
          border:1px solid #333;
          border-radius:8px;
          padding:15px;
          min-height:150px;
          overflow-y:auto;
        }

        .box h1, .box h2, .box h3 { color:#4fc3f7; margin-top: 0.8em; }
        .box p { line-height:1.5; margin:0.3em 0; }
        .box pre {
          background:#1a1a1a;
          padding:10px;
          border-radius:6px;
          overflow-x:auto;
          font-family:Consolas, monospace;
          font-size:12px;
          position:relative;
        }
        .box code {
          font-family:Consolas, monospace;
        }
        .box ul { margin-left:20px; }
        .box li { margin-bottom:4px; }

        .code-block {
          position: relative;
          margin: 8px 0;
        }

        .code-block pre {
          margin: 0;
        }

        .copy-btn {
          position:absolute;
          top:6px;
          right:6px;
          background:#3c3c3c;
          color:#ddd;
          border:none;
          padding:3px 8px;
          border-radius:4px;
          font-size:11px;
          cursor:pointer;
          opacity:0.8;
        }

        .copy-btn:hover {
          opacity:1;
        }

        button.action-btn {
          background:#007acc;
          color:white;
          border:none;
          padding:6px 12px;
          border-radius:6px;
          cursor:pointer;
          margin-top:10px;
          margin-right:6px;
        }

        .spinner {
          border: 4px solid #333;
          border-top: 4px solid #4fc3f7;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          display:inline-block;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>

    <body>
      <h2>🤖 AI Code Review Summary</h2>

      <div class="box">${content}</div>

      <button id="reanalyzeBtn" class="action-btn">🔁 Re-Analyze</button>
      <button id="generateTestBtn" class="action-btn">🧪 Generate Tests</button>
      ${
        showValidate
          ? `
            <button id="validateTestBtn" class="action-btn">✅ Validate Tests</button>
            <button id="saveTestBtn" class="action-btn">💾 Save Test Case</button>
          `
          : ""
      }
          <button id="generateJestTestBtn" class="action-btn">🧪 Generate Jest testcases</button>
    ${
      showValidate
        ? `
          <button id="validateJestTestBtn" class="action-btn">✅ Validate Jest testcases</button>
          <button id="saveJestTestBtn" class="action-btn">💾 Save Jest testcases</button>
        `
        : ""
      }

      <button id="clearBtn" class="action-btn">🧹 Clear</button>
      <button id="updateReadmeBtn" class="action-btn">📄 Update README</button>


      <button id="logoutBtn" class="action-btn">🚪 Logout</button>

      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById("updateReadmeBtn").onclick = () => vscode.postMessage({ command:"updateReadme" });

        document.getElementById("reanalyzeBtn").onclick = () =>
          vscode.postMessage({ command:"reanalyze" });

        document.getElementById("generateTestBtn").onclick = () =>
          vscode.postMessage({ command:"generateTest" });

        const v = document.getElementById("validateTestBtn");
        if (v) v.onclick = () =>
          vscode.postMessage({ command:"validateTest" });

        const saveBtn = document.getElementById("saveTestBtn");
        if (saveBtn) {
          saveBtn.onclick = () =>
            vscode.postMessage({ command:"saveTest" });
        }
                document.getElementById("generateJestTestBtn").onclick = () =>
        vscode.postMessage({ command: "generateJestTest" });

      document.getElementById("validateJestTestBtn").onclick = () =>
        vscode.postMessage({ command: "validateJestTest" });

      document.getElementById("saveJestTestBtn").onclick = () =>
        vscode.postMessage({ command: "saveJestTest" });


        document.getElementById("clearBtn").onclick = () =>
          vscode.postMessage({ command:"clear" });

        document.getElementById("logoutBtn").onclick = () =>
          vscode.postMessage({ command:"logout" });

        function enhanceCodeBlocks() {
          const box = document.querySelector(".box");
          if (!box) return;

          const pres = box.querySelectorAll("pre");

          pres.forEach((pre) => {
            if (pre.dataset.hasCopyButton === "true") return;
            pre.dataset.hasCopyButton = "true";

            const wrapper = document.createElement("div");
            wrapper.className = "code-block";

            const parent = pre.parentNode;
            if (!parent) return;
            parent.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement("button");
            btn.className = "copy-btn";
            btn.textContent = "Copy";

            btn.addEventListener("click", () => {
              const codeText = pre.innerText || pre.textContent || "";

              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(codeText).then(() => {
                  btn.textContent = "Copied!";
                  setTimeout(() => (btn.textContent = "Copy"), 1500);
                }).catch(() => {
                  fallbackCopy(codeText, btn);
                });
              } else {
                fallbackCopy(codeText, btn);
              }
            });

            wrapper.appendChild(btn);
          });
        }

        function fallbackCopy(text, btn) {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
            btn.textContent = "Copied!";
            setTimeout(() => (btn.textContent = "Copy"), 1500);
          } catch (e) {
            console.error("Copy failed", e);
          }
          document.body.removeChild(textarea);
        }

        enhanceCodeBlocks();
      </script>

    </body>
    </html>
  `;
  }
}
