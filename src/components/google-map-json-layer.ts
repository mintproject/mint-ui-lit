import { GoogleMapChildElement, customElement, property } from '../thirdparty/google-map/src/lib/google-map-child-element';

@customElement('google-map-json-layer')
export class GoogleMapJsonLayer extends GoogleMapChildElement {
  static initialSetup: boolean;

  @property({type: String})
  id!: string;

  @property({type: String})
  url?: string;

  @property({type: Boolean})
  selected?: boolean;

  @property({type: Array})
  features?: google.maps.Data.Feature[];

  constructor() {
    super();
  }

  update(changedProperties: Map<PropertyKey, any>) {
    if (changedProperties.has('map')) {
      this._mapChanged();
    }
    super.update(changedProperties);
  }

  _mapChanged() {
    if (this.map && this.map instanceof google.maps.Map && this.url) {
      let layer = this;
      var map = this.map;

      this.map.data.loadGeoJson(this.url, {}, (features) => {
        layer.features = features;
        features.map((feature) => {
          feature.setProperty("id", this.id);
          feature.setProperty("selected", this.selected);
        })
      });

      // Do initial setup if already not done
      if(!GoogleMapJsonLayer.initialSetup) {
        // Initial style
        this.map.data.setStyle(function(feature) {
          let selected = feature.getProperty("selected");
          return {
            fillColor: selected ? '#d51990' : '#1990d5',
            strokeColor: selected ? '#d51990' : '#1990d5',
            strokeWeight: 1
          }
        });

        map.data.addListener('click', function(event) {
          // Deselect all features
          map.data.forEach((feature) => {
            feature.setProperty("selected", false);
          });
          // Select the clicked feature
          event.feature.setProperty("selected", true);

          let myEvent = new CustomEvent("click", { 
            detail: {id: event.feature.getProperty("id") },
            bubbles: true, 
            composed: true });
          layer.dispatchEvent(myEvent);
        });
        GoogleMapJsonLayer.initialSetup = true;
      }
    }
  }
}
