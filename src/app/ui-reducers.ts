import { RootAction } from "./store";
import { Reducer } from "redux";
import { UI_SELECT_SUBGOAL, UI_SELECT_PATHWAY, UI_SELECT_PATHWAY_SECTION, 
    UI_SELECT_SCENARIO, UI_SELECT_TOP_REGION, UI_SELECT_THREAD } from "./ui-actions";

export interface UIState {
    selected_top_regionid?:string
    selected_scenarioid?:string
    selected_subgoalid?:string
    selected_pathwayid?:string
    selected_pathway_section?:string
}

const INITIAL_STATE: UIState = {};

const ui: Reducer<UIState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UI_SELECT_TOP_REGION:
            return {
                ...state,
                selected_top_regionid: action.regionid,
            }
        case UI_SELECT_THREAD:
            return {
                ...state,
                selected_top_regionid: action.threadid,
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
        default:
            return state;
    }
};

export default ui;