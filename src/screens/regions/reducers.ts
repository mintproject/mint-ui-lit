import { IdMap, IdNameObject } from "../../app/reducers";
import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { REGIONS_LIST_TOP_REGIONS, REGIONS_LIST_SUB_REGIONS } from "./actions";

export type RegionMap = IdMap<Region>;

export interface Region extends IdNameObject {
    geojson_blob?: string, // This contains the whole geojson itself
    region_type?: string,
    bounding_box?: BoundingBox,
    model_catalog_uri?: string,
    categories?: RegionCategory[],
    subcategories?: IdMap<RegionCategory[]>
}

export interface RegionsState {
    regions?: RegionMap,
    top_region_ids?: string[],
    sub_region_ids?: IdMap<string[]>
}

export interface RegionCategory {
    id: string,
    description: string
}

export interface BoundingBox {
    xmin: number
    xmax: number
    ymin: number
    ymax: number
}

export interface Point {
    x: number,
    y: number
}

const INITIAL_STATE: RegionsState = {};

const regions: Reducer<RegionsState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case REGIONS_LIST_TOP_REGIONS:
            state.regions = {
                ...state.regions,
                ...action.regions
            };
            state.top_region_ids = Object.keys(action.regions)
            return {
                ...state
            }
        case REGIONS_LIST_SUB_REGIONS:
            state.regions = {
                ...state.regions,
                ...action.regions
            };
            if(!state.sub_region_ids) {
                state.sub_region_ids = {}
            }
            state.sub_region_ids[action.parentid] = Object.keys(action.regions)
            return {
                ...state
            };
    }
    return state;
}

export default regions;
