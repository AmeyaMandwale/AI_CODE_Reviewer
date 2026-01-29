import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class ProjectLogger {
  private static logFilePath: string = "";
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const root = workspaceFolders[0].uri.fsPath;

// SAVE EXTENSION LOGS in the SAME ci-logs folder
const logDir = path.join(root, "ci-logs");

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

this.logFilePath = path.join(logDir, "project-logs.log");

    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "📄 Project Log File Created\n\n");
    }

    // patch console
    this.patchConsole();
    this.log("🟢 Logger initialized");
  }

  private static patchConsole() {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args: any[]) => {
      this.log("[console.log] " + args.join(" "));
      origLog(...args);
    };
    console.warn = (...args: any[]) => {
      this.log("[console.warn] " + args.join(" "));
      origWarn(...args);
    };
    console.error = (...args: any[]) => {
      this.log("[console.error] " + args.join(" "));
      origError(...args);
    };
  }

  static log(msg: string) {
    if (!this.logFilePath) return;
    const line = `${new Date().toISOString()} - ${msg}\n`;
    fs.appendFileSync(this.logFilePath, line, "utf8");
  }

  static flushToDisk() {
    // already written to disk in appendFileSync, but can add extra flush message
    this.log("📄 Logs flushed manually");
    return this.logFilePath;
  }

  static getLogPath() {
    return this.logFilePath;
  }
}
