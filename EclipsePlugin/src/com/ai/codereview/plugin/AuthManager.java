package com.ai.codereview.plugin;

import org.eclipse.core.runtime.preferences.InstanceScope;
import org.osgi.service.prefs.Preferences;

public class AuthManager {

    private static final String NODE = "com.ai.codereview.plugin";
    private static final String KEY_TOKEN = "auth_token";

    public static void saveToken(String token) {
        Preferences prefs = InstanceScope.INSTANCE.getNode(NODE);
        prefs.put(KEY_TOKEN, token);
        try { prefs.flush(); } catch (Exception ignored) {}
    }

    public static String getToken() {
        Preferences prefs = InstanceScope.INSTANCE.getNode(NODE);
        return prefs.get(KEY_TOKEN, null);
    }

    public static boolean isLoggedIn() {
        return getToken() != null;
    }

    public static void clearToken() {
        Preferences prefs = InstanceScope.INSTANCE.getNode(NODE);
        prefs.remove(KEY_TOKEN);
        try { prefs.flush(); } catch (Exception ignored) {}
    }
}
