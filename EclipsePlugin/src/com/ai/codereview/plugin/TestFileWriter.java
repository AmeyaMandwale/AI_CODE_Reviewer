package com.ai.codereview.plugin;

import java.io.File;
import java.io.FileWriter;

import org.eclipse.core.resources.*;
import org.eclipse.core.runtime.*;

public class TestFileWriter {

    public static boolean pushTestCase(String content) {
        try {
            IProject project = ResourcesPlugin.getWorkspace()
                    .getRoot().getProjects()[0];

            File testDir = new File(project.getLocation().toFile(), "test");

            if (!testDir.exists()) testDir.mkdir();

            File testFile = new File(testDir, "GeneratedTest.java");

            try (FileWriter fw = new FileWriter(testFile)) {
                fw.write(content);
            }

            project.refreshLocal(IResource.DEPTH_INFINITE, null);

            ReviewConsole.show("📁 Test case saved: " + testFile.getAbsolutePath());
            return true;

        } catch (Exception e) {
            ReviewConsole.show("❌ Failed to save test case: " + e.getMessage());
            return false;
        }
    }
}
