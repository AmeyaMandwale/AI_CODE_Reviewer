package com.ai.codereview.plugin;

import org.eclipse.swt.widgets.Display;
import org.eclipse.ui.plugin.AbstractUIPlugin;
import org.osgi.framework.BundleContext;

/**
 * Activator
 * ---------
 * Entry point for Eclipse plugin.
 * Login is handled inside the AI Review Panel.
 * Plugin should NOT show login popup here.
 */
public class Activator extends AbstractUIPlugin {

    public static final String PLUGIN_ID = "com.ai.codereview.plugin";
    private static Activator plugin;

    @Override
    public void start(BundleContext context) throws Exception {
        super.start(context);
        plugin = this;

        System.out.println("🚀 Activator.start() triggered at: " + System.currentTimeMillis());
        System.out.println("⚙️ Initializing AI Code Review Plugin...");

        ReviewConsole.show("🚀 CTPL Code Review Plugin started.");
        ReviewConsole.show("👉 Please login using the Login button inside the AI Review Panel.");

        // 🟡 Ensure UI is ready before starting watchers
        Display.getDefault().asyncExec(() -> {
            try {
                GitChangeListener.initialize(); // 🔹 Correct method
                ReviewConsole.show("🟢 Git listener initialized successfully!");
                ReviewConsole.show("📡 Waiting for commits...");
                ReviewConsole.show("📌 If repository not detected, select project in Package Explorer.");
            } catch (Exception e) {
                ReviewConsole.show("❌ Failed to initialize Git watcher: " + e.getMessage());
            }
        });
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        System.out.println("🛑 Stopping AI Code Review Plugin...");
        ReviewConsole.show("🛑 Stopping AI Code Review Plugin...");

        // 🔹 Stop all watchers safely
        GitChangeListener.stopAll();

        plugin = null;
        super.stop(context);
    }

    public static Activator getDefault() {
        return plugin;
    }
}
