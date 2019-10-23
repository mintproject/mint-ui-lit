import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import { EXAMPLE_REGION_DATA } from "../../offline_data/sample_scenarios";
import { db } from "../../config/firebase";
import { RegionList, Region, BoundingBox } from "./reducers";
import { OFFLINE_DEMO_MODE } from "../../app/actions";

export const REGIONS_LIST = 'REGIONS_LIST';
export const REGIONS_QUERY = 'REGIONS_QUERY';
//export const REGIONS_ADD = 'REGIONS_ADD';

export interface RegionsActionList extends Action<'REGIONS_LIST'> { list: RegionList };
export interface RegionsActionQuery extends Action<'REGIONS_QUERY'> { 
    parent_id: string, region_type: string, list: RegionList 
};
//export interface RegionsActionAdd extends Action<'REGIONS_ADD'> { loading: boolean };

export type RegionsAction =  RegionsActionList | RegionsActionQuery;

// List Regions
type ListRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionList>;
export const listTopRegions: ActionCreator<ListRegionsThunkResult> = () => (dispatch) => {
    // Here you would normally get the data from the server. We're simulating
    // that by dispatching an async action (that you would dispatch when you
    // succesfully got the data back)
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: REGIONS_LIST,
            list: EXAMPLE_REGION_DATA
        });
        return;
    }

    db.collection("regions").get().then((querySnapshot) => {
        let regions:RegionList = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
            regions[doc.id].bounding_box = _calculateBoundingBox(regions[doc.id].geojson_blob);
        });
        dispatch({
            type: REGIONS_LIST,
            list: regions
        });
    });
};

const _calculateBoundingBox = (geojsonBlob: any) => {
    let regionGeoJson = JSON.parse(geojsonBlob);
    var xmin=99999, ymin=99999, xmax=-99999, ymax=-99999;
    var geometry = regionGeoJson.features ? 
      regionGeoJson.features[0].geometry :
      regionGeoJson.geometry;

    let coords_list = geometry.coordinates;
    if(geometry.type == "MultiPolygon") {
        coords_list = coords_list.flat(1);
    }

    coords_list.map((coords: any) => {
        coords.map((c: any) => {
            if(c[0] < xmin)
                xmin = c[0];
            if(c[1] < ymin)
                ymin = c[1];
            if(c[0] > xmax)
                xmax = c[0];
            if(c[1] > ymax)
                ymax = c[1];
        })
    })

    return {
      xmin: xmin-0.01, 
      ymin: ymin-0.01, 
      xmax: xmax+0.01, 
      ymax: ymax+0.01
    } as BoundingBox;
}

export const calculateMapDetails = (regions: Region[], mapWidth: number, mapHeight: number) => {
    let extent = {
      xmin: 99999, xmax: -99999,
      ymin: 99999, ymax: -99999
    }
    regions.map((region) => {
      let bbox = region.bounding_box;
      if(bbox.xmin < extent.xmin)
          extent.xmin = bbox.xmin;
      if(bbox.ymin < extent.ymin)
          extent.ymin = bbox.ymin;            
      if(bbox.xmax > extent.xmax)
          extent.xmax = bbox.xmax;
      if(bbox.ymax > extent.ymax)
          extent.ymax = bbox.ymax;
    })

    let zoom = _calculateZoom(extent, mapWidth, mapHeight)
    if (zoom < 2)
        zoom = 2;
    return {
      latitude: (extent.ymin + extent.ymax)/2,
      longitude: (extent.xmin + extent.xmax)/2,
      zoom: zoom
    }
}

const _calculateZoom = (extent : any, mapWidth: number, mapHeight: number) => {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function zoom(mapPx: number, worldPx: number, fraction: number) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
    var latFraction = (extent.xmax - extent.xmin)/360;
    var lngFraction = (extent.ymax - extent.ymin)/360;

    var latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

// Query Regions
type QueryRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionQuery>;
export const queryRegions: ActionCreator<QueryRegionsThunkResult> = (parentid: string, type: string) => (dispatch) => {
    // Here you would normally get the data from the server. We're simulating
    // that by dispatching an async action (that you would dispatch when you
    // succesfully got the data back)
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: REGIONS_QUERY,
            parent_id: parentid,
            region_type: type,
            list: EXAMPLE_REGION_DATA
        });
        return;
    }
    console.log("Querying " + type +" regions for " + parentid);
    // FIXME: Make this a listener like scenario 
    // - Think of ramifications ? (could this be called multiple times ?)

    let collRef : firebase.firestore.CollectionReference | firebase.firestore.Query
    = db.collection("regions/"+parentid+"/subregions");
    
    if(type) {
        collRef = collRef.where("region_type", "==", type);
    }
    
    collRef.onSnapshot((querySnapshot) => {
        let regions:RegionList = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
            regions[doc.id].bounding_box = _calculateBoundingBox(regions[doc.id].geojson_blob);
        });
        dispatch({
            type: REGIONS_QUERY,
            parent_id: parentid,
            region_type: type,
            list: regions
        });
    });
};

function chunkRegions(array: Region[], size: number) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
      chunked_arr.push(array.slice(index, size + index));
      index += size;
    }
    return chunked_arr;
}

export const addRegions = (parent_regionid: string, regions: Region[]) : Promise<void[]> =>  {
    let chunks = chunkRegions(regions, 500);
    let subregionsRef = db.collection("regions/" + parent_regionid + "/subregions");
    return Promise.all(
        chunks.map((regionlist) => {
            let batch = db.batch();
            regionlist.map((region) => {
                batch.set(subregionsRef.doc(), region);
            })
            return batch.commit();
        })
    );
};