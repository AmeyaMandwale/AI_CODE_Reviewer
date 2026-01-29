package com.ai.codereview.plugin;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class TestClient {

    // MUST match your backend API
    private static final String BASE = "http://127.0.0.1:5142/api/test/";

    /**
     * Generate test cases from Git diff SOURCE CODE.
     * Backend expects:
     * POST /api/test/generate
     * { "code": "..." }
     */
    public static String generateTestCaseFromDiff(String diff) {

        String escaped = escape(diff);
        String json = "{\"code\":\"" + escaped + "\"}";

        System.out.println("======= RAW DIFF =======");
        System.out.println(diff);

        System.out.println("======= ESCAPED DIFF =======");
        System.out.println(escaped);

        System.out.println("======= FINAL JSON SENT =======");
        System.out.println(json);

        return postJson("generate", json);
    }

    /**
     * Generate test case from editor code (optional)
     */
//    public static String generateTestCase(String code) {
//        return postJson("generate", "{\"req\":\"" + escape(code) + "\"}");
//    }

    /**
     * Validate generated tests
     * Backend expects:
     * POST /api/test/validate	
     * { "tests": "..." }
     */
    public static boolean validateTestCase(String testCase) {

        String json = "{\"tests\":\"" + escape(testCase) + "\"}";

        String res = postJson("validate", json);

        if (res == null) return false;

        System.out.println("VALIDATE RESPONSE:");
        System.out.println(res);

        // Backend returns:
        // { "result": "✅ Follows" }
        // or
        // { "result": "❌ Does Not Follow - reason..." }

        if (res.contains("✅")) return true;   // validation success
        return false;                         // validation failed
    }


    /**
     * Shared POST request handler
     */
    private static String postJson(String endpoint, String body) {

        HttpURLConnection conn = null;

        try {
            URL url = new URL(BASE + endpoint);
            conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("POST");
            conn.setDoOutput(true);

            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");

            // Include auth token from Login
            String token = AuthManager.getToken();
            if (token != null) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }

            // Send JSON body
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            int status = conn.getResponseCode();

            // Read API response
            InputStream is = status == 200 ? conn.getInputStream() : conn.getErrorStream();
            if (is == null) return null;

            BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;

            while ((line = br.readLine()) != null) {
                sb.append(line);
            }

            br.close();
            return sb.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return null;

        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /**
     * Escape text for JSON safety
     */
    private static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();

        for (char c : s.toCharArray()) {
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"': sb.append("\\\""); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int)c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

}
