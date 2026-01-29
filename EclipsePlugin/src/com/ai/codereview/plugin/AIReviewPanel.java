package com.ai.codereview.plugin;

import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.graphics.Resource;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.ui.part.ViewPart;

public class AIReviewPanel extends ViewPart {

    public static final String ID = "com.ai.codereview.plugin.aiReviewPanel";

    private Text outputBox;
    private Button loginBtn, logoutBtn, clearBtn, generateTCBtn, validateTCBtn, pushTCBtn;
    private String lastGeneratedTestCase = null;

    // Theme resources (disposed in dispose())
    private Color bgDark, bgCard, textColor, btnBlue, btnRed, btnGray;
    private Font titleFont, outputFont;

    @Override
    public void createPartControl(Composite parent) {
        try {
            Display display = parent.getDisplay();
            createTheme(display);

            parent.setBackground(bgDark);
            parent.setLayout(new GridLayout(1, false));

            // PANEL CONTAINER
            Composite card = new Composite(parent, SWT.NONE);
            card.setBackground(bgCard);
            card.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));

            GridLayout cardLayout = new GridLayout(1, false);
            cardLayout.marginWidth = 15;
            cardLayout.marginHeight = 15;
            cardLayout.verticalSpacing = 10;
            card.setLayout(cardLayout);

            // PANEL TITLE
            Label title = new Label(card, SWT.NONE);
            title.setText("🤖 AI Review Panel");
            title.setForeground(textColor);
            title.setBackground(bgCard);
            title.setFont(titleFont);

            // BUTTON BAR
            Composite btnBar = new Composite(card, SWT.NONE);
            btnBar.setBackground(bgCard);
            RowLayout row = new RowLayout();
            row.spacing = 8;
            row.wrap = true;
            btnBar.setLayout(row);
            btnBar.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

            // LOGIN BUTTON
            loginBtn = createButton(btnBar, "Login", btnBlue, e -> {
                LoginPanel.showLoginForm(parent.getShell());
                refreshAfterLogin();
            });

            // LOGOUT BUTTON
            logoutBtn = createButton(btnBar, "Logout", btnRed, e -> {
                AuthManager.clearToken();
                ReviewConsole.clearHistory();
                ReviewConsole.clearConsoleView();
                outputBox.setText("");
                MessageDialog.openInformation(parent.getShell(), "Logout", "🔓 Logged Out Successfully!");
                refreshAfterLogin();
            });
            logoutBtn.setVisible(false);

            // CLEAR LOGS
            clearBtn = createButton(btnBar, "Clear Logs", btnGray, e -> {
                ReviewConsole.clearHistory();
                ReviewConsole.clearConsoleView();
                outputBox.setText("");
                MessageDialog.openInformation(parent.getShell(), "Logs Cleared", "🧹 All logs cleared successfully.");
            });

            // GENERATE TEST
            generateTCBtn = createButton(btnBar, "Generate Test", btnBlue, e -> {
                String diff = GitDiffProvider.getLastDiff();
                if (diff == null || diff.trim().isEmpty()) {
                    MessageDialog.openError(parent.getShell(), "Error", "❌ No git diff found. Commit first!");
                    return;
                }
                ReviewConsole.show("🧪 Generating test case...");
                lastGeneratedTestCase = TestClient.generateTestCaseFromDiff(diff);

                if (lastGeneratedTestCase == null) {
                    ReviewConsole.show("❌ Failed to generate test case.");
                } else {
                    ReviewConsole.show("🧪 Test Generated:\n" + lastGeneratedTestCase);
                    validateTCBtn.setVisible(true);
                    pushTCBtn.setVisible(false);
                }
                btnBar.layout(true, true);
            });

            // VALIDATE TEST
            validateTCBtn = createButton(btnBar, "Validate Test", btnBlue, e -> {
                if (TestClient.validateTestCase(lastGeneratedTestCase)) {
                    ReviewConsole.show("✅ Test case validated!");
                    pushTCBtn.setVisible(true);
                } else {
                    MessageDialog.openError(parent.getShell(), "Validation Failed", "❌ Test case invalid.");
                }
                btnBar.layout(true, true);
            });
            validateTCBtn.setVisible(false);

            // PUSH TEST
            pushTCBtn = createButton(btnBar, "Push Test", btnBlue, e -> {
                if (TestFileWriter.pushTestCase(lastGeneratedTestCase)) {
                    MessageDialog.openInformation(parent.getShell(), "Success", "📁 Test saved to /test folder.");
                } else {
                    MessageDialog.openError(parent.getShell(), "Error", "❌ Failed to save test case.");
                }
            });
            pushTCBtn.setVisible(false);

            // OUTPUT BOX
            outputBox = new Text(card, SWT.MULTI | SWT.V_SCROLL | SWT.H_SCROLL | SWT.BORDER | SWT.READ_ONLY);
            outputBox.setBackground(bgDark);
            outputBox.setForeground(textColor);
            outputBox.setFont(outputFont);
            outputBox.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));

            // Initialize UI
            refreshAfterLogin();
            refreshLogHistory();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Create button with style
    private Button createButton(Composite parent, String text, Color bg, Listener listener) {
        Button btn = new Button(parent, SWT.PUSH);
        btn.setText(text);
        btn.setBackground(bg);
        btn.setForeground(textColor);
        btn.addListener(SWT.Selection, listener);
        return btn;
    }

    public void refreshAfterLogin() {
        Display.getDefault().asyncExec(() -> {
            boolean loggedIn = AuthManager.isLoggedIn();

            if (loginBtn != null) loginBtn.setVisible(!loggedIn);
            if (logoutBtn != null) logoutBtn.setVisible(loggedIn);

            if (outputBox != null) refreshLogHistory();
            if (outputBox != null && !outputBox.getParent().isDisposed()) {
                outputBox.getParent().layout(true, true);
            }
        });
    }

    private void refreshLogHistory() {
        if (outputBox != null && !outputBox.isDisposed()) {
            String history = ReviewConsole.getLogHistory();
            outputBox.setText((history == null || history.isBlank())
                    ? "Waiting for commits or actions..."
                    : history);
        }
    }

    public void addMessage(String msg) {
        Display.getDefault().asyncExec(() -> {
            if (outputBox != null && !outputBox.isDisposed()) {
                outputBox.append(msg + "\n");
                outputBox.setTopIndex(outputBox.getLineCount() - 1);
            }
        });
    }

    @Override
    public void setFocus() {
        if (outputBox != null) {
            outputBox.setFocus();
        }
    }

    private void createTheme(Display display) {
        bgDark = new Color(display, 28, 28, 30);
        bgCard = new Color(display, 40, 40, 43);
        textColor = new Color(display, 235, 235, 235);
        btnBlue = new Color(display, 0, 120, 215);
        btnRed = new Color(display, 200, 50, 50);
        btnGray = new Color(display, 80, 80, 80);

        titleFont = new Font(display, "Segoe UI", 13, SWT.BOLD);
        outputFont = new Font(display, "Segoe UI", 10, SWT.NORMAL);
    }

    @Override
    public void dispose() {
        disposeSafely(bgDark);
        disposeSafely(bgCard);
        disposeSafely(textColor);
        disposeSafely(btnBlue);
        disposeSafely(btnRed);
        disposeSafely(btnGray);
        disposeSafely(outputFont);
        disposeSafely(titleFont);

        super.dispose();
    }

    private void disposeSafely(Resource res) {
        if (res != null && !res.isDisposed()) {
            res.dispose();
        }
    }
}
