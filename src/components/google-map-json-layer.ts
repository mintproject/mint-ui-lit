import { GoogleMapChildElement, customElement, property } from '../thirdparty/google-map/src/lib/google-map-child-element';

@customElement('google-map-json-layer')
export class GoogleMapJsonLayer extends GoogleMapChildElement {
  @property({type: String})
  region_id!: string;

  @property({type: String})
  region_name!: string;

  @property({type: String})
  url?: string;

  @property({type: Object})
  json?: object;

  @property({type: Boolean})
  selected?: boolean;

  @property({type: Array})
  features?: google.maps.Data.Feature[];

  infoWindow: google.maps.InfoWindow;

  constructor() {
    super();
  }

  update(changedProperties: Map<PropertyKey, any>) {
    if (changedProperties.has('map')) {
      this._mapChanged();
    }
    super.update(changedProperties);
  }

  _geoJsonLoaded(features: google.maps.Data.Feature[]) {
      // Only allow 1 feature per layer
      this.features = features;
      features.map((feature) => {
        var bounds = new google.maps.LatLngBounds();
        if(feature.getGeometry()) {
          feature.getGeometry().forEachLatLng((latlng) => {
            bounds.extend(latlng);
          })
          feature.setProperty("center", bounds.getCenter());
        }
        feature.setProperty("region_id", this.region_id);
        feature.setProperty("region_name", this.region_name);
        feature.setProperty("selected", this.selected);
      })
  }

  _mapChanged() {
    if (this.map && this.map instanceof google.maps.Map) {
      let layer = this;
      var map = this.map;

      if(this.json) {
        let features = this.map.data.addGeoJson(this.json);
        this._geoJsonLoaded(features);
      }
      else if(this.url) {
        this.map.data.loadGeoJson(this.url, {}, (features) => {
          this._geoJsonLoaded(features);
        });
      }

      // Do initial setup if already not done
      if(!this.map.get("initialSetup")) {

        // Initial style
        this.map.data.setStyle(function(feature) {
          let selected = feature.getProperty("selected");
          return {
            fillColor: selected ? '#d51990' : '#1990d5',
            strokeColor: selected ? '#d51990' : '#1990d5',
            strokeWeight: 1
          }
        });

        this.map.data.addListener('mouseout', function(event) {
          if(layer.infoWindow) {
            layer.infoWindow.close();
          }
        });

        this.map.data.addListener('click', function(event) {
          // Deselect all features
          map.data.forEach((feature) => {
            feature.setProperty("selected", false);
          });

          // Select the clicked feature
          event.feature.setProperty("selected", true);

          // Show Info Window
          if (!layer.infoWindow) 
            layer.infoWindow = new google.maps.InfoWindow({});
          layer.infoWindow.setContent(event.feature.getProperty("region_name")),
          layer.infoWindow.setPosition(event.feature.getProperty("center") || event.latlng);
          layer.infoWindow.open(map);

          // Fire a custom click event
          let myEvent = new CustomEvent("click", { 
            detail: {
              id: event.feature.getProperty("region_id"),
              name: event.feature.getProperty("region_id")
            },
            bubbles: true, 
            composed: true 
          });
          layer.dispatchEvent(myEvent);
        });

        this.map.set("initialSetup", true);
      }
    }
  }
}
