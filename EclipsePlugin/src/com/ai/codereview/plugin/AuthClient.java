package com.ai.codereview.plugin;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class AuthClient {

    public static String login(String email, String password) {
        try {
            URL url = new URL("http://localhost:5142/api/auth/login"); // <-- UPDATE THIS
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String json = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() == 200) {
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream()));
                String token = br.readLine();
                br.close();
                return token;
            }

            return null;

        } catch (Exception e) {
            return null;
        }
    }
}
