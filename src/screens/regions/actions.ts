import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import {
  Region,
  BoundingBox,
  Point,
  RegionMap,
  RegionCategory,
} from "./reducers";
import { GraphQL } from "config/graphql";
import { GeoShape } from "@mintproject/modelcatalog_client";

import listTopRegionsGQL from "../../queries/region/list-top.graphql";
import listSubRegionsGQL from "../../queries/region/list-subregions.graphql";
import listRegionCategoriesGQL from "../../queries/region/list-categories.graphql";
import getRegionDetailsGQL from "../../queries/region/get.graphql";
import addRegionsGQL from "../../queries/region/new.graphql";

import { IdMap } from "app/reducers";
import { regionFromGQL, regionToGQL } from "util/graphql_adapter";
import { KeycloakAdapter } from "util/keycloak-adapter";

export const REGIONS_LIST_CATEGORIES = "REGIONS_LIST_CATEGORIES";
export const REGIONS_LIST_TOP_REGIONS = "REGIONS_LIST_TOP_REGIONS";
export const REGIONS_LIST_SUB_REGIONS = "REGIONS_LIST_SUB_REGIONS";
//export const REGIONS_ADD = 'REGIONS_ADD';
export const REGIONS_SET_PREVIEW = "REGIONS_SET_PREVIEW";

export interface RegionsActionListCategories
  extends Action<"REGIONS_LIST_CATEGORIES"> {
  categories: IdMap<RegionCategory>;
}
export interface RegionsActionListTopRegions
  extends Action<"REGIONS_LIST_TOP_REGIONS"> {
  regions: RegionMap;
}
export interface RegionsActionListSubRegions
  extends Action<"REGIONS_LIST_SUB_REGIONS"> {
  parentid: string;
  regions: RegionMap;
}
//export interface RegionsActionAdd extends Action<'REGIONS_ADD'> { loading: boolean };

export interface RegionsActionSetPreview extends Action<"REGIONS_SET_PREVIEW"> {
  payload: BoundingBox[];
}

export type RegionsAction =
  | RegionsActionListCategories
  | RegionsActionListTopRegions
  | RegionsActionListSubRegions
  | RegionsActionSetPreview;

// Set bbox preview
type BBoxPreviewThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  RegionsActionSetPreview
>;
export const setPreview: ActionCreator<BBoxPreviewThunkResult> =
  (bbox: BoundingBox[]) => (dispatch) => {
    dispatch({
      type: REGIONS_SET_PREVIEW,
      payload: bbox,
    });
  };

// List Region Categories
type ListCategoriesThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  RegionsActionListCategories
>;
export const listRegionCategories: ActionCreator<ListCategoriesThunkResult> =
  () => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
      query: listRegionCategoriesGQL,
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
      } else {
        let categories = {} as IdMap<RegionCategory>;
        result.data.region_category.forEach((catobj: any) => {
          let category = {
            id: catobj.id,
            name: catobj.name,
            citation: catobj.citation,
          } as RegionCategory;
          categories[category.id] = category;
        });
        let subcatids = [];
        result.data.region_category.forEach((catobj: any) => {
          categories[catobj.id].subcategories = catobj.sub_categories.map(
            (subobj) => {
              subcatids.push(subobj.region_category_id);
              return categories[subobj.region_category_id];
            }
          );
        });
        subcatids.forEach((subcatid) => {
          delete categories[subcatid];
        });
        dispatch({
          type: REGIONS_LIST_CATEGORIES,
          categories,
        });
      }
    });
  };

// List Regions
type ListRegionsThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  RegionsActionListTopRegions
>;
export const listTopRegions: ActionCreator<ListRegionsThunkResult> =
  () => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
      query: listTopRegionsGQL,
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
      } else {
        let regions = {} as RegionMap;
        result.data.region.forEach((regionobj) => {
          let region = regionFromGQL(regionobj);
          region.bounding_box = _calculateBoundingBox(region.geometries);
          regions[region.id] = region;
        });
        dispatch({
          type: REGIONS_LIST_TOP_REGIONS,
          regions,
        });
      }
    });
  };

const _calculateBoundingBox = (geometries: any[]) => {
  var xmin = 99999,
    ymin = 99999,
    xmax = -99999,
    ymax = -99999;
  geometries.forEach((geometry) => {
    let coords_list = geometry.coordinates;
    if (geometry.type == "MultiPolygon") {
      coords_list = coords_list.flat(1);
    }

    coords_list.map((coords: any) => {
      coords.map((c: any) => {
        if (c[0] < xmin) xmin = c[0];
        if (c[1] < ymin) ymin = c[1];
        if (c[0] > xmax) xmax = c[0];
        if (c[1] > ymax) ymax = c[1];
      });
    });
  });

  return {
    xmin: xmin - 0.01,
    ymin: ymin - 0.01,
    xmax: xmax + 0.01,
    ymax: ymax + 0.01,
  } as BoundingBox;
};

export const getBoundingBoxFromGeoShape = (shape: GeoShape): BoundingBox => {
  let bb: BoundingBox = null;
  if (shape && shape.box && shape.box.length > 0) {
    let coords: string[] = shape.box[0].split(/,| /);
    if (coords.length === 4) {
      try {
        bb = {
          xmin: parseFloat(coords[0]),
          ymin: parseFloat(coords[1]),
          xmax: parseFloat(coords[2]),
          ymax: parseFloat(coords[3]),
        };
      } catch (error) {
        console.warn("Could not parse bounding box '" + shape.box[0] + "'");
      }
    }
  }
  return bb;
};

export const pointInPolygon = (point, polygon) => {
  let x = point[0];
  let y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0];
    let yi = polygon[i][1];
    let xj = polygon[j][0];
    let yj = polygon[j][1];

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const bboxInRegion = (bbox: BoundingBox, region: Region): boolean => {
  let points = [
    [bbox.xmin, bbox.ymin],
    [bbox.xmin, bbox.ymax],
    [bbox.xmax, bbox.ymin],
    [bbox.xmax, bbox.ymax],
  ];

  for (let index in region.geometries) {
    let geometry: any = region.geometries[index];
    let poly = geometry.coordinates[0][0];
    if (points.some((point) => pointInPolygon(point, poly))) return true;
  }
  return false;
};

export const doBoxesIntersect = (
  box1: BoundingBox,
  box2: BoundingBox
): boolean => {
  return (
    box1.xmin <= box2.xmax &&
    box1.xmax >= box2.xmin &&
    box1.ymin <= box2.ymax &&
    box1.ymax >= box2.ymin
  );
};

// Query for Sub Regions
type SubRegionsThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  RegionsActionListSubRegions
>;
export const listSubRegions: ActionCreator<SubRegionsThunkResult> =
  (regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
      query: listSubRegionsGQL,
      variables: {
        regionId: regionid,
      },
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
      } else {
        let regions = {} as RegionMap;
        result.data.region.forEach((regionobj) => {
          let region = regionFromGQL(regionobj);
          region.bounding_box = _calculateBoundingBox(region.geometries);
          regions[region.id] = region;
        });
        dispatch({
          type: REGIONS_LIST_SUB_REGIONS,
          parentid: regionid,
          regions,
        });
      }
    });
  };

export const filterRegionsOfType = (
  regionids: string[],
  regions: RegionMap,
  type: string
) => {
  return regionids.filter((regionid) => {
    return regions[regionid].category_id == type;
  });
};

// Get details about a particular region/subregion
export const getRegionDetails = (regionid: string, subregionid: string) => {
  let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
  return new Promise<Region>((resolve, reject) => {
    APOLLO_CLIENT.query({
      query: getRegionDetailsGQL,
      variables: {
        id: subregionid,
      },
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
        reject();
      } else {
        let region = regionFromGQL(result.data.region_by_pk);
        region.bounding_box = _calculateBoundingBox(region.geometries);
        resolve(region);
      }
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

export const addRegions = (
  parent_regionid: string,
  regions: Region[]
): Promise<any[]> => {
  let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
  let chunks = chunkRegions(regions, 500);
  return Promise.all(
    chunks.map((regionlist) => {
      let objects = regionlist.map((region: Region) => {
        let regionobj = regionToGQL(region);
        regionobj["parent_region_id"] = parent_regionid;
        return regionobj;
      });
      return APOLLO_CLIENT.mutate({
        mutation: addRegionsGQL,
        variables: {
          objects: objects,
        },
      });
    })
  );
};

export const addSubcategory = (
  parent_regionid: string,
  category: string,
  subcategory_name: string,
  subcategory_desc: string
): Promise<any> => {
  return Promise.reject();
  /* TODO: Change to work with graphql
    let regionRef = db.collection('regions').doc(parent_regionid);
    return new Promise ((resolve, reject) => {
        regionRef.get().then((doc) => {
            let subcategories = doc.get('subcategories') || {};
            if (!subcategories[category]) subcategories[category] = [];
            subcategories[category].push({ id: subcategory_name, description: subcategory_desc});
            let setWithMerge = regionRef.set({subcategories: subcategories}, {merge: true});
            setWithMerge.then(resolve);
        })
    }); */
};

export const removeSubcategory = (
  parent_regionid: string,
  category: string,
  subcategory: string
): Promise<any> => {
  return Promise.reject();
  /* TODO: Change to work with graphql
    let regionRef = db.collection('regions').doc(parent_regionid);

    return new Promise ((resolve, reject) => {
        regionRef.get().then((doc) => {
            let subcategories = doc.get('subcategories') || {};
            if (category in subcategories) {
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
    });*/
};

export const renameSubcategory = (
  parent_regionid: string,
  old_category: string,
  new_category: string
) => {
  /* TODO: Change to work with graphql
    let renameQuery = db.collection('regions/' + parent_regionid + '/subregions').where('region_type', '==', old_category);
    renameQuery.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            db.collection('regions/' + parent_regionid + '/subregions' ).doc(doc.id).update({'region_type': new_category});
        });
    });*/
};

/* 
Helper Function
*/
export const calculateMapDetailsForPoints = (
  points: Point[],
  mapWidth: number,
  mapHeight: number
) => {
  let extent = {
    xmin: 99999,
    xmax: -99999,
    ymin: 99999,
    ymax: -99999,
  };
  points.map((point) => {
    if (point.x < extent.xmin) extent.xmin = point.x - 0.00001;
    if (point.y < extent.ymin) extent.ymin = point.y - 0.00001;
    if (point.x > extent.xmax) extent.xmax = point.x + 0.00001;
    if (point.y > extent.ymax) extent.ymax = point.y + 0.00001;
  });

  let zoom = _calculateZoom(extent, mapWidth, mapHeight);
  if (zoom < 2) zoom = 2;
  return {
    latitude: (extent.ymin + extent.ymax) / 2,
    longitude: (extent.xmin + extent.xmax) / 2,
    zoom: zoom,
  };
};

export const calculateMapDetails = (
  regions: Region[],
  mapWidth: number,
  mapHeight: number
) => {
  let extent = {
    xmin: 99999,
    xmax: -99999,
    ymin: 99999,
    ymax: -99999,
  };
  regions.forEach((region) => {
    if (region.bounding_box) {
      let bbox = region.bounding_box;
      if (bbox.xmin < extent.xmin) extent.xmin = bbox.xmin;
      if (bbox.ymin < extent.ymin) extent.ymin = bbox.ymin;
      if (bbox.xmax > extent.xmax) extent.xmax = bbox.xmax;
      if (bbox.ymax > extent.ymax) extent.ymax = bbox.ymax;
    } else if (region.geometries && region.geometries.length > 0) {
      region.geometries.forEach((geometry) => {
        if (
          (geometry.type == "Polygon" || geometry.type == "MultiPolygon") &&
          geometry.coordinates &&
          geometry.coordinates.length > 0
        ) {
          geometry.coordinates.forEach((polygon) => {
            if (polygon && polygon.length > 0) {
              if (geometry.type == "Polygon")
                polygon.forEach((coord) => {
                  if (coord && coord.length == 2) {
                    if (coord[0] < extent.xmin) extent.xmin = coord[0];
                    if (coord[0] > extent.xmax) extent.xmax = coord[0];
                    if (coord[1] < extent.ymin) extent.ymin = coord[1];
                    if (coord[1] > extent.ymax) extent.ymax = coord[1];
                  }
                });
              else if (geometry.type == "MultiPolygon") {
                polygon.forEach((pol2) =>
                  pol2.map((coord) => {
                    if (coord && coord.length == 2) {
                      if (coord[0] < extent.xmin) extent.xmin = coord[0];
                      if (coord[0] > extent.xmax) extent.xmax = coord[0];
                      if (coord[1] < extent.ymin) extent.ymin = coord[1];
                      if (coord[1] > extent.ymax) extent.ymax = coord[1];
                    }
                  })
                );
              }
            }
          });
        }
      });
    }
  });

  let zoom = _calculateZoom(extent, mapWidth, mapHeight);
  if (zoom < 2) zoom = 2;
  return {
    latitude: (extent.ymin + extent.ymax) / 2,
    longitude: (extent.xmin + extent.xmax) / 2,
    zoom: zoom,
  };
};

const _calculateZoom = (extent: any, mapWidth: number, mapHeight: number) => {
  var WORLD_DIM = { height: 256, width: 256 };
  var ZOOM_MAX = 15;

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }
  var latFraction = (extent.xmax - extent.xmin) / 360;
  var lngFraction = (extent.ymax - extent.ymin) / 360;

  var latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
  var lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
};
