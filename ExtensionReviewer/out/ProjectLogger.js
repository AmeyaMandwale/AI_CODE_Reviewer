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
exports.ProjectLogger = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectLogger {
    static init() {
        if (this.initialized)
            return;
        this.initialized = true;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        const root = workspaceFolders[0].uri.fsPath;
        // SAVE EXTENSION LOGS in the SAME ci-logs folder
        const logDir = path.join(root, "ci-logs");
        if (!fs.existsSync(logDir))
            fs.mkdirSync(logDir, { recursive: true });
        this.logFilePath = path.join(logDir, "project-logs.log");
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, "📄 Project Log File Created\n\n");
        }
        // patch console
        this.patchConsole();
        this.log("🟢 Logger initialized");
    }
    static patchConsole() {
        const origLog = console.log;
        const origWarn = console.warn;
        const origError = console.error;
        console.log = (...args) => {
            this.log("[console.log] " + args.join(" "));
            origLog(...args);
        };
        console.warn = (...args) => {
            this.log("[console.warn] " + args.join(" "));
            origWarn(...args);
        };
        console.error = (...args) => {
            this.log("[console.error] " + args.join(" "));
            origError(...args);
        };
    }
    static log(msg) {
        if (!this.logFilePath)
            return;
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
exports.ProjectLogger = ProjectLogger;
ProjectLogger.logFilePath = "";
ProjectLogger.initialized = false;
//# sourceMappingURL=ProjectLogger.js.map