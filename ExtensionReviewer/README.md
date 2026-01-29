# 🧠 AI Code Review

An **AI-powered VS Code extension** that automatically reviews your JavaScript and TypeScript files using **Google's Gemini model**.

---

## 🚀 Features

- 🔍 Reviews your changed files automatically after each Git commit
- ⚙️ Highlights potential errors and improvements
- 💬 Displays AI review results in VS Code Output panel
- 🤖 Uses Gemini API for intelligent code insights

---

## 🧩 Usage

### 🪜 Step-by-step Guide

1. **Clone or open your project in VS Code**

   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   code .
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Compile TypeScript (if the extension is written in TypeScript)**

   ```bash
   npm run compile
   ```

4. **Run the extension in the Extension Development Host**

   - Press `F5` (or select **Run → Start Debugging**)
   - A new VS Code window (Extension Development Host) will open

5. **Trigger a review**

   Make a code change, then stage and commit it to trigger the automatic review hook:

   ```bash
   git add .
   git commit -m "Test AI Review"
   ```

   The extension detects the commit and starts the AI Code Review. Results appear in **View → Output → AI Code Review**.

### ⚙️ Commands

| Command                        | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `AI Code Review: Start Review` | Manually trigger an AI review                       |
| `(Auto)`                       | Runs automatically on every Git commit (if enabled) |

## 🛠 Requirements

- ✅ Internet connection (for Gemini API)
- ✅ Node.js **>= 16**
- ✅ Git initialized in the workspace (`git init`)
- ✅ Valid Gemini API key configured inside your extension code or environment

## 🔐 Configuring the Gemini API Key

> ⚠️ Never commit your API keys to source control. Use environment variables or a secrets manager.

1. Create a `.env` file at the root of the extension project (not checked into Git):

   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```

2. In your extension code, load the key with `dotenv` (example):

   ```ts
   // src/extension.ts (example)
   import dotenv from "dotenv";
   dotenv.config();

   const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
   ```

3. If you prefer other secure methods, configure the key in your CI environment or use OS-level environment variables instead.

## 📦 Installation (VSIX)

To package and install the extension manually:

1. Build and package the extension:

   ```bash
   npm run package
   # this should produce a .vsix file
   ```

2. Install the resulting `.vsix` in VS Code:

   - Open **Extensions** → the `...` menu → **Install from VSIX...**
   - Select the generated `.vsix` file

## 🧩 Example: How the extension triggers reviews

The extension watches for local commits (or a Git hook) and then:

1. Collects changed files from the commit
2. Sends code snippets / diffs to the Gemini API
3. Receives AI suggestions and formats them
4. Writes the results to the **Output** panel under the `AI Code Review` channel

> Implementation details vary — the above is a typical flow. See `src/` for the actual implementation.

## 🐞 Troubleshooting

- **No output visible**

  - Open **View → Output** and choose `AI Code Review` from the dropdown.
  - Ensure the extension is running in the Extension Development Host (when debugging).
  - Confirm your Gemini API key is set and reachable.
  - Check the extension logs in the Debug Console for errors.

- **Command appears but does nothing**

  - Ensure your extension has been activated (open a workspace file in the Extension Development Host).
  - Verify `package.json` contains the command contribution and `activationEvents` required to register the command.

- **Extension runs only in host mode**

  - If the extension behaves differently in host vs. packaged mode, check platform-specific paths and permissions (e.g., where `.env` is loaded from).

## ✅ Recommended `package.json` snippets

- `contributes` (commands):

```json
"contributes": {
  "commands": [
    {
      "command": "aiCodeReview.startReview",
      "title": "AI Code Review: Start Review"
    }
  ]
}
```

- `activationEvents` (example):

```json
"activationEvents": [
  "onCommand:aiCodeReview.startReview",
  "onStartupFinished"
]
```

## 🧪 Running tests (if available)

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome. Please open issues and PRs for bugs, feature requests, or improvements.

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Submit a PR with a clear description and screenshots if applicable

## 📝 License

MIT © Pankaj Shahare

---

_Made with ❤️ — happy coding!_
