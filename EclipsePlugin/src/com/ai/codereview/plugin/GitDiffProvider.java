package com.ai.codereview.plugin;

public class GitDiffProvider {

    private static String lastDiff;

    public static void setLastDiff(String diff) {
        lastDiff = diff;
    }

    public static String getLastDiff() {
        return lastDiff;
    }
}
