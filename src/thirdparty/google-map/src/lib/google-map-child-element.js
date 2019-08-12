/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit-element';
import { property } from 'lit-element/lib/decorators.js';
//import { loadGoogleMapsAPI } from '../maps-api';
export { html, svg, css } from 'lit-element';
export { customElement, property, query } from 'lit-element/lib/decorators.js';
/**
 * Base class that helps manage references to the containing google.maps.Map
 * instance.
 */
export class GoogleMapChildElement extends LitElement {
    render() {
        return html `<slot></slot>`;
    }
    /**
     * Gets an instance of google.maps.Map by firing a google-map-get-map-instance
     * event to request the instance from an ancestor element. GoogleMap responds
     * to this event.
     */
    async _getMapInstance() {
        const detail = {};
        this.dispatchEvent(new CustomEvent('google-map-get-map-instance', {
            bubbles: true,
            detail,
        }));
        return detail.mapReady;
    }
    connectedCallback() {
        super.connectedCallback();
        this.mapReady = this._getMapInstance();
        this.mapReady.then((map) => {
            this.map = map;
        });
    }
}
GoogleMapChildElement.styles = css `
    :host {
      display: none;
    }
  `;
__decorate([
    property()
], GoogleMapChildElement.prototype, "map", void 0);
