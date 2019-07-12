import { GoogleMapChildElement, customElement, property } from '../thirdparty/google-map/src/lib/google-map-child-element';

@customElement('google-map-json-layer')
export class GoogleMapJsonLayer extends GoogleMapChildElement {
  @property()
  url?: string;

  constructor() {
    super();
    console.log('google-map-marker');
  }

  update(changedProperties: Map<PropertyKey, any>) {
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
}
