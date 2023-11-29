import * as THREE from "three";
import { Disposable } from "./base-types";

/**
 * A helper to easily get the real position of the mouse in the Three.js canvas
 * to work with tools like the
 * [raycaster](https://threejs.org/docs/#api/en/core/Raycaster), even if it has
 * been transformed through CSS or doesn't occupy the whole screen.
 */
export class Mouse implements Disposable {
  private _event?: MouseEvent;
  private _position = new THREE.Vector2();

  constructor(public dom: HTMLCanvasElement) {
    this.setupEvents(true);
  }

  /**
   * The real position of the mouse of the Three.js canvas.
   */
  get position() {
    if (this._event) {
      const bounds = this.dom.getBoundingClientRect();
      this._position.x = this.getPositionX(bounds, this._event);
      this._position.y = this.getPositionY(bounds, this._event);
    }
    return this._position;
  }

  /** {@link Disposable.dispose} */
  async dispose() {
    this.setupEvents(false);
  }

  private getPositionY(bound: DOMRect, event: MouseEvent) {
    return -((event.clientY - bound.top) / (bound.bottom - bound.top)) * 2 + 1;
  }

  private getPositionX(bound: DOMRect, event: MouseEvent) {
    return ((event.clientX - bound.left) / (bound.right - bound.left)) * 2 - 1;
  }

  private updateMouseInfo = (event: MouseEvent) => {
    this._event = event;
  };

  private setupEvents(active: boolean) {
    if (active) {
      this.dom.addEventListener("mousemove", this.updateMouseInfo);
    } else {
      this.dom.removeEventListener("mousemove", this.updateMouseInfo);
    }
  }
}
