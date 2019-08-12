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
import { customElement, property, query } from 'lit-element/lib/decorators.js';
import { loadGoogleMapsAPI } from './maps-api.js';
import { Deferred } from './lib/deferred.js';
const mapEvents = [
    'bounds_changed',
    'center_changed',
    'click',
    'dblclick',
    'drag',
    'dragend',
    'dragstart',
    'heading_changed',
    'idle',
    'maptypeid_changed',
    'mousemove',
    'mouseout',
    'mouseover',
    'projection_changed',
    'rightclick',
    'tilesloaded',
    'tilt_changed',
    'zoom_changed'
];
/**
 * The `google-map` element renders a Google Map.
 *
 * <b>Example</b>:
 *
 *     <style>
 *       google-map {
 *         height: 600px;
 *       }
 *     </style>
 *     <google-map latitude="37.77493" longitude="-122.41942" api-key="1234"></google-map>
 *
 * <b>Example</b> - add markers to the map and ensure they're in view:
 *
 *     <google-map latitude="37.77493" longitude="-122.41942" fit-to-markers>
 *       <google-map-marker latitude="37.779" longitude="-122.3892"
 *           draggable="true" title="Go Giants!"></google-map-marker>
 *       <google-map-marker latitude="37.777" longitude="-122.38911"></google-map-marker>
 *     </google-map>
 *
 * <b>Example</b>:
 *
 *     <google-map disable-default-ui zoom="15"></google-map>
 *     <script>
 *       var map = document.querySelector('google-map');
 *       map.latitude = 37.77493;
 *       map.longitude = -122.41942;
 *       map.addEventListener('google-map-ready', function(e) {
 *         alert('Map loaded!');
 *       });
 *     </script>
 *
 * <b>Example</b> - with Google directions, using data-binding inside another
 * Polymer element
 *
 *     <google-map map="{{map}}"></google-map>
 *     <google-map-directions map="[[map]]"
 *         start-address="San Francisco" end-address="Mountain View">
 *     </google-map-directions>
 *
 * Disable dragging by adding `draggable="false"` on the `google-map` element.
 *
 * <b>Example</b> - loading the Maps API from another origin (China)
 *
 *     <google-map maps-url="http://maps.google.cn/maps/api/js?callback=%%callback%%">
 *
 * ###  Tips
 *
 * If you're seeing the message "You have included the Google Maps API multiple
 * times on this page. This may cause unexpected errors." it probably means
 * you're loading other maps elements on the page (`<google-maps-directions>`).
 * Each maps element must include the same set of configuration options
 * (`apiKey`, `clientId`, `language`, `version`, etc.) so the Maps API is loaded
 * from the same URL.
 *
 * @demo demo/index.html
 * @demo demo/polys.html
 * @demo demo/kml.html
 */
let GoogleMap = class GoogleMap extends LitElement {
    constructor() {
        super();
        /**
         * Version of the Google Maps API to use.
         */
        this.apiVersion = '3.33';
        /**
         * A latitude to center the map on.
         */
        this.latitude = 37.77493;
        /**
         * A longitude to center the map on.
         */
        this.longitude = -122.41942;
        /**
         * A zoom level to set the map to.
         */
        this.zoom = 10;
        /**
         * Map type to display. One of 'roadmap', 'satellite', 'hybrid', 'terrain'.
         */
        this.mapTypeId = 'roadmap';
        /**
         * If set, the zoom level is set such that all markers (google-map-marker children) are brought into view.
         */
        this.fitToMarkers = false;
        /**
         * If true, prevent the user from zooming the map interactively.
         */
        this.disableZoom = false;
        /**
         * The markers on the map.
         */
        this.markers = [];
        /**
         * If set, all other info windows on markers are closed when opening a new one.
         */
        this.singleInfoWindow = false;
        //@query('slot')
        //private _slot!: HTMLSlotElement;
        //private _markersChildrenListener?: EventListener;
        this._mapReadyDeferred = new Deferred();
        // Respond to child elements requesting a Map instance
        this.addEventListener('google-map-get-map-instance', (e) => {
            console.log('google-map google-map-get-map-instance');
            const detail = e.detail;
            detail.mapReady = this._mapReadyDeferred.promise;
        });
        // TODO(justinfagnani): Now that children register thmselves, figure out
        // when to call this._fitToMarkersChanged(), or remove the feature
    }
    render() {
        return html `
      <div id="map"></div>
      <slot @google-map-marker-open=${this._onMarkerOpen}></slot>
  `;
    }
    update(changedProperties) {
        if (changedProperties.has('apiKey')) {
            this._initGMap();
        }
        // Re-set options every update.
        // TODO(justinfagnani): Check to see if this hurts perf
        if (this.map !== undefined) {
            this.map.setOptions(this._getMapOptions());
        }
        super.update(changedProperties);
    }
    async _initGMap() {
        if (this.map !== undefined) {
            return;
        }
        // TODO(justinfagnani): support a global API as well - a singleton API
        // instance shared for the whole window, where each element doesn't need
        // its own API key.
        await loadGoogleMapsAPI(this.apiKey);
        this.map = new google.maps.Map(this._mapDiv, this._getMapOptions());
        this._updateCenter();
        mapEvents.forEach((event) => this._forwardEvent(event));
        this.dispatchEvent(new CustomEvent('google-map-ready'));
        this._mapReadyDeferred.resolve(this.map);
    }
    _getMapOptions() {
        return Object.assign({ zoom: this.zoom, tilt: this.tilt, mapTypeId: this.mapTypeId, disableDefaultUI: this.disableDefaultUI, mapTypeControl: this.mapTypeControl, streetViewControl: this.streetViewControl, disableDoubleClickZoom: this.disableZoom, 
            // scrollwheel: this.scrollWheel,
            styles: this.styles, maxZoom: this.maxZoom, minZoom: this.minZoom, draggable: this.draggable }, this.options);
    }
    _onMarkerOpen(e) {
        console.log('_onMarkerOpen', e);
    }
    /**
     * Explicitly resizes the map, updating its center. This is useful if the
     * map does not show after you have unhidden it.
     *
     * @method resize
     */
    resize() {
        if (this.map !== undefined) {
            // saves and restores latitude/longitude because resize can move the center
            const oldLatitude = this.latitude;
            const oldLongitude = this.longitude;
            google.maps.event.trigger(this.map, 'resize');
            this.latitude = oldLatitude; // restore because resize can move our center
            this.longitude = oldLongitude;
            if (this.fitToMarkers) { // we might not have a center if we are doing fit-to-markers
                this._fitToMarkersChanged();
            }
        }
    }
    _updateCenter() {
        console.log('_updateCenter');
        if (this.map !== undefined && this.latitude !== undefined && this.longitude !== undefined) {
            const newCenter = new google.maps.LatLng(this.latitude, this.longitude);
            let oldCenter = this.map.getCenter();
            if (oldCenter === undefined) {
                // If the map does not have a center, set it right away.
                this.map.setCenter(newCenter);
            }
            else {
                // Using google.maps.LatLng returns corrected lat/lngs.
                oldCenter = new google.maps.LatLng(oldCenter.lat(), oldCenter.lng());
                // If the map currently has a center, slowly pan to the new one.
                if (!oldCenter.equals(newCenter)) {
                    this.map.panTo(newCenter);
                }
            }
        }
    }
    _fitToMarkersChanged() {
        // TODO(ericbidelman): respect user's zoom level.
        if (this.map && this.fitToMarkers && this.markers.length > 0) {
            const latLngBounds = new google.maps.LatLngBounds();
            for (const m of this.markers) {
                latLngBounds.extend(new google.maps.LatLng(m.latitude, m.longitude));
            }
            // For one marker, don't alter zoom, just center it.
            if (this.markers.length > 1) {
                this.map.fitBounds(latLngBounds);
            }
            this.map.setCenter(latLngBounds.getCenter());
        }
    }
    /**
     * Forwards Maps API events as DOM CustomEvents
     */
    _forwardEvent(name) {
        google.maps.event.addListener(this.map, name, (event) => {
            this.dispatchEvent(new CustomEvent(`google-map-${name}`, {
                detail: {
                    mapsEvent: event,
                }
            }));
        });
    }
};
GoogleMap.styles = css `
    :host {
      position: relative;
      display: block;
      height: 100%;
    }
    #map {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
  `;
__decorate([
    property({ attribute: 'api-key' })
], GoogleMap.prototype, "apiKey", void 0);
__decorate([
    property({ attribute: 'api-version' })
], GoogleMap.prototype, "apiVersion", void 0);
__decorate([
    property()
], GoogleMap.prototype, "mapsUrl", void 0);
__decorate([
    property({ attribute: 'client-id' })
], GoogleMap.prototype, "clientId", void 0);
__decorate([
    property({ type: Number })
], GoogleMap.prototype, "latitude", void 0);
__decorate([
    property({ type: Number })
], GoogleMap.prototype, "longitude", void 0);
__decorate([
    property({ type: Number })
], GoogleMap.prototype, "zoom", void 0);
__decorate([
    property({ type: Number })
], GoogleMap.prototype, "tilt", void 0);
__decorate([
    property({ type: String, reflect: true })
], GoogleMap.prototype, "mapTypeId", void 0);
__decorate([
    property({ type: Boolean, attribute: 'disable-default-ui' })
], GoogleMap.prototype, "disableDefaultUI", void 0);
__decorate([
    property({ type: Boolean, attribute: 'map-type-control' })
], GoogleMap.prototype, "mapTypeControl", void 0);
__decorate([
    property({ type: Boolean, attribute: 'street-view-control' })
], GoogleMap.prototype, "streetViewControl", void 0);
__decorate([
    property({ type: Boolean, attribute: 'fit-to-markers' })
], GoogleMap.prototype, "fitToMarkers", void 0);
__decorate([
    property({ type: Boolean, attribute: 'disable-zoom' })
], GoogleMap.prototype, "disableZoom", void 0);
__decorate([
    property({ type: Object })
], GoogleMap.prototype, "styles", void 0);
__decorate([
    property({ type: Number, attribute: 'max-zoom' })
], GoogleMap.prototype, "maxZoom", void 0);
__decorate([
    property({ type: Number, attribute: 'min-zoom' })
], GoogleMap.prototype, "minZoom", void 0);
__decorate([
    property()
], GoogleMap.prototype, "language", void 0);
__decorate([
    property({ type: Object })
], GoogleMap.prototype, "options", void 0);
__decorate([
    property({ type: Boolean, attribute: 'single-info-window' })
], GoogleMap.prototype, "singleInfoWindow", void 0);
__decorate([
    query('#map')
], GoogleMap.prototype, "_mapDiv", void 0);
GoogleMap = __decorate([
    customElement('google-map')
], GoogleMap);
export { GoogleMap };
