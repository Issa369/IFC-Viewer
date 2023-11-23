import * as OBC from "openbim-components";
import { ToolBar } from "./ToolBar";

/**
 * IFChandler Function
 *
 * This function handles the initialization and configuration of various OpenBIM-Components
 * to visualize and interact with IFC (Industry Foundation Classes) models.
 *
 * @param {Object} components - An object containing references to different components.
 * @param {HTMLElement} container - The HTML container element to which the 3D scene will be appended.
 */
export const IFChandler = async (components, container) => {
  // Initialize OpenBIM-Components
  const cacher = new OBC.FragmentCacher(components);
  const classifier = new OBC.FragmentClassifier(components);
  const propertiesProcessor = new OBC.IfcPropertiesProcessor(components);

  // Initialize and set up the model tree
  const modelTree = new OBC.FragmentTree(components);
  await modelTree.init();

  // Initialize fragments manager and IFC loader
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

  // Event handler when an IFC model is loaded ( gets executed after a successfull file import only )
  ifcLoader.onIfcLoaded.add(async (model) => {
    // Process IFC model properties
    propertiesProcessor.process(model);

    // Event handler for rendering properties of the selected fragment
    highlighter.events.select.onHighlight.add((selection) => {
      const fragmentID = Object.keys(selection)[0];
      const expressID = Number([...selection[fragmentID]][0]);
      propertiesProcessor.renderProperties(model, expressID);
    });

    // Applies the effects on the highlighter
    highlighter.update();

    // Classifies the rendered model into entities and adds it to the Model Tree
    classifier.byEntity(model);
    modelTree.update(["entities"]);

    // Caches the loaded IFC file
    cacher.saveFragmentGroup(model);
  });

  // Event handler when fragments are loaded ( gets executed after a page reload only )
  fragmentsManager.onFragmentsLoaded.add(async (models) => {
    // Event handler for rendering properties of the selected fragment
    highlighter.events.select.onHighlight.add((selection) => {
      const fragmentID = Object.keys(selection)[0];
      const expressID = Number([...selection[fragmentID]][0]);
      let model;
      for (const group of fragmentsManager.groups) {
        const foundFragment = Object.values(group.keyFragments).find(
          (id) => id === fragmentID
        );

        if (foundFragment) model = group;
      }

      // Processes and renders the selected fragment
      propertiesProcessor.process(model);
      propertiesProcessor.renderProperties(model, expressID);
    });

    // Applies the effects on the highlighter
    highlighter.update();

    // Classifies the rendered model into entities and adds it to the Model Tree
    classifier.byEntity(models);
    modelTree.update(["entities"]);
  });

  // Check if a fragment group exists and renders it if it does
  const fragments_id = cacher.fragmentsIDs;
  cacher.existsFragmentGroup(fragments_id) &&
    cacher.getFragmentGroup(fragments_id);

  // Event handler for model tree selection
  modelTree.onSelected.add((filter) => {
    highlighter.highlightByID("select", filter, true, true);
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
    modelTree,
    cacher
  );
};
