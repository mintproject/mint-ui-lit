// <!-- Copyright (c) 2015 Google Inc. All rights reserved. -->
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { GoogleMapChildElement, customElement, property } from './lib/google-map-child-element.js';
const markerEvents = [
    'animation_changed',
    'click',
    'clickable_changed',
    'cursor_changed',
    'dblclick',
    'drag',
    'dragend',
    'draggable_changed',
    'dragstart',
    'flat_changed',
    'icon_changed',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'position_changed',
    'rightclick',
    'shape_changed',
    'title_changed',
    'visible_changed',
    'zindex_changed',
];
/**
 * The `google-map-marker` element represents a map marker. It is used as a
 * child of `google-map`.
 *
 * <b>Example</b>:
 *
 *     <google-map latitude="37.77493" longitude="-122.41942">
 *       <google-map-marker latitude="37.779" longitude="-122.3892"
 *           title="Go Giants!"></google-map-marker>
 *     </google-map>
 *
 * <b>Example</b> - marker with info window (children create the window content):
 *
 *     <google-map-marker latitude="37.77493" longitude="-122.41942">
 *       <img src="image.png">
 *     </google-map-marker>
 *
 * <b>Example</b> - a draggable marker:
 *
 *     <google-map-marker latitude="37.77493" longitude="-122.41942"
 *          draggable="true"></google-map-marker>
 *
 * <b>Example</b> - hide a marker:
 *
 *     <google-map-marker latitude="37.77493" longitude="-122.41942"
 *         hidden></google-map-marker>
 *
 */
let GoogleMapMarker = class GoogleMapMarker extends GoogleMapChildElement {
    // observers: [
    //   '_updatePosition(latitude, longitude)'
    // ],
    constructor() {
        super();
        /**
         * When true, marker *click events are automatically registered.
         */
        this.clickEvents = false;
        /**
         * When true, marker drag* events are automatically registered.
         */
        this.dragEvents = false;
        /**
         * When true, marker mouse* events are automatically registered.
         */
        this.mouseEvents = false;
        /**
         * Z-index for the marker icon.
         */
        this.zIndex = 0;
        /**
         * Specifies whether the InfoWindow is open or not
         */
        this.open = false;
        /**
         * @this {GoogleMapMarkerElement} This function is called with .bind(this) in setupDragHandler
         *_above.
          */
        this._onDragEnd = (e, _details, _sender) => {
            this.latitude = e.latLng.lat();
            this.longitude = e.latLng.lng();
        };
        console.log('google-map-marker');
    }
    update(changedProperties) {
        if (changedProperties.has('map')) {
            this._mapChanged();
        }
        if (changedProperties.has('open')) {
            this._openChanged();
        }
        super.update(changedProperties);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.marker) {
            google.maps.event.clearInstanceListeners(this.marker);
            this._listeners = {};
            this.marker.setMap(null);
        }
        // if (this._contentObserver) {
        //   this._contentObserver.disconnect();
        // }
    }
    connectedCallback() {
        super.connectedCallback();
        // If element is added back to DOM, put it back on the map.
        if (this.marker) {
            this.marker.setMap(this.map);
        }
    }
    _updatePosition() {
        if (this.marker && this.latitude !== undefined && this.longitude !== undefined) {
            this.marker.setPosition(new google.maps.LatLng(this.latitude, this.longitude));
        }
    }
    _animationChanged() {
        if (this.marker) {
            this.marker.setAnimation(this.animation === undefined ? null : this.animation);
        }
    }
    _labelChanged() {
        if (this.marker && this.label !== undefined) {
            this.marker.setLabel(this.label);
        }
    }
    _iconChanged() {
        if (this.marker && this.icon !== undefined) {
            this.marker.setIcon(this.icon);
        }
    }
    _zIndexChanged() {
        if (this.marker) {
            this.marker.setZIndex(this.zIndex);
        }
    }
    _mapChanged() {
        console.log('_mapChanged');
        // Marker will be rebuilt, so disconnect existing one from old map and listeners.
        if (this.marker) {
            this.marker.setMap(null);
            google.maps.event.clearInstanceListeners(this.marker);
        }
        if (this.map instanceof google.maps.Map) {
            this._mapReady();
        }
    }
    _contentChanged() {
        // if (this._contentObserver)
        //   this._contentObserver.disconnect();
        // // Watch for future updates.
        // this._contentObserver = new MutationObserver( this._contentChanged.bind(this));
        // this._contentObserver.observe( this, {
        //   childList: true,
        //   subtree: true
        // });
        // TODO(justinfagnani): no, no, no... Use Nodes, not innerHTML.
        const content = this.innerHTML.trim();
        console.log('_contentChanged', content, this.infoWindow);
        if (content) {
            if (!this.infoWindow) {
                // Create a new infowindow
                this.infoWindow = new google.maps.InfoWindow();
                this._openInfoHandler = google.maps.event.addListener(this.marker, 'click', () => {
                    this.open = true;
                });
                this._closeInfoHandler = google.maps.event.addListener(this.infoWindow, 'closeclick', () => {
                    this.open = false;
                });
            }
            this.infoWindow.setContent(content);
        }
        else {
            if (this.infoWindow) {
                // Destroy the existing infowindow.  It doesn't make sense to have an empty one.
                google.maps.event.removeListener(this._openInfoHandler);
                google.maps.event.removeListener(this._closeInfoHandler);
                this.infoWindow = undefined;
            }
        }
    }
    _openChanged() {
        if (this.infoWindow) {
            if (this.open) {
                this.infoWindow.open(this.map, this.marker);
                this.dispatchEvent(new CustomEvent('google-map-marker-open'));
            }
            else {
                this.infoWindow.close();
                this.dispatchEvent(new CustomEvent('google-map-marker-close'));
            }
        }
    }
    // TODO(justinfagnani): call from GoogleMapChildElement
    _mapReady() {
        console.log('_mapReady');
        this._listeners = {};
        this.marker = new google.maps.Marker({
            map: this.map,
            position: {
                lat: this.latitude,
                lng: this.longitude,
            },
            title: this.title,
            animation: this.animation,
            draggable: this.draggable,
            visible: !this.hidden,
            icon: this.icon,
            label: this.label,
            zIndex: this.zIndex
        });
        this._contentChanged();
        markerEvents.forEach((e) => this._forwardEvent(e));
        this._openChanged();
        this._setupDragHandler();
    }
    // TODO(justinfagnani): move to utils / base class
    _forwardEvent(name) {
        this._listeners[name] = google.maps.event.addListener(this.marker, name, (event) => {
            this.dispatchEvent(new CustomEvent(`google-map-marker-${name}`, {
                detail: {
                    mapsEvent: event,
                }
            }));
        });
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (!this.marker) {
            return;
        }
        // Cannot use *Changed watchers for native properties.
        switch (name) {
            case 'hidden':
                this.marker.setVisible(!this.hidden);
                break;
            case 'draggable':
                this.marker.setDraggable(this.draggable);
                this._setupDragHandler();
                break;
            case 'title':
                this.marker.setTitle(this.title);
                break;
        }
    }
    /**
     * @this {GoogleMapMarkerElement} This function is called  with .bind(this) in the map
     * marker element below.
     */
    _setupDragHandler() {
        if (this.draggable) {
            this._dragHandler = google.maps.event.addListener(this.marker, 'dragend', this._onDragEnd);
        }
        else {
            google.maps.event.removeListener(this._dragHandler);
            this._dragHandler = undefined;
        }
    }
};
__decorate([
    property({ type: Boolean })
], GoogleMapMarker.prototype, "clickEvents", void 0);
__decorate([
    property({ type: Boolean })
], GoogleMapMarker.prototype, "dragEvents", void 0);
__decorate([
    property({ type: Boolean })
], GoogleMapMarker.prototype, "mouseEvents", void 0);
__decorate([
    property()
], GoogleMapMarker.prototype, "icon", void 0);
__decorate([
    property({ type: Number })
], GoogleMapMarker.prototype, "zIndex", void 0);
__decorate([
    property({ type: Number, reflect: true })
], GoogleMapMarker.prototype, "latitude", void 0);
__decorate([
    property({ type: Number, reflect: true })
], GoogleMapMarker.prototype, "longitude", void 0);
__decorate([
    property({ type: String })
], GoogleMapMarker.prototype, "label", void 0);
__decorate([
    property({ type: String })
], GoogleMapMarker.prototype, "animation", void 0);
__decorate([
    property({ type: Boolean })
], GoogleMapMarker.prototype, "open", void 0);
GoogleMapMarker = __decorate([
    customElement('google-map-marker')
], GoogleMapMarker);
export { GoogleMapMarker };
