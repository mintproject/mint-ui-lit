"use strict";
// <!-- Copyright (c) 2015 Google Inc. All rights reserved. -->
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var google_map_child_element_js_1 = require("./lib/google-map-child-element.js");
var markerEvents = [
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
var GoogleMapMarker = /** @class */ (function (_super) {
    __extends(GoogleMapMarker, _super);
    // observers: [
    //   '_updatePosition(latitude, longitude)'
    // ],
    function GoogleMapMarker() {
        var _this = _super.call(this) || this;
        /**
         * When true, marker *click events are automatically registered.
         */
        _this.clickEvents = false;
        /**
         * When true, marker drag* events are automatically registered.
         */
        _this.dragEvents = false;
        /**
         * When true, marker mouse* events are automatically registered.
         */
        _this.mouseEvents = false;
        /**
         * Z-index for the marker icon.
         */
        _this.zIndex = 0;
        /**
         * Specifies whether the InfoWindow is open or not
         */
        _this.open = false;
        /**
         * @this {GoogleMapMarkerElement} This function is called with .bind(this) in setupDragHandler
         *_above.
          */
        _this._onDragEnd = function (e, _details, _sender) {
            _this.latitude = e.latLng.lat();
            _this.longitude = e.latLng.lng();
        };
        console.log('google-map-marker');
        return _this;
    }
    GoogleMapMarker.prototype.update = function (changedProperties) {
        if (changedProperties.has('map')) {
            this._mapChanged();
        }
        if (changedProperties.has('open')) {
            this._openChanged();
        }
        _super.prototype.update.call(this, changedProperties);
    };
    GoogleMapMarker.prototype.disconnectedCallback = function () {
        _super.prototype.disconnectedCallback.call(this);
        if (this.marker) {
            google.maps.event.clearInstanceListeners(this.marker);
            this._listeners = {};
            this.marker.setMap(null);
        }
        // if (this._contentObserver) {
        //   this._contentObserver.disconnect();
        // }
    };
    GoogleMapMarker.prototype.connectedCallback = function () {
        _super.prototype.connectedCallback.call(this);
        // If element is added back to DOM, put it back on the map.
        if (this.marker) {
            this.marker.setMap(this.map);
        }
    };
    GoogleMapMarker.prototype._updatePosition = function () {
        if (this.marker && this.latitude !== undefined && this.longitude !== undefined) {
            this.marker.setPosition(new google.maps.LatLng(this.latitude, this.longitude));
        }
    };
    GoogleMapMarker.prototype._animationChanged = function () {
        if (this.marker) {
            this.marker.setAnimation(this.animation === undefined ? null : this.animation);
        }
    };
    GoogleMapMarker.prototype._labelChanged = function () {
        if (this.marker && this.label !== undefined) {
            this.marker.setLabel(this.label);
        }
    };
    GoogleMapMarker.prototype._iconChanged = function () {
        if (this.marker && this.icon !== undefined) {
            this.marker.setIcon(this.icon);
        }
    };
    GoogleMapMarker.prototype._zIndexChanged = function () {
        if (this.marker) {
            this.marker.setZIndex(this.zIndex);
        }
    };
    GoogleMapMarker.prototype._mapChanged = function () {
        console.log('_mapChanged');
        // Marker will be rebuilt, so disconnect existing one from old map and listeners.
        if (this.marker) {
            this.marker.setMap(null);
            google.maps.event.clearInstanceListeners(this.marker);
        }
        if (this.map instanceof google.maps.Map) {
            this._mapReady();
        }
    };
    GoogleMapMarker.prototype._contentChanged = function () {
        // if (this._contentObserver)
        //   this._contentObserver.disconnect();
        // // Watch for future updates.
        // this._contentObserver = new MutationObserver( this._contentChanged.bind(this));
        // this._contentObserver.observe( this, {
        //   childList: true,
        //   subtree: true
        // });
        var _this = this;
        // TODO(justinfagnani): no, no, no... Use Nodes, not innerHTML.
        var content = this.innerHTML.trim();
        console.log('_contentChanged', content, this.infoWindow);
        if (content) {
            if (!this.infoWindow) {
                // Create a new infowindow
                this.infoWindow = new google.maps.InfoWindow();
                this._openInfoHandler = google.maps.event.addListener(this.marker, 'click', function () {
                    _this.open = true;
                });
                this._closeInfoHandler = google.maps.event.addListener(this.infoWindow, 'closeclick', function () {
                    _this.open = false;
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
    };
    GoogleMapMarker.prototype._openChanged = function () {
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
    };
    // TODO(justinfagnani): call from GoogleMapChildElement
    GoogleMapMarker.prototype._mapReady = function () {
        var _this = this;
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
        markerEvents.forEach(function (e) { return _this._forwardEvent(e); });
        this._openChanged();
        this._setupDragHandler();
    };
    // TODO(justinfagnani): move to utils / base class
    GoogleMapMarker.prototype._forwardEvent = function (name) {
        var _this = this;
        this._listeners[name] = google.maps.event.addListener(this.marker, name, function (event) {
            _this.dispatchEvent(new CustomEvent("google-map-marker-" + name, {
                detail: {
                    mapsEvent: event,
                }
            }));
        });
    };
    GoogleMapMarker.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
        _super.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
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
    };
    /**
     * @this {GoogleMapMarkerElement} This function is called  with .bind(this) in the map
     * marker element below.
     */
    GoogleMapMarker.prototype._setupDragHandler = function () {
        if (this.draggable) {
            this._dragHandler = google.maps.event.addListener(this.marker, 'dragend', this._onDragEnd);
        }
        else {
            google.maps.event.removeListener(this._dragHandler);
            this._dragHandler = undefined;
        }
    };
    __decorate([
        google_map_child_element_js_1.property({ type: Boolean }),
        __metadata("design:type", Object)
    ], GoogleMapMarker.prototype, "clickEvents", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Boolean }),
        __metadata("design:type", Object)
    ], GoogleMapMarker.prototype, "dragEvents", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Boolean }),
        __metadata("design:type", Object)
    ], GoogleMapMarker.prototype, "mouseEvents", void 0);
    __decorate([
        google_map_child_element_js_1.property(),
        __metadata("design:type", Object)
    ], GoogleMapMarker.prototype, "icon", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Number }),
        __metadata("design:type", Number)
    ], GoogleMapMarker.prototype, "zIndex", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Number, reflect: true }),
        __metadata("design:type", Number)
    ], GoogleMapMarker.prototype, "latitude", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Number, reflect: true }),
        __metadata("design:type", Number)
    ], GoogleMapMarker.prototype, "longitude", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: String }),
        __metadata("design:type", String)
    ], GoogleMapMarker.prototype, "label", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: String }),
        __metadata("design:type", Number)
    ], GoogleMapMarker.prototype, "animation", void 0);
    __decorate([
        google_map_child_element_js_1.property({ type: Boolean }),
        __metadata("design:type", Object)
    ], GoogleMapMarker.prototype, "open", void 0);
    GoogleMapMarker = __decorate([
        google_map_child_element_js_1.customElement('google-map-marker'),
        __metadata("design:paramtypes", [])
    ], GoogleMapMarker);
    return GoogleMapMarker;
}(google_map_child_element_js_1.GoogleMapChildElement));
exports.GoogleMapMarker = GoogleMapMarker;
