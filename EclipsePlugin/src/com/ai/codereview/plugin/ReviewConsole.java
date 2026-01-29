package com.ai.codereview.plugin;

import org.eclipse.ui.console.*;
import org.eclipse.swt.widgets.Display;
import org.eclipse.ui.PlatformUI;

public class ReviewConsole {

    private static MessageConsole console;
    private static StringBuilder logBuffer = new StringBuilder();

    private static MessageConsole getConsole() {
        if (console == null) {
            console = new MessageConsole("AI Code Review", null);
            ConsolePlugin.getDefault().getConsoleManager().addConsoles(new IConsole[]{console});
        }
        return console;
    }

    public static void show(String message) {

        synchronized (logBuffer) {
            logBuffer.append(message).append("\n");
        }

        Display.getDefault().asyncExec(() -> {

            // Write to Eclipse console
            try {
                MessageConsoleStream out = getConsole().newMessageStream();
                out.println(message);
                out.close();
            } catch (Exception ignored) {}

            // Write to AI panel
            try {
                AIReviewPanel panel = (AIReviewPanel) PlatformUI.getWorkbench()
                        .getActiveWorkbenchWindow()
                        .getActivePage()
                        .showView(AIReviewPanel.ID);

                panel.addMessage(message);
            } catch (Exception ignored) {}
        });
    }

    public static String getLogHistory() {
        return logBuffer.toString();
    }

    public static void clearHistory() {
        logBuffer.setLength(0);
    }

    public static void clearConsoleView() {
        getConsole().clearConsole();
    }
}
