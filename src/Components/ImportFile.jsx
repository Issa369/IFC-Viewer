import React, { useContext } from "react";
import { Button } from "@mui/material";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { ComponentContext } from "../Context/ComponentsProvider";
import * as OBC from "../../bim-components/src/index";
const ImportFile = ({ setModelTree }) => {
  const components = useContext(ComponentContext);

  const handleFileImport = async () => {
    const fragmentIfcLoader = await components.tools.get(OBC.FragmentIfcLoader);
    const classifier = await components.tools.get(OBC.FragmentClassifier);

    // Initialize and set up the fragment highlighter
    const highlighter = new OBC.FragmentHighlighter(components);
    await highlighter.setup();
    highlighter.outlinesEnabled = true;

    const scene = await components.scene.get();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ifc";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file.name.includes(".ifc")) {
        alert("Incorrect file format");
        return;
      }
      const url = URL.createObjectURL(file);
      const result = await fetch(url);
      const data = await result.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await fragmentIfcLoader.load(buffer);

      model.name = file.name;
      classifier.myTreeClassifier(model);
      const tree = classifier.getTree();
      setModelTree({ ...tree });
      scene.add(model);
      await highlighter.update();
      input.remove();
    };
    input.click();
  };

  return (
    <Button
      variant="contained"
      startIcon={<DriveFolderUploadIcon />}
      onClick={() => handleFileImport()}
    >
      Upload
    </Button>
  );
};

export default ImportFile;
