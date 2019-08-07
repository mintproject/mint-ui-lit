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

  @property({type: Function})
  onClick?: Function;

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
          // Change style on click
          map.data.setStyle(function(feature) {
            return {
              fillColor: (feature == event.feature ? '#d51990' : '#1990d5'),
              strokeColor: (feature == event.feature ? '#d51990' : '#1990d5'),
              strokeWeight: 1
            };
          });
          if(layer.onClick) {
            layer.onClick(event.feature.getProperty("id"));
          }
        });
        GoogleMapJsonLayer.initialSetup = true;
      }
    }
  }
}
