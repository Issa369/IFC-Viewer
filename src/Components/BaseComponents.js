import * as OBC from "../../bim-components/src/index";
/**
 * BaseComponents Function
 *
 * This function initializes and sets up the fundamental components for a 3D scene using my Custom OpenBIM-Components library.
 * It creates a scene, renderer, camera, raycaster, and a simple grid for visual representation.
 *
 * @param {OBC.Components} components - An object containing references to different components.
 * @param {HTMLElement} container - The HTML container element to which the 3D scene will be appended.
 */
export const BaseComponents = async (components, container) => {


  // Creates a new SimpleScene and initialize it
  const scene = new OBC.SimpleScene(components);
  scene.setup();
  components.scene = scene;

  // Creates a new PostproductionRenderer and set it as the renderer for the components
  const renderer = new OBC.PostproductionRenderer(components, container);
  components.renderer = renderer;

  // Get the postproduction object from the renderer
  const postproduction = renderer.postproduction;

  // Initializes the components
  components.init();

  // Creates a new OrthoPerspectiveCamera and set it as the camera for the components
  const camera = new OBC.OrthoPerspectiveCamera(components);
  components.camera = camera;

  // Creates a new SimpleRaycaster and set it as the raycaster for the components
  const raycaster = new OBC.SimpleRaycaster(components);
  components.raycaster = raycaster;

  // Updates the camera aspect ratio
  camera.updateAspect();

  // Enables postproduction effects
  postproduction.enabled = true;

  // Creates a new SimpleGrid and add its mesh to the excludedMeshes list in customEffects
  const grid = new OBC.SimpleGrid(components);
  postproduction.customEffects.excludedMeshes.push(grid.get());

  // Initialize OpenBIM-Components
  const classifier = new OBC.FragmentClassifier(components);
  const mainToolbar = new OBC.Toolbar(components);

  const fragmentsManager = new OBC.FragmentManager(components);
  const ifcLoader = new OBC.FragmentIfcLoader(components);

  // Configure settings for the IFC loader
  ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
  ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

  // Enable outlines in the renderer's postproduction effects
  components.renderer.postproduction.customEffects.outlineEnabled = true;

 
};
