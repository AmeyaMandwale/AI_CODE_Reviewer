package com.ai.codereview.plugin;

import org.eclipse.swt.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.layout.*;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.ui.PlatformUI;
import org.eclipse.ui.IWorkbenchPage;

public class LoginPanel {

    public static void showLoginForm(Shell parent) {

        Shell loginShell = new Shell(parent, SWT.DIALOG_TRIM | SWT.APPLICATION_MODAL);
        loginShell.setText("Login");
        loginShell.setLayout(new GridLayout(2, false));

        new Label(loginShell, SWT.NONE).setText("Email:");
        Text emailTxt = new Text(loginShell, SWT.BORDER);
        emailTxt.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        new Label(loginShell, SWT.NONE).setText("Password:");
        Text passTxt = new Text(loginShell, SWT.BORDER | SWT.PASSWORD);
        passTxt.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        Button loginBtn = new Button(loginShell, SWT.PUSH);
        loginBtn.setText("Login");
        loginBtn.setLayoutData(new GridData(SWT.CENTER, SWT.CENTER, true, false, 2, 1));

        loginBtn.addListener(SWT.Selection, e -> {
            String email = emailTxt.getText().trim();
            String pass = passTxt.getText().trim();

            String token = AuthClient.login(email, pass);

            if (token == null) {
                MessageDialog.openError(
                        loginShell,       // use loginShell, not parent
                        "Login Failed",
                        "Invalid email or password."
                );
                return;
            }

            // Save token
            AuthManager.saveToken(token);

            // Show success message
            MessageDialog.openInformation(
                    loginShell,
                    "Login Success",
                    "🔐 Login Successful!"
            );

            // --- Notify AIReviewPanel (UI thread safe) ---
            Display.getDefault().asyncExec(() -> {
                try {
                    IWorkbenchPage page = PlatformUI.getWorkbench()
                            .getActiveWorkbenchWindow()
                            .getActivePage();

                    if (page != null) {
                        var view = page.findView(AIReviewPanel.ID);
                        if (view instanceof AIReviewPanel panel) {
                            panel.refreshAfterLogin();   // 🔥 instant refresh
                        }
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            });

            // close login window
            loginShell.close();
        });

        loginShell.setSize(350, 200);
        loginShell.open();
    }
}
