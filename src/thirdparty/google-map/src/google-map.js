"use strict";
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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var lit_element_1 = require("lit-element");
var decorators_js_1 = require("lit-element/lib/decorators.js");
var maps_api_js_1 = require("./maps-api.js");
var deferred_js_1 = require("./lib/deferred.js");
var mapEvents = [
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
var GoogleMap = /** @class */ (function (_super) {
    __extends(GoogleMap, _super);
    function GoogleMap() {
        var _this = _super.call(this) || this;
        /**
         * Version of the Google Maps API to use.
         */
        _this.apiVersion = '3.33';
        /**
         * A latitude to center the map on.
         */
        _this.latitude = 37.77493;
        /**
         * A longitude to center the map on.
         */
        _this.longitude = -122.41942;
        /**
         * A zoom level to set the map to.
         */
        _this.zoom = 10;
        /**
         * Map type to display. One of 'roadmap', 'satellite', 'hybrid', 'terrain'.
         */
        _this.mapTypeId = 'roadmap';
        /**
         * If set, the zoom level is set such that all markers (google-map-marker children) are brought into view.
         */
        _this.fitToMarkers = false;
        /**
         * If true, prevent the user from zooming the map interactively.
         */
        _this.disableZoom = false;
        /**
         * The markers on the map.
         */
        _this.markers = [];
        /**
         * If set, all other info windows on markers are closed when opening a new one.
         */
        _this.singleInfoWindow = false;
        //@query('slot')
        //private _slot!: HTMLSlotElement;
        //private _markersChildrenListener?: EventListener;
        _this._mapReadyDeferred = new deferred_js_1.Deferred();
        // Respond to child elements requesting a Map instance
        _this.addEventListener('google-map-get-map-instance', function (e) {
            console.log('google-map google-map-get-map-instance');
            var detail = e.detail;
            detail.mapReady = _this._mapReadyDeferred.promise;
        });
        return _this;
        // TODO(justinfagnani): Now that children register thmselves, figure out
        // when to call this._fitToMarkersChanged(), or remove the feature
    }
    GoogleMap.prototype.render = function () {
        return lit_element_1.html(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      <div id=\"map\"></div>\n      <slot @google-map-marker-open=", "></slot>\n  "], ["\n      <div id=\"map\"></div>\n      <slot @google-map-marker-open=", "></slot>\n  "])), this._onMarkerOpen);
    };
    GoogleMap.prototype.update = function (changedProperties) {
        if (changedProperties.has('apiKey')) {
            this._initGMap();
        }
        // Re-set options every update.
        // TODO(justinfagnani): Check to see if this hurts perf
        if (this.map !== undefined) {
            this.map.setOptions(this._getMapOptions());
        }
        _super.prototype.update.call(this, changedProperties);
    };
    GoogleMap.prototype._initGMap = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.map !== undefined) {
                            return [2 /*return*/];
                        }
                        // TODO(justinfagnani): support a global API as well - a singleton API
                        // instance shared for the whole window, where each element doesn't need
                        // its own API key.
                        return [4 /*yield*/, maps_api_js_1.loadGoogleMapsAPI(this.apiKey)];
                    case 1:
                        // TODO(justinfagnani): support a global API as well - a singleton API
                        // instance shared for the whole window, where each element doesn't need
                        // its own API key.
                        _a.sent();
                        this.map = new google.maps.Map(this._mapDiv, this._getMapOptions());
                        this._updateCenter();
                        mapEvents.forEach(function (event) { return _this._forwardEvent(event); });
                        this.dispatchEvent(new CustomEvent('google-map-ready'));
                        this._mapReadyDeferred.resolve(this.map);
                        return [2 /*return*/];
                }
            });
        });
    };
    GoogleMap.prototype._getMapOptions = function () {
        return __assign({ zoom: this.zoom, tilt: this.tilt, mapTypeId: this.mapTypeId, disableDefaultUI: this.disableDefaultUI, mapTypeControl: this.mapTypeControl, streetViewControl: this.streetViewControl, disableDoubleClickZoom: this.disableZoom, 
            // scrollwheel: this.scrollWheel,
            styles: this.styles, maxZoom: this.maxZoom, minZoom: this.minZoom, draggable: this.draggable }, this.options);
    };
    GoogleMap.prototype._onMarkerOpen = function (e) {
        console.log('_onMarkerOpen', e);
    };
    /**
     * Explicitly resizes the map, updating its center. This is useful if the
     * map does not show after you have unhidden it.
     *
     * @method resize
     */
    GoogleMap.prototype.resize = function () {
        if (this.map !== undefined) {
            // saves and restores latitude/longitude because resize can move the center
            var oldLatitude = this.latitude;
            var oldLongitude = this.longitude;
            google.maps.event.trigger(this.map, 'resize');
            this.latitude = oldLatitude; // restore because resize can move our center
            this.longitude = oldLongitude;
            if (this.fitToMarkers) { // we might not have a center if we are doing fit-to-markers
                this._fitToMarkersChanged();
            }
        }
    };
    GoogleMap.prototype._updateCenter = function () {
        console.log('_updateCenter');
        if (this.map !== undefined && this.latitude !== undefined && this.longitude !== undefined) {
            var newCenter = new google.maps.LatLng(this.latitude, this.longitude);
            var oldCenter = this.map.getCenter();
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
    };
    GoogleMap.prototype._fitToMarkersChanged = function () {
        // TODO(ericbidelman): respect user's zoom level.
        if (this.map && this.fitToMarkers && this.markers.length > 0) {
            var latLngBounds = new google.maps.LatLngBounds();
            for (var _i = 0, _a = this.markers; _i < _a.length; _i++) {
                var m = _a[_i];
                latLngBounds.extend(new google.maps.LatLng(m.latitude, m.longitude));
            }
            // For one marker, don't alter zoom, just center it.
            if (this.markers.length > 1) {
                this.map.fitBounds(latLngBounds);
            }
            this.map.setCenter(latLngBounds.getCenter());
        }
    };
    /**
     * Forwards Maps API events as DOM CustomEvents
     */
    GoogleMap.prototype._forwardEvent = function (name) {
        var _this = this;
        google.maps.event.addListener(this.map, name, function (event) {
            _this.dispatchEvent(new CustomEvent("google-map-" + name, {
                detail: {
                    mapsEvent: event,
                }
            }));
        });
    };
    GoogleMap.styles = lit_element_1.css(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    :host {\n      position: relative;\n      display: block;\n      height: 100%;\n    }\n    #map {\n      position: absolute;\n      top: 0;\n      right: 0;\n      bottom: 0;\n      left: 0;\n    }\n  "], ["\n    :host {\n      position: relative;\n      display: block;\n      height: 100%;\n    }\n    #map {\n      position: absolute;\n      top: 0;\n      right: 0;\n      bottom: 0;\n      left: 0;\n    }\n  "])));
    __decorate([
        decorators_js_1.property({ attribute: 'api-key' }),
        __metadata("design:type", String)
    ], GoogleMap.prototype, "apiKey", void 0);
    __decorate([
        decorators_js_1.property({ attribute: 'api-version' }),
        __metadata("design:type", Object)
    ], GoogleMap.prototype, "apiVersion", void 0);
    __decorate([
        decorators_js_1.property(),
        __metadata("design:type", String)
    ], GoogleMap.prototype, "mapsUrl", void 0);
    __decorate([
        decorators_js_1.property({ attribute: 'client-id' }),
        __metadata("design:type", String)
    ], GoogleMap.prototype, "clientId", void 0);
    __decorate([
        decorators_js_1.property({ type: Number }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "latitude", void 0);
    __decorate([
        decorators_js_1.property({ type: Number }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "longitude", void 0);
    __decorate([
        decorators_js_1.property({ type: Number }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "zoom", void 0);
    __decorate([
        decorators_js_1.property({ type: Number }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "tilt", void 0);
    __decorate([
        decorators_js_1.property({ type: String, reflect: true }),
        __metadata("design:type", String)
    ], GoogleMap.prototype, "mapTypeId", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'disable-default-ui' }),
        __metadata("design:type", Boolean)
    ], GoogleMap.prototype, "disableDefaultUI", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'map-type-control' }),
        __metadata("design:type", Boolean)
    ], GoogleMap.prototype, "mapTypeControl", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'street-view-control' }),
        __metadata("design:type", Boolean)
    ], GoogleMap.prototype, "streetViewControl", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'fit-to-markers' }),
        __metadata("design:type", Object)
    ], GoogleMap.prototype, "fitToMarkers", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'disable-zoom' }),
        __metadata("design:type", Object)
    ], GoogleMap.prototype, "disableZoom", void 0);
    __decorate([
        decorators_js_1.property({ type: Object }),
        __metadata("design:type", Array)
    ], GoogleMap.prototype, "styles", void 0);
    __decorate([
        decorators_js_1.property({ type: Number, attribute: 'max-zoom' }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "maxZoom", void 0);
    __decorate([
        decorators_js_1.property({ type: Number, attribute: 'min-zoom' }),
        __metadata("design:type", Number)
    ], GoogleMap.prototype, "minZoom", void 0);
    __decorate([
        decorators_js_1.property(),
        __metadata("design:type", String)
    ], GoogleMap.prototype, "language", void 0);
    __decorate([
        decorators_js_1.property({ type: Object }),
        __metadata("design:type", Object)
    ], GoogleMap.prototype, "options", void 0);
    __decorate([
        decorators_js_1.property({ type: Boolean, attribute: 'single-info-window' }),
        __metadata("design:type", Object)
    ], GoogleMap.prototype, "singleInfoWindow", void 0);
    __decorate([
        decorators_js_1.query('#map'),
        __metadata("design:type", HTMLDivElement)
    ], GoogleMap.prototype, "_mapDiv", void 0);
    GoogleMap = __decorate([
        decorators_js_1.customElement('google-map'),
        __metadata("design:paramtypes", [])
    ], GoogleMap);
    return GoogleMap;
}(lit_element_1.LitElement));
exports.GoogleMap = GoogleMap;
var templateObject_1, templateObject_2;
