"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.getGitDiff = getGitDiff;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cp = __importStar(require("child_process"));
const util = __importStar(require("util"));
const ReviewPanel_1 = require("./ReviewPanel");
const ProjectLogger_1 = require("./ProjectLogger");
const fetchLogs_1 = require("./fetchLogs");
const exec = util.promisify(cp.exec);
// 🌟 ENTRY POINT
async function activate(context) {
    const output = vscode.window.createOutputChannel("AI Code Review");
    output.show(true);
    output.appendLine("🟢 Extension Activated — Ready to auto-review commits");
    console.log("Activate --> started");
    // ------------------ INIT PROJECT LOGGER ------------------
    ProjectLogger_1.ProjectLogger.init();
    ProjectLogger_1.ProjectLogger.log("🔵 Extension activated and logger started");
    // ------------------ GENERATE LOGS BUTTON COMMAND ------------------
    const logCmd = vscode.commands.registerCommand("aicodereview.generateLogs", async () => {
        const file = ProjectLogger_1.ProjectLogger.flushToDisk();
        if (file) {
            vscode.window.showInformationMessage(`📄 Logs saved to: ${file}`);
        }
        else {
            vscode.window.showWarningMessage("⚠️ Logs could not be saved.");
        }
    });
    setTimeout(() => {
        vscode.commands.executeCommand("aicodereview.captureBuildLogs");
    }, 3000);
    captureGitLogsOnStart();
    // ------------------ FETCH GITHUB CI LOGS COMMAND ------------------
    const disposable = vscode.commands.registerCommand("aicodereview.captureBuildLogs", async () => {
        vscode.window.showInformationMessage("⏳ Capturing GitHub build logs...");
        try {
            const workspace = vscode.workspace.workspaceFolders?.[0];
            if (!workspace) {
                vscode.window.showErrorMessage("No workspace opened.");
                return;
            }
            await (0, fetchLogs_1.fetchLogsCommand)(context);
            vscode.window.showInformationMessage("✅ Build logs captured successfully!");
        }
        catch (err) {
            vscode.window.showErrorMessage("❌ Failed to capture build logs: " + (err?.message ?? err));
        }
    });
    context.subscriptions.push(disposable);
    const reviewPanel = new ReviewPanel_1.ReviewPanel(context);
    const provider = vscode.window.registerWebviewViewProvider(ReviewPanel_1.ReviewPanel.viewType, reviewPanel);
    context.subscriptions.push(provider);
    // ----------------------------------------------------------------------
    // REGISTER COMMAND: aicodereview.start
    // ----------------------------------------------------------------------
    const startCmd = vscode.commands.registerCommand("aicodereview.start", async () => {
        try {
            await vscode.commands.executeCommand("workbench.view.extension.aiCodeReview");
            try {
                await vscode.window.createTreeView("aiCodeReview.panel", {
                    treeDataProvider: {
                        getChildren: () => [],
                        getTreeItem: () => {
                            throw new Error("Not implemented");
                        },
                    },
                });
            }
            catch (err) {
                console.log("⚠️ Cannot reveal panel:", err);
            }
            const review = await runAIReview(output);
            // ⬇️ Add markdown formatting here before sending to panel
            // const html = (await marked.parse(review)) as string;
            reviewPanel.update(review);
        }
        catch (err) {
            const errMsg = `❌ Error running AI Review: ${err.message}`;
            output.appendLine(errMsg);
            // const html = (await marked.parse(errMsg)) as string;
            reviewPanel.update(errMsg);
        }
    });
    context.subscriptions.push(startCmd);
    // ----------------------------------------------------------------------
    // AUTO WATCH COMMITS
    // ----------------------------------------------------------------------
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        output.appendLine("⚠️ No workspace detected — auto-review disabled.");
        return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const gitLogPath = path.join(workspaceRoot, ".git", "logs", "HEAD");
    if (fs.existsSync(gitLogPath)) {
        ProjectLogger_1.ProjectLogger.log("Git logs watching--");
        output.appendLine(`🔍 Watching Git log at: ${gitLogPath}`);
        const watcher = fs.watch(gitLogPath, async (eventType) => {
            if (eventType === "change") {
                output.appendLine("📦 Commit detected — AI Review running...");
                try {
                    const review = await runAIReview(output);
                    // const html = (await marked.parse(review)) as string;
                    reviewPanel.update(review);
                }
                catch (err) {
                    const msg = `❌ Review failed: ${err.message}`;
                    output.appendLine(msg);
                    // const html = (await marked.parse(msg)) as string;
                    reviewPanel.update(msg);
                }
            }
        });
        context.subscriptions.push({ dispose: () => watcher.close() });
    }
    else {
        output.appendLine("⚠️ No .git/logs/HEAD found — Git not initialized?");
    }
}
// ----------------------------------------------------------------------
// STEP 1 — GET GIT DIFF
// ----------------------------------------------------------------------
async function getGitDiff() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder open in VS Code");
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    return new Promise((resolve, reject) => {
        cp.exec("git diff HEAD~1 HEAD", { cwd: workspacePath }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`❌ Git diff failed in ${workspacePath}: ${stderr || error.message}`));
                return;
            }
            if (!stdout.trim()) {
                resolve("⚠️ No differences found between last two commits.");
            }
            else {
                resolve(stdout);
            }
        });
    });
}
// ----------------------------------------------------------------------
// STEP 2 — BACKEND REVIEW CALL
// ----------------------------------------------------------------------
//orgId =1 for ctpl by default ....another way to take organisation name from user
async function getBackendReview(diff) {
    const backendUrl = "http://localhost:5142/api/review/analyze";
    const ID = 1;
    try {
        const res = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: diff, orgId: ID }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Backend error: ${res.status} - ${text}`);
        }
        const data = await res.json();
        return data?.result || "⚠️ No review content received.";
    }
    catch (err) {
        return `❌ Backend API Error: ${err.message}`;
    }
}
// ----------------------------------------------------------------------
// STEP 3 — MAIN AI REVIEW LOGIC
// ----------------------------------------------------------------------
async function runAIReview(output) {
    output.appendLine("🤖 Starting AI Code Review...");
    ProjectLogger_1.ProjectLogger.log("Starting AI code Reviewer!");
    const diff = await getGitDiff();
    if (!diff || diff.includes("Error")) {
        output.appendLine(diff);
        return diff;
    }
    output.appendLine("📤 Sending diff to backend...");
    let review = await getBackendReview(diff);
    review = review
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .trim();
    output.appendLine("\n🧠 Gemini Review Result:");
    output.appendLine("────────────────────────────");
    output.appendLine(review || "⚠️ No review received.");
    output.appendLine("────────────────────────────");
    return review;
}
// ----------------------------------------------------------------------
// STEP 4 — DEACTIVATE
// ----------------------------------------------------------------------
function deactivate() {
    ProjectLogger_1.ProjectLogger.log("🛑 Extension deactivated");
    console.log("🛑 Extension Deactivated");
}
function captureGitLogsOnStart() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        ProjectLogger_1.ProjectLogger.log("⚠️ No workspace folder — Git logs not captured.");
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    ProjectLogger_1.ProjectLogger.log("📥 Capturing Git logs on startup...");
    const gitCommand = 'git --no-pager log --pretty=format:"commit %H%nAuthor: %an <%ae>%nDate:   %ad%n%n    %s%n" --date=local -n 20';
    cp.exec(gitCommand, { cwd: workspacePath }, (err, stdout, stderr) => {
        if (err) {
            ProjectLogger_1.ProjectLogger.log(`❌ Git log error: ${err.message}`);
            return;
        }
        if (stderr && stderr.trim() !== "") {
            ProjectLogger_1.ProjectLogger.log(`⚠️ Git stderr: ${stderr}`);
        }
        if (stdout && stdout.trim() !== "") {
            ProjectLogger_1.ProjectLogger.log("📄 Git Logs (Clean Format):");
            ProjectLogger_1.ProjectLogger.log(stdout);
        }
        else {
            ProjectLogger_1.ProjectLogger.log("ℹ️ No Git logs found.");
        }
    });
}
//# sourceMappingURL=extension.js.map