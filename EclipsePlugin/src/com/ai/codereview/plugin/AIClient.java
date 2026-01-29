package com.ai.codereview.plugin;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class AIClient {

    // Set to true while debugging to print more info to console
    private static final boolean DEBUG = true;

    public static String sendReview(String diff) {
        HttpURLConnection conn = null;
        final String backend = "http://127.0.0.1:5142/api/review/analyze";

        try {
            ReviewConsole.show("Waiting for Response!");
            URL url = new URL(backend);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");

            // Timeouts
            //conn.setConnectTimeout(10_000); // 10s
            //conn.setReadTimeout(30_000);    // 30s
            // Headers
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setDoInput(true);

            // Build JSON payload safely
            String safeDiff = escapeJson(diff);
            // By default orgID=1 for ctpl
            int orgId = 1;
            String json = "{\"code\":\"" + safeDiff + "\", \"orgId\": " + orgId + "}";
            // String json = "{\"code\":\"" + safeDiff + "\"}";
            byte[] payload = json.getBytes(StandardCharsets.UTF_8);
            conn.setRequestProperty("Content-Length", String.valueOf(payload.length));

            if (DEBUG) {
                System.out.println("=== AIClient sending request ===");
                System.out.println("URL: " + backend);
                System.out.println("Headers:");
                conn.getRequestProperties().forEach((k, v) -> System.out.println(k + ": " + v));
                System.out.println("Body: " + json);
            }

            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload);
                os.flush();
            }

            int responseCode = conn.getResponseCode();

            // Prefer input stream for success, error stream otherwise; handle null error stream
            InputStream is = null;
            if (responseCode >= 200 && responseCode < 300) {
                is = conn.getInputStream();
            } else {
                is = conn.getErrorStream();
                if (is == null) {
                    // Sometimes errorStream is null; try inputStream as fallback
                    try {
                        is = conn.getInputStream();
                    } catch (IOException ignored) {
                        // leave is null and handle later
                    }
                }
            }

            String responseBody = "";
            if (is != null) {
                try (BufferedReader in = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) {
                        sb.append(line).append('\n');
                    }
                    // trim trailing newline
                    responseBody = sb.toString().trim();
                }
            } else {
                responseBody = "(no response body available)";
            }

            if (DEBUG) {
                System.out.println("Response code: " + responseCode);
                System.out.println("Response body: " + responseBody);
            }

            return "[AI Review] Response (" + responseCode + "): " + responseBody;

        } catch (Exception e) {
            // log full stacktrace for debugging
            if (DEBUG) {
                e.printStackTrace();
            }
            return "[AI Review] ❌ Error: " + e.getClass().getSimpleName() + " - " + e.getMessage();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /**
     * Escape a string for inclusion as a JSON string value. Handles common
     * control characters and non-printable chars.
     */
    private static String escapeJson(String str) {
        if (str == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(str.length() + 16);
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    // escape non-printable characters
                    if (c < 0x20 || c > 0x7E) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}
