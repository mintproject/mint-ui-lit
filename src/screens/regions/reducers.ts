import { IdMap, IdNameObject } from "../../app/reducers";
import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { REGIONS_LIST } from "./actions";

export type RegionList = IdMap<Region>;

export interface Region extends IdNameObject {
    geojson: string,
    parent_regionid?: string
}

export interface RegionsState {
    regions?: RegionList
}

const INITIAL_STATE: RegionsState = {};

const regions: Reducer<RegionsState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case REGIONS_LIST:
            return {
                ...state,
                regions: action.list
            }
    }
    return state;
}

export default regions;