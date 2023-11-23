import * as OBC from "openbim-components";

/**
 * ToolBar Function
 *
 * This function creates and configures a toolbar for the OpenBIM-Components application.
 * It adds various UI elements related to IFC loading, fragment management, properties processing,
 * model tree navigation, and fragment caching to the main toolbar.
 *
 * @param {Object} components - An object containing references to different components.
 * @param {Object} ifcLoader - The OpenBIM-Components IFC loader component.
 * @param {Object} fragmentsManager - The OpenBIM-Components fragment manager component.
 * @param {Object} propertiesProcessor - The OpenBIM-Components properties processor component.
 * @param {Object} modelTree - The OpenBIM-Components model tree component.
 * @param {Object} cacher - The OpenBIM-Components fragment cacher component.
 */
export const ToolBar = (
  components,
  ifcLoader,
  fragmentsManager,
  propertiesProcessor,
  modelTree,
  cacher
) => {
  // Create a new toolbar
  const mainToolbar = new OBC.Toolbar(components);

  // Add UI elements to the main toolbar
  mainToolbar.addChild(
    ifcLoader.uiElement.get("main"),
    fragmentsManager.uiElement.get("main"),
    propertiesProcessor.uiElement.get("main"),
    modelTree.uiElement.get("main"),
    cacher.uiElement.get("main")
  );

  // Add the toolbar to the UI
  components.ui.addToolbar(mainToolbar);
};
