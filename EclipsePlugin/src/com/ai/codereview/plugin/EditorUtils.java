package com.ai.codereview.plugin;

import org.eclipse.ui.PlatformUI;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.IEditorPart;
import org.eclipse.ui.IWorkbenchWindow;

import org.eclipse.jface.text.ITextSelection;
import org.eclipse.ui.texteditor.ITextEditor;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.viewers.ISelectionProvider;

public class EditorUtils {

    public static String getSelectedCode() {

        try {
            IWorkbenchWindow window = PlatformUI.getWorkbench().getActiveWorkbenchWindow();
            if (window == null) return null;

            IWorkbenchPage page = window.getActivePage();
            if (page == null) return null;

            IEditorPart editor = page.getActiveEditor();
            if (editor == null) return null;

            // --------- CASE 1: Editor is a text editor ----------
            if (editor instanceof ITextEditor textEditor) {
                ISelectionProvider provider = textEditor.getSelectionProvider();
                if (provider == null) return null;

                ISelection sel = provider.getSelection();
                if (sel instanceof ITextSelection ts) {
                    return ts.getText();
                }
            }

            // --------- CASE 2: Fallback using global selection service ----------
            ISelection globalSel = window.getSelectionService().getSelection();
            if (globalSel instanceof ITextSelection ts2) {
                return ts2.getText();
            }

            return null;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
