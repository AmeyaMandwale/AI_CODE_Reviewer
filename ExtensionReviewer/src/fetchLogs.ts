import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import fetch, { Headers, Request, Response } from "node-fetch"; 

export async function fetchLogsCommand(context: vscode.ExtensionContext) {

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
    } catch (e) {
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
    const finalBackend =
        vscode.workspace.getConfiguration('ctpl').get<string>('backendUrl') ??
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

        const res = await fetch("http://localhost:5142/api/logs", {
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
        const logPath = path.join(
             workspacePath,
            'ci-logs.txt'
        );

        try {
            fs.mkdirSync(path.dirname(logPath), { recursive: true });

            fs.appendFileSync(
                logPath,
                `\n--- fetched: ${new Date().toISOString()} ${owner}/${repo}@${branch} ---\n`
            );

            // Write logText instead of res.text() again
            fs.appendFileSync(logPath, logText + '\n');

            // Also append to extension log file

            vscode.window.showInformationMessage(
                'CI logs fetched and appended to: ' + logPath
            );
        } catch (err: any) {
            throw new Error('Failed to write logs to disk: ' + err.message);
        }
    });
}

// ---- Helpers ----

function parseGitHubRemote(remote: string): { owner: string; repo: string } | null {
    let m =
        /git@github.com:(.+?)\/(.+?)(.git)?$/.exec(remote);
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

function detectCurrentBranch(cwd: string): string | null {
    try {
        return cp
            .execSync('git rev-parse --abbrev-ref HEAD', { cwd })
            .toString()
            .trim();
    } catch {
        return null;
    }
}

export async function saveLogsToProject(logText: string) {
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
    } else {
        fs.appendFileSync(filePath, logText + "\n", "utf-8");
    }

    vscode.window.showInformationMessage(`Logs saved to: ${filePath}`);
}

