import { IdMap, IdNameObject } from "../../app/reducers";
import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import {
  REGIONS_LIST_TOP_REGIONS,
  REGIONS_LIST_SUB_REGIONS,
  REGIONS_SET_PREVIEW,
  REGIONS_LIST_CATEGORIES,
} from "./actions";

export type RegionMap = IdMap<Region>;

export interface Region extends IdNameObject {
  bounding_box?: BoundingBox;
  model_catalog_uri?: string;
  category_id: string;
  geometries: any[];
}

export interface RegionsState {
  regions?: RegionMap;
  top_region_ids?: string[];
  sub_region_ids?: IdMap<string[]>;
  categories?: IdMap<RegionCategory>;
  bbox_preview?: BoundingBox[];
}

export interface RegionCategory extends IdNameObject {
  citation?: string;
  subcategories?: RegionCategory[];
}

export interface BoundingBox {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface Point {
  x: number;
  y: number;
}

const INITIAL_STATE: RegionsState = {};

const regions: Reducer<RegionsState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case REGIONS_LIST_CATEGORIES:
      state.categories = {
        ...action.categories,
      };
      return {
        ...state,
      };
    case REGIONS_LIST_TOP_REGIONS:
      state.regions = {
        ...state.regions,
        ...action.regions,
      };
      state.top_region_ids = Object.keys(action.regions);
      return {
        ...state,
      };
    case REGIONS_LIST_SUB_REGIONS:
      state.regions = {
        ...state.regions,
        ...action.regions,
      };
      if (!state.sub_region_ids) {
        state.sub_region_ids = {};
      }
      state.sub_region_ids[action.parentid] = Object.keys(action.regions);
      return {
        ...state,
      };
    case REGIONS_SET_PREVIEW:
      return {
        ...state,
        bbox_preview: action.payload,
      };
  }
  return state;
};

export default regions;
