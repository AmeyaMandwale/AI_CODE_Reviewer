package com.ai.codereview.plugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.eclipse.core.resources.IProject;
import org.eclipse.core.runtime.IAdaptable;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.viewers.IStructuredSelection;
import org.eclipse.swt.widgets.Display;
import org.eclipse.ui.IWorkbenchWindow;
import org.eclipse.ui.PlatformUI;

/**
 * GitChangeListener
 * -----------------
 * - Detects active project
 * - Watches Git repo changes
 * - Runs AI review on commit
 * - Auto-switches when changing project
 */
public class GitChangeListener {

    private static GitChangeListener instance;

    private ExecutorService executor = Executors.newSingleThreadExecutor();
    private IProject currentProject = null;
    private boolean watcherStarted = false;
    private String activeGitPath = "None";

    /** Called from Activator.start() */
    public static void initialize() {
        if (instance == null) {
            instance = new GitChangeListener();
            instance.hookSelectionListener();
            instance.attachToInitialProject();
        }
    }

    public static void stopAll() {
        if (instance != null) {
            instance.stopWatcherInternal();
            instance.executor.shutdownNow();
            instance = null;
        }
    }

    public static String getActiveGitPath() {
        return (instance != null && instance.watcherStarted) ? instance.activeGitPath : "None";
    }

    // ----------------------------- PROJECT DETECTION -----------------------------

    private void hookSelectionListener() {
        Display.getDefault().asyncExec(() -> {
            IWorkbenchWindow window = PlatformUI.getWorkbench().getActiveWorkbenchWindow();
            if (window != null) {
                window.getSelectionService().addSelectionListener((part, selection) -> {
                    IProject selected = resolveProjectFromSelection(selection);
                    if (selected != null && !selected.equals(currentProject)) {
                        show("🎯 Project selected → " + selected.getName());
                        switchToProject(selected);
                    }
                });
            }
        });
    }

    private void attachToInitialProject() {
        IProject active = getActiveProjectFromUI();
        if (active != null) {
            show("📂 Initial active project → " + active.getName());
            switchToProject(active);
        } else {
            show("⚠️ No project selected initially. Select a project to start watching.");
        }
    }

    private void switchToProject(IProject project) {
        stopWatcherInternal();
        currentProject = project;
        watcherStarted = false;
        activeGitPath = "None";

        if (project == null || !project.isOpen()) {
            show("⚠️ Project is null or not open.");
            return;
        }

        File gitDir = new File(project.getLocation().toFile(), ".git");
        if (!gitDir.exists()) {
            show("⚠️ No Git repo found in project: " + project.getName());
            return;
        }

        activeGitPath = gitDir.getAbsolutePath();
        watcherStarted = true;

        show("📡 Watching Git repo: " + project.getName());
        show("🔍 Path: " + activeGitPath);
        show("🟢 Waiting for commits...");

        executor = Executors.newSingleThreadExecutor();
        startWatcher(gitDir.toPath());
    }

    private void stopWatcherInternal() {
        try {
            watcherStarted = false;
            activeGitPath = "None";
            executor.shutdownNow();
            show("⛔ Git watcher stopped.");
        } catch (Exception e) {
            show("⚠️ Error stopping watcher: " + e.getMessage());
        }
    }

    // ----------------------------- WATCHER LOGIC -----------------------------

    private void startWatcher(Path gitDir) {
        executor.submit(() -> {
            try {
                Path logsDir = gitDir.resolve("logs");
                Path headLogFile = logsDir.resolve("HEAD");
                Path headFile = gitDir.resolve("HEAD");

                // Prefer watching logs/HEAD (more reliable)
                boolean useLogs = Files.exists(headLogFile);
                Path watchDir = useLogs ? logsDir : headFile.getParent();

                // Detect branch file if logs not used
                Path refFile = headFile;
                if (!useLogs) {
                    String headContent = Files.readString(headFile).trim();
                    if (headContent.startsWith("ref:")) {
                        refFile = gitDir.resolve(headContent.substring(5).trim());
                    }
                }

                String watchedFileName = useLogs ? "HEAD" : refFile.getFileName().toString();

                WatchService watcher = FileSystems.getDefault().newWatchService();
                watchDir.register(watcher, StandardWatchEventKinds.ENTRY_MODIFY);

                show("👀 Monitoring: " + watchDir.toString() + " → " + watchedFileName);
                show(useLogs ? "🧠 Tracking via logs/HEAD" : "📡 Tracking via refs directory");

                while (!Thread.currentThread().isInterrupted()) {
                    WatchKey key = watcher.take();
                    for (WatchEvent<?> event : key.pollEvents()) {
                        if (event.context().toString().contains(watchedFileName)) {
                            Thread.sleep(500); // Wait for Git to complete writing
                            handleCommit(gitDir.toFile());
                        }
                    }
                    key.reset();
                }
                watcher.close();

            } catch (InterruptedException ie) {
                show("ℹ️ Watcher stopped (interrupted).");
            } catch (Exception e) {
                show("❌ Watcher error: " + e.getMessage());
            }
        });
    }

    // ----------------------------- COMMIT HANDLER -----------------------------

    private void handleCommit(File gitDir) {
        if (!AuthManager.isLoggedIn()) {
            show("🔒 Login required to run AI Code Review.");
            return;
        }

        try {
            Repository repo = new FileRepositoryBuilder()
                    .setGitDir(gitDir)
                    .build();

            try (Git git = new Git(repo)) {
                ObjectId head = repo.resolve("HEAD^{tree}");
                ObjectId prevHead = repo.resolve("HEAD~1^{tree}");

                if (head == null || prevHead == null) {
                    show("⚠️ Not enough commits to generate diff.");
                    return;
                }

                ByteArrayOutputStream out = new ByteArrayOutputStream();
                try (DiffFormatter df = new DiffFormatter(out)) {
                    df.setRepository(repo);
                    df.format(prevHead, head);
                }

                String diff = out.toString(StandardCharsets.UTF_8);
                if (diff.isBlank()) {
                    show("📭 Empty commit — no changes to review.");
                    return;
                }

                GitDiffProvider.setLastDiff(diff);
                show("📜 Commit detected → sending to AI...");
                show("⏳ Analyzing...");

                String response = AIClient.sendReview(diff);
                show("🤖 Review Result:\n" + response);
            }

        } catch (Exception e) {
            show("❌ Error processing commit: " + e.getMessage());
        }
    }

    // ----------------------------- PROJECT RESOLUTION -----------------------------

    private IProject getActiveProjectFromUI() {
        try {
            IWorkbenchWindow window = PlatformUI.getWorkbench().getActiveWorkbenchWindow();
            if (window != null) {
                ISelection selection = window.getSelectionService().getSelection();
                return resolveProjectFromSelection(selection);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private IProject resolveProjectFromSelection(ISelection selection) {
        if (selection instanceof IStructuredSelection) {
            Object element = ((IStructuredSelection) selection).getFirstElement();
            if (element instanceof IProject) return (IProject) element;
            if (element instanceof IAdaptable) return ((IAdaptable) element).getAdapter(IProject.class);
        }
        return null;
    }

    // ----------------------------- LOGGING -----------------------------

    private void show(String message) {
        Display.getDefault().asyncExec(() -> ReviewConsole.show(message));
    }
}
