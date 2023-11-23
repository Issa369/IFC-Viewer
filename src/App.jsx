import { useRef, useEffect } from "react";
import "./App.css";
import * as OBC from "openbim-components";
import { BaseComponents } from "./Components/BaseComponents";
import { IFChandler } from "./Components/IFChandler";

// Create a new instance of OpenBIM-Components
const components = new OBC.Components();

/**
 *
 * App Component
 *
 * This React component serves as the main entry point for the application.
 * It initializes OpenBIM-Components, sets up the base components for the 3D scene,
 * and handles the loading and interaction with IFC models.
 */
function App() {
  // Reference to the container div for the 3D scene
  const container = useRef(null);

  useEffect(() => {
    // Set up the base components for the 3D scene
    BaseComponents(components, container.current);

    // Initialize and configure the OpenBIM-Components for handling IFC models
    IFChandler(components, container.current);

    // Cleanup function to dispose of components when the component unmounts
    return async () => {
      await components.dispose();
    };
  }, []);
  return <div id="container-styles" ref={container}></div>;
}

export default App;
