import { IdMap, IdNameObject } from "../../app/reducers";
import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { REGIONS_LIST, REGIONS_QUERY } from "./actions";

export type RegionList = IdMap<Region>;

export interface Region extends IdNameObject {
    geojson: string, // This points to the geojson uri
    geojson_blob: string, // This contains the whole geojson itself
    region_type?: string
}

export interface RegionsState {
    regions?: RegionList,
    query_result?: AllRegionsQueryResults
}

export type AllRegionsQueryResults = IdMap<RegionQueryResult>;
export type RegionQueryResult = IdMap<RegionList>;

const INITIAL_STATE: RegionsState = {};

const regions: Reducer<RegionsState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case REGIONS_LIST:
            return {
                ...state,
                regions: action.list
            }
        case REGIONS_QUERY:
            state.query_result = { ...state.query_result };
            state.query_result[action.parent_id] = state.query_result[action.parent_id] || {};
            state.query_result[action.parent_id][action.region_type] = action.list;
            return {
                ...state
            };
    }
    return state;
}

export default regions;