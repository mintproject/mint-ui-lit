import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import { EXAMPLE_REGION_DATA } from "../../offline_data/sample_scenarios";
import { db } from "../../config/firebase";
import { Region, BoundingBox, Point, RegionMap } from "./reducers";
import { OFFLINE_DEMO_MODE } from "../../app/actions";

export const REGIONS_LIST_TOP_REGIONS = 'REGIONS_LIST_TOP_REGIONS';
export const REGIONS_LIST_SUB_REGIONS = 'REGIONS_LIST_SUB_REGIONS';
//export const REGIONS_ADD = 'REGIONS_ADD';

export interface RegionsActionListTopRegions extends Action<'REGIONS_LIST_TOP_REGIONS'> { 
    regions: RegionMap
};
export interface RegionsActionListSubRegions extends Action<'REGIONS_LIST_SUB_REGIONS'> { 
    parentid: string, 
    regions: RegionMap
};
//export interface RegionsActionAdd extends Action<'REGIONS_ADD'> { loading: boolean };

export type RegionsAction =  RegionsActionListTopRegions | RegionsActionListSubRegions;

// List Regions
type ListRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionListTopRegions>;
export const listTopRegions: ActionCreator<ListRegionsThunkResult> = () => (dispatch) => {
    db.collection("regions").get().then((querySnapshot) => {
        let regions:RegionMap = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
            regions[doc.id].bounding_box = _calculateBoundingBox(regions[doc.id].geojson_blob);
        });
        dispatch({
            type: REGIONS_LIST_TOP_REGIONS,
            regions
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

export const calculateMapDetailsForPoints = (points: Point[], mapWidth: number, mapHeight: number) => {
    let extent = {
      xmin: 99999, xmax: -99999,
      ymin: 99999, ymax: -99999
    }
    points.map((point) => {
      if(point.x < extent.xmin)
          extent.xmin = point.x - 0.00001;
      if(point.y < extent.ymin)
          extent.ymin = point.y - 0.00001;            
      if(point.x > extent.xmax)
          extent.xmax = point.x + 0.00001;
      if(point.y > extent.ymax)
          extent.ymax = point.y + 0.00001;
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
    var ZOOM_MAX = 15;

    function zoom(mapPx: number, worldPx: number, fraction: number) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
    var latFraction = (extent.xmax - extent.xmin)/360;
    var lngFraction = (extent.ymax - extent.ymin)/360;

    var latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

// Query for Sub Regions
type SubRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionListSubRegions>;
export const listSubRegions: ActionCreator<SubRegionsThunkResult> = (regionid: string) => (dispatch) => {
    let collRef : firebase.firestore.CollectionReference | firebase.firestore.Query
        = db.collection("regions/"+regionid+"/subregions");
    /*if(type) {
        collRef = collRef.where("region_type", "==", type);
    }*/
    
    console.log("Fetching subregions for " + regionid);
    collRef.onSnapshot((querySnapshot) => {
        let regions:RegionMap = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
            regions[doc.id].bounding_box = _calculateBoundingBox(regions[doc.id].geojson_blob);
        });
        dispatch({
            type: REGIONS_LIST_SUB_REGIONS,
            parentid: regionid,
            regions
        });
    });
};

export const filterRegionsOfType = (regionids: string[], regions: RegionMap, type: string) => {
    return regionids.filter((regionid) => {
        return regions[regionid].region_type == type;
    })
}

// Get details about a particular region/subregion
export const getRegionDetails = (regionid: string, subregionid: string) => {
    let docpath = "regions/"+regionid + (subregionid ? ("/subregions/" + subregionid) : "");
    let docRef : firebase.firestore.DocumentReference = db.doc(docpath);
    return new Promise<Region>((resolve, reject) => {
        docRef.get().then((doc) => {
            resolve(doc.data() as Region);
        })
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

export const addSubcategory = (parent_regionid: string, category: string, subcategory_name: string,
        subcategory_desc: string) : Promise<any> => {
    let regionRef = db.collection('regions').doc(parent_regionid);
    return new Promise ((resolve, reject) => {
        regionRef.get().then((doc) => {
            let subcategories = doc.get('subcategories') || {};
            if (!subcategories[category]) subcategories[category] = [];
            subcategories[category].push({ id: subcategory_name, description: subcategory_desc});
            let setWithMerge = regionRef.set({subcategories: subcategories}, {merge: true});
            setWithMerge.then(resolve);
        })
    });
};

export const removeSubcategory = (parent_regionid: string, category: string, subcategory: string) : Promise<any> => {
    let regionRef = db.collection('regions').doc(parent_regionid);

    return new Promise ((resolve, reject) => {
        regionRef.get().then((doc) => {
            let subcategories = doc.get('subcategories') || {};
            if (category in subcategories) {
                console.log(subcategories[category]);
                let index = subcategories[category].map(sc => sc.id).indexOf(subcategory);
                if (index >= 0) {
                    subcategories[category].splice(index, 1);
                    let setWithMerge = regionRef.set({subcategories: subcategories}, {merge: true});

                    setWithMerge.then(resolve);
                    //Remove all regions for that subcategory
                    let deleteQuery = db.collection('regions/' + parent_regionid + '/subregions').where('region_type', '==', subcategory);
                    deleteQuery.get().then((querySnapshot) => {
                        querySnapshot.forEach((doc) => {
                            doc.ref.delete();
                        });
                    });
                } else {
                    reject();
                }
            } else {
                reject();
            }
        })
    });
};
