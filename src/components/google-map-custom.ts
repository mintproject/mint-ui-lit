import { GoogleMap } from '../thirdparty/google-map/src/google-map';
import { customElement } from 'lit-element';
import { Region, BoundingBox, Point } from 'screens/regions/reducers';
import { calculateMapDetails, calculateMapDetailsForPoints } from 'screens/regions/actions';
import { geometriesToGeoJson } from 'util/geometry_functions';

@customElement('google-map-custom')
export class GoogleMapCustom extends GoogleMap {
    infoWindow: google.maps.InfoWindow;

    constructor() {
        super();
        this.addEventListener('google-map-ready', (e: Event) => {
            this.setEventHandlers();
        });
    }

    public clear() {
        this.map.data.forEach((feature) => {
            this.map.data.remove(feature);
        })
    }

    private getDimensions() {
        // let rect = this.getBoundingClientRect();
        // return rect;
        return {width: 800, height: 400};
    }

    public alignMapToRegions(regions: Region[]) {
        let rect = this.getDimensions();
        let midpoint = calculateMapDetails(regions, rect.width, rect.height);
        this.map.setCenter({
            "lat": midpoint.latitude, 
            "lng": midpoint.longitude
        });
        this.map.setZoom(midpoint.zoom);
    }

    public setRegions(regions: Region[], selected_regionid: string) {
        this.clear();
        this.alignMapToRegions(regions);
        regions.map((region) => {
            let nregion = Object.assign({}, region);
            if(selected_regionid == region.id) {
                nregion["selected"] = true;
            }
            this.addRegion(nregion);
        });
    }

    public addRegion(region: Region) {
        let features = this.map.data.addGeoJson(geometriesToGeoJson(region.geometries));
        // TODO: Add click handlers for the region
        this.setFeatureProperties(region, features);
    }

    private setFeatureProperties(region: Region, features: google.maps.Data.Feature[]) {
        // Only allow 1 feature per layer
        features.map((feature) => {
          var bounds = new google.maps.LatLngBounds();
          if(feature.getGeometry()) {
            feature.getGeometry().forEachLatLng((latlng) => {
              bounds.extend(latlng);
            })
            feature.setProperty("center", bounds.getCenter());
          }
          feature.setProperty("region_id", region.id);
          feature.setProperty("region_name", region.name);
          feature.setProperty("selected", region["selected"]);
        })
    }

    private setEventHandlers() {
       // Initial style
       let map = this;

       this.map.data.setStyle(function(feature) {
        let selected = feature.getProperty("selected");
        return {
          fillColor: selected ? '#d51990' : '#1990d5',
          strokeColor: selected ? '#d51990' : '#1990d5',
          strokeWeight: 1,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#1990d5',
            fillOpacity: 0.8,
            strokeColor: '#1990d5',
            strokeOpacity: 0.9,
            strokeWeight: 1,
            scale: 2.5
          }
        }
      });

      this.map.data.addListener('mouseout', function(event) {
        if(map.infoWindow) {
          map.infoWindow.close();
        }
      });

      this.map.data.addListener('click', function(event) {
        // Deselect all features
        map.map.data.forEach((feature) => {
          feature.setProperty("selected", false);
        });

        // Select the clicked feature
        event.feature.setProperty("selected", true);

        // Show Info Window
        if (!map.infoWindow) 
            map.infoWindow = new google.maps.InfoWindow({});
        map.infoWindow.setContent(event.feature.getProperty("region_name")),
        map.infoWindow.setPosition(event.feature.getProperty("center") || event.latlng);
        map.infoWindow.open(map.map);

        // Fire a custom click event
        let myEvent = new CustomEvent("click", { 
          detail: {
            id: event.feature.getProperty("region_id"),
            name: event.feature.getProperty("region_name")
          },
          bubbles: true, 
          composed: true 
        });
        map.dispatchEvent(myEvent);
      });
    }

    public setBoundingBoxes(bboxes: BoundingBox[]) {
        this.clear();  
        this.alignMapToBoundingBoxes(bboxes);  
        bboxes.map((bbox) => this.addBoundingBox(bbox));    
    }

    public alignMapToBoundingBoxes(bboxes: BoundingBox[]) {
        let regions = bboxes.map((bbox) => { return {bounding_box: bbox} as Region});
        this.alignMapToRegions(regions);
    }

    public addBoundingBox(bbox: BoundingBox) {
        let polygon = new google.maps.Data.Polygon([[
            {"lat": bbox.ymax, "lng": bbox.xmin},
            {"lat": bbox.ymin, "lng": bbox.xmin},
            {"lat": bbox.ymin, "lng": bbox.xmax},
            {"lat": bbox.ymax, "lng": bbox.xmax}
            ]]);
        this.map.data.add({
            geometry: polygon
        });
    }

    public setPolygon(polygonArr: Array<Array<number>>) {
        this.clear();  
        let bbox : BoundingBox = {xmin: 91, xmax: -91, ymin: 181, ymax: -181};
        polygonArr.forEach(([lat, lng]) => {
            if (bbox.xmin > lat) bbox.xmin = lat;
            if (bbox.xmax < lat) bbox.xmax = lat;
            if (bbox.ymin > lng) bbox.ymin = lng;
            if (bbox.ymax < lng) bbox.ymax = lng;
        })
        this.alignMapToBoundingBoxes([bbox]);
        let polygon = new google.maps.Data.Polygon([
            polygonArr.map(arr => {return {lat: arr[0], lng: arr[1]}})
        ]);
        this.map.data.add({geometry: polygon});
    }

    public alignMapToPoints(points: Point[]) {
        let rect = this.getDimensions();
        let midpoint = calculateMapDetailsForPoints(points, rect.width, rect.height);
        this.map.setCenter({
            "lat": midpoint.latitude, 
            "lng": midpoint.longitude
        });
        this.map.setZoom(midpoint.zoom)
    }

    public setPoints(points: Point[]) {
        this.clear();
        this.alignMapToPoints(points);
        points.map((point) => this.addPoint(point));
    }

    public addPoint(point: Point) {
        let latlng = new google.maps.Data.Point({"lat": point.y, "lng": point.x});
        this.map.data.add({
            geometry: latlng
        });
    }
}
