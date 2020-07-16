import { RootAction } from "./store";
import { Reducer } from "redux";
import { UI_SELECT_SUBGOAL, UI_SELECT_PATHWAY, UI_SELECT_PATHWAY_SECTION, UI_SELECT_DATA_TRANSFORMATION,
    UI_SELECT_SCENARIO, UI_SELECT_TOP_REGION, UI_SELECT_THREAD, UI_SELECT_SUB_REGION } from "./ui-actions";

export interface UIState {
    selected_top_regionid?:string
    selected_sub_regionid?:string
    selected_scenarioid?:string
    selected_subgoalid?:string
    selected_pathwayid?:string
    selected_pathway_section?:string
    selected_threadid?:string
    selected_datatransformationid?:string
}

const INITIAL_STATE: UIState = {};

const ui: Reducer<UIState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UI_SELECT_TOP_REGION:
            return {
                ...state,
                selected_top_regionid: action.regionid,
            }
        case UI_SELECT_SUB_REGION:
            return {
                ...state,
                selected_sub_regionid: action.regionid,
            }            
        case UI_SELECT_THREAD:
            return {
                ...state,
                selected_threadid: action.threadid,
            }
        case UI_SELECT_SCENARIO:
            return {
                ...state,
                selected_scenarioid: action.scenarioid,
                selected_subgoalid: "",
                selected_pathwayid: "",
                selected_pathway_section: "",
            }
        case UI_SELECT_SUBGOAL:
            return {
                ...state,
                selected_subgoalid: action.subgoalid,
                selected_pathwayid: "",
                selected_pathway_section: "",
            }
        case UI_SELECT_PATHWAY:
            return {
                ...state,
                selected_pathwayid: action.pathwayid,
                //selected_pathway_section: "variables"
            }
        case UI_SELECT_PATHWAY_SECTION:
            return {
                ...state,
                selected_pathway_section: action.section
            }
        case UI_SELECT_DATA_TRANSFORMATION:
            return {
                ...state,
                selected_datatransformationid: action.dtid
            }
        default:
            return state;
    }
};

export default ui;
