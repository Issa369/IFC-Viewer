import * as THREE from "three";
import { Fragment } from "bim-fragment";
import { FragmentMesh } from "bim-fragment/fragment-mesh";
import { Component, Disposable, Event, FragmentIdMap } from "../../base-types";
import { FragmentManager } from "../FragmentManager";
import { FragmentBoundingBox } from "../FragmentBoundingBox";
import { Components, SimpleCamera, ToolComponent } from "../../core";
import { toCompositeID } from "../../utils";
import { PostproductionRenderer } from "../../navigation/PostproductionRenderer";

// TODO: Clean up and document

interface HighlightEvents {
  [highlighterName: string]: {
    onHighlight: Event<FragmentIdMap>;
    onClear: Event<null>;
    onDoubleClick: Event<null>;
  };
}

interface HighlightMaterials {
  [name: string]: THREE.Material[] | undefined;
}

export class FragmentHighlighter
  extends Component<HighlightMaterials>
  implements Disposable
{
  static readonly uuid = "cb8a76f2-654a-4b50-80c6-66fd83cafd77" as const;

  enabled = true;
  highlightMats: HighlightMaterials = {};
  events: HighlightEvents = {};

  multiple: "none" | "shiftKey" | "ctrlKey" = "ctrlKey";
  zoomFactor = 1.5;
  zoomToSelection = false;

  selection: {
    [selectionID: string]: FragmentIdMap;
  } = {};

  excludeOutline = new Set<string>();

  fillEnabled = true;

  outlineMaterial = new THREE.MeshBasicMaterial({
    color: "white",
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0.4,
  });

  private _eventsActive = false;

  private _outlineEnabled = true;

  private _outlinedMeshes: { [fragID: string]: THREE.InstancedMesh } = {};
  private _invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });

  private _tempMatrix = new THREE.Matrix4();

  private _default = {
    selectName: "select",
    hoverName: "hover",
    dblClickName: "dblclick",

    mouseDown: false,
    mouseMoved: false,

    selectionMaterial: new THREE.MeshBasicMaterial({
      color: "#BCF124",
      transparent: true,
      opacity: 0.85,
      depthTest: true,
    }),

    highlightMaterial: new THREE.MeshBasicMaterial({
      color: "#6528D7",
      transparent: true,
      opacity: 0.2,
      depthTest: true,
    }),
  };

  get outlineEnabled() {
    return this._outlineEnabled;
  }

  set outlineEnabled(value: boolean) {
    this._outlineEnabled = value;
    if (!value) {
      delete this._postproduction.customEffects.outlinedMeshes.fragments;
    }
  }

  private get _postproduction() {
    if (!(this.components.renderer instanceof PostproductionRenderer)) {
      throw new Error("Postproduction renderer is needed for outlines!");
    }
    const renderer = this.components.renderer as PostproductionRenderer;
    return renderer.postproduction;
  }

  constructor(components: Components) {
    super(components);

    // Bind the newly addded event Listener to the class
    this.onMouseDoubleClick = this.onMouseDoubleClick.bind(this);

    this.components.tools.add(FragmentHighlighter.uuid, this);
  }

  get(): HighlightMaterials {
    return this.highlightMats;
  }

  async dispose() {
    this.setupEvents(false);
    this._default.highlightMaterial.dispose();
    this._default.selectionMaterial.dispose();

    for (const matID in this.highlightMats) {
      const mats = this.highlightMats[matID] || [];
      for (const mat of mats) {
        mat.dispose();
      }
    }
    for (const id in this._outlinedMeshes) {
      const mesh = this._outlinedMeshes[id];
      mesh.geometry.dispose();
    }
    this.outlineMaterial.dispose();
    this._invisibleMaterial.dispose();
    this.highlightMats = {};
    this.selection = {};
    for (const name in this.events) {
      this.events[name].onClear.reset();
      this.events[name].onHighlight.reset();
      this.events[name].onDoubleClick.reset();
    }
    this.events = {};
  }

  async add(name: string, material?: THREE.Material[]) {
    if (this.highlightMats[name]) {
      throw new Error("A highlight with this name already exists.");
    }

    this.highlightMats[name] = material;
    this.selection[name] = {};
    this.events[name] = {
      onHighlight: new Event(),
      onClear: new Event(),
      onDoubleClick: new Event(),
    };

    await this.update();
  }

  async update() {
    if (!this.fillEnabled) {
      return;
    }
    const fragments = await this.components.tools.get(FragmentManager);
    for (const fragmentID in fragments.list) {
      const fragment = fragments.list[fragmentID];
      this.addHighlightToFragment(fragment);
      const outlinedMesh = this._outlinedMeshes[fragmentID];
      if (outlinedMesh) {
        fragment.mesh.updateMatrixWorld(true);
        outlinedMesh.applyMatrix4(fragment.mesh.matrixWorld);
      }
    }
  }

  async highlight(
    name: string,
    removePrevious = true,
    zoomToSelection = this.zoomToSelection
  ) {
    if (!this.enabled) return null;
    this.checkSelection(name);

    const fragments = await this.components.tools.get(FragmentManager);
    const fragList: Fragment[] = [];
    const meshes = fragments.meshes;
    const result = this.components.raycaster.castRay(meshes);

    if (!result) {
      await this.clear(name);
      return null;
    }

    const mesh = result.object as FragmentMesh;
    const geometry = mesh.geometry;
    const index = result.face?.a;
    const instanceID = result.instanceId;
    if (!geometry || index === undefined || instanceID === undefined) {
      return null;
    }

    if (removePrevious) {
      await this.clear(name);
    }

    if (!this.selection[name][mesh.uuid]) {
      this.selection[name][mesh.uuid] = new Set<string>();
    }

    fragList.push(mesh.fragment);
    const blockID = mesh.fragment.getVertexBlockID(geometry, index);

    const itemID = mesh.fragment
      .getItemID(instanceID, blockID)
      .replace(/\..*/, "");

    const idNum = parseInt(itemID, 10);
    this.selection[name][mesh.uuid].add(itemID);
    this.addComposites(mesh, idNum, name);
    await this.regenerate(name, mesh.uuid);

    const group = mesh.fragment.group;
    if (group) {
      const keys = group.data[idNum][0];
      for (let i = 0; i < keys.length; i++) {
        const fragKey = keys[i];
        const fragID = group.keyFragments[fragKey];
        const fragment = fragments.list[fragID];
        fragList.push(fragment);
        if (!this.selection[name][fragID]) {
          this.selection[name][fragID] = new Set<string>();
        }
        this.selection[name][fragID].add(itemID);
        this.addComposites(fragment.mesh, idNum, name);
        await this.regenerate(name, fragID);
      }
    }

    await this.events[name].onHighlight.trigger(this.selection[name]);

    if (zoomToSelection) {
      await this.zoomSelection(name);
    }

    return { id: itemID, fragments: fragList };
  }

  async highlightByID(
    name: string,
    ids: FragmentIdMap,
    removePrevious = true,
    zoomToSelection = this.zoomToSelection
  ) {
    if (!this.enabled) return;
    if (removePrevious) {
      await this.clear(name);
    }
    const styles = this.selection[name];
    for (const fragID in ids) {
      if (!styles[fragID]) {
        styles[fragID] = new Set<string>();
      }

      const fragments = await this.components.tools.get(FragmentManager);
      const fragment = fragments.list[fragID];

      const idsNum = new Set<number>();
      for (const id of ids[fragID]) {
        styles[fragID].add(id);
        idsNum.add(parseInt(id, 10));
      }
      for (const id of idsNum) {
        this.addComposites(fragment.mesh, id, name);
      }
      await this.regenerate(name, fragID);
    }

    await this.events[name].onHighlight.trigger(this.selection[name]);

    if (zoomToSelection) {
      await this.zoomSelection(name);
    }
  }

  /**
   * Clears any selection previously made by calling {@link highlight}.
   */
  async clear(name?: string) {
    await this.clearFills(name);
    if (!name || !this.excludeOutline.has(name)) {
      await this.clearOutlines();
    }
  }

  async setup() {
    this.enabled = true;
    this.outlineMaterial.color.set(0xf0ff7a);
    this.excludeOutline.add(this._default.hoverName);
    await this.add(this._default.selectName, [this._default.selectionMaterial]);
    await this.add(this._default.hoverName, [this._default.highlightMaterial]);
    await this.add(this._default.dblClickName, [
      this._default.highlightMaterial,
    ]);
    this.setupEvents(true);
  }

  private async regenerate(name: string, fragID: string) {
    if (this.fillEnabled) {
      await this.updateFragmentFill(name, fragID);
    }
    if (this._outlineEnabled) {
      await this.updateFragmentOutline(name, fragID);
    }
  }

  private async zoomSelection(name: string) {
    if (!this.fillEnabled && !this._outlineEnabled) {
      return;
    }

    const bbox = await this.components.tools.get(FragmentBoundingBox);
    const fragments = await this.components.tools.get(FragmentManager);
    bbox.reset();

    const selected = this.selection[name];
    if (!Object.keys(selected).length) {
      return;
    }
    for (const fragID in selected) {
      const fragment = fragments.list[fragID];
      if (this.fillEnabled) {
        const highlight = fragment.fragments[name];
        if (highlight) {
          bbox.addMesh(highlight.mesh);
        }
      }

      if (this._outlineEnabled && this._outlinedMeshes[fragID]) {
        bbox.addMesh(this._outlinedMeshes[fragID]);
      }
    }

    const sphere = bbox.getSphere();
    sphere.radius *= this.zoomFactor;
    const camera = this.components.camera as SimpleCamera;
    await camera.controls.fitToSphere(sphere, true);
  }

  private addComposites(mesh: FragmentMesh, itemID: number, name: string) {
    const composites = mesh.fragment.composites[itemID];
    if (composites) {
      for (let i = 1; i < composites; i++) {
        const compositeID = toCompositeID(itemID, i);
        this.selection[name][mesh.uuid].add(compositeID);
      }
    }
  }

  private async clearStyle(name: string) {
    const fragments = await this.components.tools.get(FragmentManager);

    for (const fragID in this.selection[name]) {
      const fragment = fragments.list[fragID];
      if (!fragment) continue;
      const selection = fragment.fragments[name];
      if (selection) {
        selection.mesh.removeFromParent();
      }
    }

    await this.events[name].onClear.trigger(null);
    this.selection[name] = {};
  }

  private async updateFragmentFill(name: string, fragmentID: string) {
    const fragments = await this.components.tools.get(FragmentManager);

    const ids = this.selection[name][fragmentID];
    const fragment = fragments.list[fragmentID];
    if (!fragment) return;
    const selection = fragment.fragments[name];
    if (!selection) return;

    // #region Old child/parent code
    // const scene = this._components.scene.get();
    // scene.add(selection.mesh); //If we add selection.mesh directly to the scene, it won't be coordinated unless we do so manually.
    // #endregion

    // #region New child/parent code
    const fragmentParent = fragment.mesh.parent;
    if (!fragmentParent) return;
    fragmentParent.add(selection.mesh);
    // #endregion

    const isBlockFragment = selection.blocks.count > 1;
    if (isBlockFragment) {
      fragment.getInstance(0, this._tempMatrix);
      selection.setInstance(0, {
        ids: Array.from(fragment.ids),
        transform: this._tempMatrix,
      });

      selection.blocks.setVisibility(true, ids, true);
    } else {
      let i = 0;
      for (const id of ids) {
        selection.mesh.count = i + 1;
        const { instanceID } = fragment.getInstanceAndBlockID(id);
        fragment.getInstance(instanceID, this._tempMatrix);
        selection.setInstance(i, { ids: [id], transform: this._tempMatrix });
        i++;
      }
    }
  }

  private checkSelection(name: string) {
    if (!this.selection[name]) {
      throw new Error(`Selection ${name} does not exist.`);
    }
  }

  private addHighlightToFragment(fragment: Fragment) {
    for (const name in this.highlightMats) {
      if (!fragment.fragments[name]) {
        const material = this.highlightMats[name];
        const subFragment = fragment.addFragment(name, material);
        if (fragment.blocks.count > 1) {
          subFragment.setInstance(0, {
            ids: Array.from(fragment.ids),
            transform: this._tempMatrix,
          });
          subFragment.blocks.setVisibility(false);
        }
        subFragment.mesh.renderOrder = 2;
        subFragment.mesh.frustumCulled = false;
      }
    }
  }

  private async clearFills(name: string | undefined) {
    const names = name ? [name] : Object.keys(this.selection);
    for (const name of names) {
      await this.clearStyle(name);
    }
  }

  private async clearOutlines() {
    const fragments = await this.components.tools.get(FragmentManager);

    const effects = this._postproduction.customEffects;
    const fragmentsOutline = effects.outlinedMeshes.fragments;
    if (fragmentsOutline) {
      fragmentsOutline.meshes.clear();
    }
    for (const fragID in this._outlinedMeshes) {
      const fragment = fragments.list[fragID];
      const isBlockFragment = fragment.blocks.count > 1;
      const mesh = this._outlinedMeshes[fragID];
      if (isBlockFragment) {
        mesh.geometry.setIndex([]);
      } else {
        mesh.count = 0;
      }
    }
  }

  private async updateFragmentOutline(name: string, fragmentID: string) {
    const fragments = await this.components.tools.get(FragmentManager);

    if (!this.selection[name][fragmentID]) {
      return;
    }

    if (this.excludeOutline.has(name)) {
      return;
    }

    const ids = this.selection[name][fragmentID];
    const fragment = fragments.list[fragmentID];
    if (!fragment) return;

    const geometry = fragment.mesh.geometry;
    const customEffects = this._postproduction.customEffects;

    if (!customEffects.outlinedMeshes.fragments) {
      customEffects.outlinedMeshes.fragments = {
        meshes: new Set(),
        material: this.outlineMaterial,
      };
    }

    const outlineEffect = customEffects.outlinedMeshes.fragments;

    // Create a copy of the original fragment mesh for outline
    if (!this._outlinedMeshes[fragmentID]) {
      const newGeometry = new THREE.BufferGeometry();

      newGeometry.attributes = geometry.attributes;
      newGeometry.index = geometry.index;
      const newMesh = new THREE.InstancedMesh(
        newGeometry,
        this._invisibleMaterial,
        fragment.capacity
      );
      newMesh.frustumCulled = false;
      newMesh.renderOrder = 999;
      fragment.mesh.updateMatrixWorld(true);
      newMesh.applyMatrix4(fragment.mesh.matrixWorld);
      this._outlinedMeshes[fragmentID] = newMesh;

      const scene = this.components.scene.get();
      scene.add(newMesh);
    }

    const outlineMesh = this._outlinedMeshes[fragmentID];
    outlineEffect.meshes.add(outlineMesh);

    const isBlockFragment = fragment.blocks.count > 1;

    if (isBlockFragment) {
      const indices = fragment.mesh.geometry.index.array;
      const newIndex: number[] = [];
      const idsSet = new Set(ids);
      for (let i = 0; i < indices.length - 2; i += 3) {
        const index = indices[i];
        const blockID = fragment.mesh.geometry.attributes.blockID.array;
        const block = blockID[index];
        const itemID = fragment.mesh.fragment.getItemID(0, block);
        if (idsSet.has(itemID)) {
          newIndex.push(indices[i], indices[i + 1], indices[i + 2]);
        }
      }

      outlineMesh.geometry.setIndex(newIndex);
    } else {
      let counter = 0;
      for (const id of ids) {
        const { instanceID } = fragment.getInstanceAndBlockID(id);
        fragment.mesh.getMatrixAt(instanceID, this._tempMatrix);
        outlineMesh.setMatrixAt(counter++, this._tempMatrix);
      }
      outlineMesh.count = counter;
      outlineMesh.instanceMatrix.needsUpdate = true;
    }
  }

  //Handles the logic for the double-click event on a 3D element.
  private onMouseDoubleClick() {
    // Clears all previous selected elements by Single-Click
    this.clear("select");

    // Highlight the selected element
    this.highlight("dblclick", true, true);
  }

  private setupEvents(active: boolean) {
    const container = this.components.renderer.get().domElement;

    if (active === this._eventsActive) {
      return;
    }

    this._eventsActive = active;

    if (active) {
      container.addEventListener("mousedown", this.onMouseDown);
      container.addEventListener("mouseup", this.onMouseUp);
      container.addEventListener("mousemove", this.onMouseMove);
      container.addEventListener("dblclick", this.onMouseDoubleClick);
    } else {
      container.removeEventListener("mousedown", this.onMouseDown);
      container.removeEventListener("mouseup", this.onMouseUp);
      container.removeEventListener("mousemove", this.onMouseMove);
      container.removeEventListener("dblclick", this.onMouseDoubleClick);
    }
  }

  private onMouseDown = () => {
    if (!this.enabled) return;
    this._default.mouseDown = true;
  };

  private onMouseUp = async (event: MouseEvent) => {
    if (!this.enabled) return;
    if (event.target !== this.components.renderer.get().domElement) return;
    this._default.mouseDown = false;
    if (this._default.mouseMoved || event.button !== 0) {
      this._default.mouseMoved = false;
      return;
    }

    this._default.mouseMoved = false;
    const mult = this.multiple === "none" ? true : !event[this.multiple];
    await this.highlight(this._default.selectName, mult, this.zoomToSelection);
  };

  private onMouseMove = async () => {
    if (!this.enabled) return;
    if (this._default.mouseMoved) {
      await this.clearFills(this._default.hoverName);
      return;
    }

    this._default.mouseMoved = this._default.mouseDown;
    await this.highlight(this._default.hoverName, true, false);
  };
}

ToolComponent.libraryUUIDs.add(FragmentHighlighter.uuid);
