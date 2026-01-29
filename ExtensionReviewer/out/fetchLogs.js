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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLogsCommand = fetchLogsCommand;
exports.saveLogsToProject = saveLogsToProject;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
async function fetchLogsCommand(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('Open a workspace folder first.');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    // 1) Detect remote URL
    let remoteUrl = '';
    try {
        remoteUrl = cp.execSync('git config --get remote.origin.url', {
            cwd: workspacePath
        })
            .toString()
            .trim();
    }
    catch (e) {
        vscode.window.showErrorMessage('Failed to detect git remote. Make sure the project is a git repo with a remote.');
        return;
    }
    // Parse owner/repo from remote
    const parsed = parseGitHubRemote(remoteUrl);
    if (!parsed) {
        vscode.window.showErrorMessage('Unsupported remote URL: ' + remoteUrl);
        return;
    }
    const owner = parsed.owner;
    const repo = parsed.repo;
    // Detect current branch
    const branch = detectCurrentBranch(workspacePath) ?? 'main';
    // Backend URL (static or fetch from settings)
    const finalBackend = vscode.workspace.getConfiguration('ctpl').get('backendUrl') ??
        'http://localhost:5142';
    const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: `Fetching CI logs for ${owner}/${repo}@${branch}`,
        cancellable: false
    };
    await vscode.window.withProgress(progressOptions, async (progress) => {
        progress.report({ message: 'Requesting backend...' });
        // Call backend API
        const body = { owner, repo, branch };
        const res = await (0, node_fetch_1.default)("http://localhost:5142/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                owner: owner,
                repo: repo,
                branch: branch || "main"
            })
        });
        if (!res.ok) {
            // const err = await res.text();
            vscode.window.showErrorMessage("Backend error: " + res.status);
            return;
        }
        // ✅ FIX: Read body only once
        const logText = await res.text();
        // Save in project
        await saveLogsToProject(logText);
        progress.report({ message: 'Downloading logs...' });
        // Save logs
        const logPath = path.join(workspacePath, 'ci-logs.txt');
        try {
            fs.mkdirSync(path.dirname(logPath), { recursive: true });
            fs.appendFileSync(logPath, `\n--- fetched: ${new Date().toISOString()} ${owner}/${repo}@${branch} ---\n`);
            // Write logText instead of res.text() again
            fs.appendFileSync(logPath, logText + '\n');
            // Also append to extension log file
            vscode.window.showInformationMessage('CI logs fetched and appended to: ' + logPath);
        }
        catch (err) {
            throw new Error('Failed to write logs to disk: ' + err.message);
        }
    });
}
// ---- Helpers ----
function parseGitHubRemote(remote) {
    let m = /git@github.com:(.+?)\/(.+?)(.git)?$/.exec(remote);
    if (m)
        return {
            owner: m[1],
            repo: m[2].replace(/.git$/, '')
        };
    m =
        /https:\/\/github.com\/(.+?)\/(.+?)(.git)?$/.exec(remote);
    if (m)
        return {
            owner: m[1],
            repo: m[2].replace(/.git$/, '')
        };
    return null;
}
function detectCurrentBranch(cwd) {
    try {
        return cp
            .execSync('git rev-parse --abbrev-ref HEAD', { cwd })
            .toString()
            .trim();
    }
    catch {
        return null;
    }
}
async function saveLogsToProject(logText) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        vscode.window.showErrorMessage("No project folder found.");
        return;
    }
    const projectPath = folder.uri.fsPath;
    const logsFolder = path.join(projectPath, "ci-logs");
    fs.mkdirSync(logsFolder, { recursive: true });
    // ✅ Use a single fixed file instead of timestamp file
    const filePath = path.join(logsFolder, "github-ci-log.txt");
    // ✅ Create once, append later
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, logText + "\n", "utf-8");
    }
    else {
        fs.appendFileSync(filePath, logText + "\n", "utf-8");
    }
    vscode.window.showInformationMessage(`Logs saved to: ${filePath}`);
}
//# sourceMappingURL=fetchLogs.js.map