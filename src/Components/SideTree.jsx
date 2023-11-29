/* eslint-disable no-prototype-builtins */
import { useContext } from "react";
import * as OBC from "../../bim-components/src/index";
import { ComponentContext } from "../Context/ComponentsProvider";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";

const SideTree = ({ modelTree }) => {
  // Accessing the OBC.Components instance from the context
  const components = useContext(ComponentContext);

  /**
   * Highlights the 3D mesh corresponding to the selected tree item.
   *
   * @param {String} fragmentID - The element's fragment ID.
   * @param {string} expressID - The expressID of the element.
   */
  const highlightMesh = async (entity, expressID) => {
    // Getting the FragmentHighlighter tool from the OBC.Components instance
    const highlighter = await components.tools.get(OBC.FragmentHighlighter);

    // Highlighting the 3D mesh by expressID
    highlighter.highlightByID(
      "select",
      { [entity[1]]: [expressID] },
      true,
      true
    );
  };

  return (
    <>
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          flexGrow: 1,
          maxWidth: 400,
          minHeight: 100,
          minWidth: 50,
          overflowY: "auto",
          overflowX: "auto",
        }}
      >
        {modelTree &&
          // Mapping through model levels in the hierarchy
          Object.keys(modelTree).map((model) => (
            <TreeItem
              key={model}
              nodeId={model}
              label={<strong className="model">{model}</strong>}
            >
              {/* Mapping through floor levels in the hierarchy */}
              {Object.keys(modelTree[model]).map((floor) => (
                <TreeItem
                  className="storey"
                  key={`${model}:${floor}`}
                  nodeId={`${model}:${floor}`}
                  label={<strong>{floor}</strong>}
                >
                  {/* Mapping through entities on each floor */}
                  {Object.keys(modelTree[model][floor]).map((entity) => (
                    <TreeItem
                      className="floor-entity"
                      icon={<FiberManualRecordIcon color="red" />}
                      key={`${floor}:${entity}`}
                      nodeId={`${floor}:${entity}`}
                      label={`${entity}: ${modelTree[model][floor][entity][0]}`}
                      onClick={() =>
                        highlightMesh(modelTree[model][floor][entity], entity)
                      }
                    />
                  ))}
                </TreeItem>
              ))}
            </TreeItem>
          ))}
      </TreeView>
    </>
  );
};

export default SideTree;
