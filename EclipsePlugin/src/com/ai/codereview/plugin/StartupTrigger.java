package com.ai.codereview.plugin;

import org.eclipse.ui.IStartup;
import org.eclipse.swt.widgets.Display;

public class StartupTrigger implements IStartup {

    @Override
    public void earlyStartup() {
        System.out.println("💡[AI Code Review] Plugin initializing...");

        // Initialize backend logic (e.g., Git listener)
        try {
            GitChangeListener.initialize();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // UI code must run on the UI thread safely
        Display.getDefault().asyncExec(() -> {
            System.out.println("🚀[AI Code Review] Plugin successfully loaded.");
        });
    }
}
