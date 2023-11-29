import "../App.css";
import React, { useEffect, useState, useContext, useRef } from "react";
import SideTree from "./SideTree";
import ImportFile from "./ImportFile";
import { ComponentContext } from "../Context/ComponentsProvider";
import { BaseComponents } from "./BaseComponents";

/**
 * Main component serves as the main container for the IFC Viewer application.
 * It manages the state of the model tree and initializes the 3D scene using BaseComponents.
 *
 * @returns {ReactNode} The rendered Main component.
 */
const Main = () => {
  // Accessing the OBC.Components instance from the context
  const components = useContext(ComponentContext);

  // State to store the model tree
  const [modelTree, setModelTree] = useState(null);

  // Reference to the container div for the 3D scene
  const container = useRef(null);

  useEffect(() => {
    // Initializing BaseComponents with the OBC.Components instance and the container reference
    BaseComponents(components, container.current);

    // Cleanup function to dispose of the BIM components when the component is unmounted
    return async () => {
      await components.dispose();
    };
  }, [components]);

  return (
    <>
      <section className="body-container">
        <h2 style={{ color: "whitesmoke" }}>IFC Viewer</h2>
        <section className="buttons-container">
          <ImportFile setModelTree={setModelTree} />
        </section>
      </section>
      <section className="parent-container">
        <section className="sideBar">
          <h2>MODEL TREE</h2>
          <SideTree modelTree={modelTree} />
        </section>
        <section className="main-container">
          <section id="ifc-container" ref={container}></section>
        </section>
      </section>
    </>
  );
};

export default Main;
