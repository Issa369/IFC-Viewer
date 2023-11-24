import * as OBC from "openbim-components";
import { ToolBar } from "./ToolBar";

/**
 * IFChandler Function
 *
 * This function handles the initialization and configuration of various OpenBIM-Components
 * to visualize and interact with IFC models.
 *
 * @param {Object} components - An object containing references to different components.
 * @param {HTMLElement} container - The HTML container element to which the 3D scene will be appended.
 */
export const IFChandler = async (components, container) => {
  // Initialize OpenBIM-Components
  const classifier = new OBC.FragmentClassifier(components);
  const propertiesProcessor = new OBC.IfcPropertiesProcessor(components);
  const mainToolbar = new OBC.Toolbar(components);
  const modelTree = new OBC.FragmentTree(components);
  const fragmentsManager = new OBC.FragmentManager(components);
  const ifcLoader = new OBC.FragmentIfcLoader(components);

  // Configure settings for the IFC loader
  ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
  ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

  // Initialize and set up the fragment highlighter
  const highlighter = new OBC.FragmentHighlighter(components);
  highlighter.setup();

  // Enable outlines in the renderer's postproduction effects
  components.renderer.postproduction.customEffects.outlineEnabled = true;
  highlighter.outlinesEnabled = true;

  // Event handler when an IFC model is loaded (executed after a successful IFC file import)
  ifcLoader.onIfcLoaded.add(async (model) => {
    // Clear existing highlights to prepare for the new model
    await highlighter.clear();

    // Dispose of the current model tree UI element to make way for the new one
    await modelTree.uiElement.dispose();

    // Initialize the model tree with the newly added model
    await modelTree.init();

    // Classify and categorize the loaded model by UUID, storey, and entity
    classifier.byModel(model.uuid, model);
    classifier.byStorey(model);
    classifier.byEntity(model);

    // Update the model tree with the new classification data
    modelTree.update(["model", "storeys", "entities"]);

    // Add the model tree UI element to the main toolbar
    mainToolbar.addChild(modelTree.uiElement.get("main"));

    // Update the highlighter to trigger the customer effects
    highlighter.update();
  });

  // Event handler for model tree selection
  modelTree.onSelected.add(async (filter) => {
    highlighter.highlightByID("select", filter, true, true);
  });

  highlighter.events.select.onHighlight.add((selection) => {
    // When an item is highlighted, retrieve its fragment and express ID
    const fragmentID = Object.keys(selection)[0];
    const expressID = Number([...selection[fragmentID]][0]);

    let model;

    // Find the model associated with the highlighted fragment
    for (const group of fragmentsManager.groups) {
      const fragmentFound = Object.values(group.keyFragments).find(
        (id) => id === fragmentID
      );

      if (fragmentFound) model = group;
    }

    // Process and render properties for the selected fragment
    propertiesProcessor.process(model);
    propertiesProcessor.renderProperties(model, expressID);
  });

  // Event handler for clearing selection highlights
  highlighter.events.select.onClear.add(() => {
    // When the selection is cleared, clean up the displayed properties
    propertiesProcessor.cleanPropertiesList();
  });

  // Event handler for handling double-click highlighting
  const highlightOnDoubleClick = (highlighter) => {
    highlighter.zoomToSelection = true;
    highlighter.highlight("select", true);
    highlighter.zoomToSelection = false;
  };

  // Event listener for double-click functionality
  container.addEventListener("dblclick", () =>
    highlightOnDoubleClick(highlighter)
  );

  // Initialize and set up the toolbar
  ToolBar(
    components,
    ifcLoader,
    fragmentsManager,
    propertiesProcessor,
    mainToolbar
  );
};
