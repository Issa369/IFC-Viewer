import * as OBC from "openbim-components";

/**
 * ToolBar Function
 *
 * This function creates and configures a toolbar for the OpenBIM-Components application.
 * It adds various UI elements related to IFC loading, fragment management, properties processing and
 * model tree navigation to the main toolbar.
 *
 * @param {Object} components - An object containing references to different components.
 * @param {Object} ifcLoader - The OpenBIM-Components IFC loader component.
 * @param {Object} fragmentsManager - The OpenBIM-Components fragment manager component.
 * @param {Object} propertiesProcessor - The OpenBIM-Components properties processor component.
 * @param {Object} mainToolbar - The main toolbar component. 
 */
export const ToolBar = (
  components,
  ifcLoader,
  fragmentsManager,
  propertiesProcessor,
  mainToolbar
) => {
  // Add UI elements to the main toolbar
  mainToolbar.addChild(
    ifcLoader.uiElement.get("main"),
    fragmentsManager.uiElement.get("main"),
    propertiesProcessor.uiElement.get("main")
  );

  // Add the toolbar to the UI
  components.ui.addToolbar(mainToolbar);
};
