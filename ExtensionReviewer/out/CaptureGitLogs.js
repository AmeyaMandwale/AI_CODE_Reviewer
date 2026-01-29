"use strict";
// const vscode = require("vscode");
// const path = require("path");
// const fs = require("fs");
// const { exec } = require("child_process");
// async function captureGitLogs() {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     console.log("⚠ No workspace folder found.");
//     return;
//   }
//   const workspacePath = workspaceFolders[0].uri.fsPath;
//   // exec("git log --stat", { cwd: workspacePath }, (err, stdout, stderr) => {
//   //   if (err) {
//   //     console.log("❌ Git log error:", err.message);
//   //     return;
//   //   }
//     const logFolder = path.join(workspacePath, ".aicodereview-logs");
//     if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);
//     const logPath = path.join(logFolder, "git-log.txt");
//     fs.writeFileSync(logPath, stdout);
//     console.log("📄 Git logs saved to:", logPath);
//   });
// }
// module.exports = { captureGitLogs };
//# sourceMappingURL=CaptureGitLogs.js.map