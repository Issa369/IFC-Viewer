import React, { createContext } from "react";
import * as OBC from "../../bim-components/src/index";

// Creating a context to hold the Components instance
const ComponentContext = createContext();

/**
 * ComponentsProvider is a provider component that wraps the application
 * to provide access to the OBC.Components instance via context.
 * It initializes the Components instance with uiEnabled set to false.
 *
 * @param {Object} props - The properties passed to the ComponentsProvider.
 * @param {ReactNode} props.children - The child components that will have access to the Components instance.
 *
 */
const ComponentsProvider = ({ children }) => {
  // Creating a new instance of OBC.Components
  const components = new OBC.Components();
  
  // Disabling UI in the components instance
  components.uiEnabled = false;
  
  // Providing the Components instance to the context
  return (
    <ComponentContext.Provider value={components}>
      {children}
    </ComponentContext.Provider>
  );
};

// Exporting the ComponentContext and ComponentsProvider for use in other components
export { ComponentContext, ComponentsProvider };
