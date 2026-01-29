package com.ai.codereview.plugin;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.PlatformUI;

public class OpenPanelHandler extends AbstractHandler {

    @Override
    public Object execute(ExecutionEvent event) throws ExecutionException {
        try {
            IWorkbenchPage page = PlatformUI.getWorkbench()
                    .getActiveWorkbenchWindow()
                    .getActivePage();

            // showView will open the view and bring it to front
            page.showView(AIReviewPanel.ID);
        } catch (Exception e) {
            // print to error log if something goes wrong
            e.printStackTrace();
        }
        return null;
    }
}
