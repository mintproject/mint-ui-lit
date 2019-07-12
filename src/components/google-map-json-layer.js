var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { GoogleMapChildElement, customElement, property } from '../thirdparty/google-map/src/lib/google-map-child-element';
let GoogleMapJsonLayer = class GoogleMapJsonLayer extends GoogleMapChildElement {
    constructor() {
        super();
        console.log('google-map-marker');
    }
    update(changedProperties) {
        if (changedProperties.has('map')) {
            this._mapChanged();
        }
        /*
        if (changedProperties.has('open')) {
          this._openChanged();
        }
        */
        super.update(changedProperties);
    }
    _mapChanged() {
        if (this.map && this.map instanceof google.maps.Map && this.url) {
            this.map.data.setStyle({
                fillColor: '#1990d5',
                strokeColor: '#1990d5',
                strokeWeight: 1
            });
            // Remove existing layers
            var map = this.map;
            map.data.forEach(function (feature) {
                map.data.remove(feature);
            });
            this.map.data.loadGeoJson(this.url);
        }
    }
};
__decorate([
    property()
], GoogleMapJsonLayer.prototype, "url", void 0);
GoogleMapJsonLayer = __decorate([
    customElement('google-map-json-layer')
], GoogleMapJsonLayer);
export { GoogleMapJsonLayer };
