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
//import { loadGoogleMapsAPI } from '../maps-api';
var lit_element_2 = require("lit-element");
exports.html = lit_element_2.html;
exports.svg = lit_element_2.svg;
exports.css = lit_element_2.css;
var decorators_js_2 = require("lit-element/lib/decorators.js");
exports.customElement = decorators_js_2.customElement;
exports.property = decorators_js_2.property;
exports.query = decorators_js_2.query;
/**
 * Base class that helps manage references to the containing google.maps.Map
 * instance.
 */
var GoogleMapChildElement = /** @class */ (function (_super) {
    __extends(GoogleMapChildElement, _super);
    function GoogleMapChildElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GoogleMapChildElement.prototype.render = function () {
        return lit_element_1.html(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<slot></slot>"], ["<slot></slot>"])));
    };
    /**
     * Gets an instance of google.maps.Map by firing a google-map-get-map-instance
     * event to request the instance from an ancestor element. GoogleMap responds
     * to this event.
     */
    GoogleMapChildElement.prototype._getMapInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var detail;
            return __generator(this, function (_a) {
                detail = {};
                this.dispatchEvent(new CustomEvent('google-map-get-map-instance', {
                    bubbles: true,
                    detail: detail,
                }));
                return [2 /*return*/, detail.mapReady];
            });
        });
    };
    GoogleMapChildElement.prototype.connectedCallback = function () {
        var _this = this;
        _super.prototype.connectedCallback.call(this);
        this.mapReady = this._getMapInstance();
        this.mapReady.then(function (map) {
            _this.map = map;
        });
    };
    GoogleMapChildElement.styles = lit_element_1.css(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    :host {\n      display: none;\n    }\n  "], ["\n    :host {\n      display: none;\n    }\n  "])));
    __decorate([
        decorators_js_1.property(),
        __metadata("design:type", google.maps.Map)
    ], GoogleMapChildElement.prototype, "map", void 0);
    return GoogleMapChildElement;
}(lit_element_1.LitElement));
exports.GoogleMapChildElement = GoogleMapChildElement;
var templateObject_1, templateObject_2;
