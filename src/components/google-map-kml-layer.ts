import {
  GoogleMapChildElement,
  customElement,
  property,
} from "../thirdparty/google-map/src/lib/google-map-child-element";

@customElement("google-map-kml-layer")
export class GoogleMapKMLLayer extends GoogleMapChildElement {
  @property()
  url?: string;

  constructor() {
    super();
  }

  update(changedProperties: Map<PropertyKey, any>) {
    if (changedProperties.has("map")) {
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
        fillColor: "#1990d5",
        strokeColor: "#1990d5",
        strokeWeight: 1,
      });

      var kmlLayer = new google.maps.KmlLayer({
        url: this.url,
        suppressInfoWindows: false,
        preserveViewport: false,
        map: this.map,
        screenOverlays: false,
      });

      kmlLayer.addListener("click", function (event) {
        var content = event.featureData.infoWindowHtml;
        console.log(content);
      });
    }
  }
}
