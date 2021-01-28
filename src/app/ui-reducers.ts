import { RootAction } from "./store";
import { Reducer } from "redux";
import { UI_SELECT_TASK, UI_SELECT_THREAD, UI_SELECT_THREAD_SECTION, UI_SELECT_DATA_TRANSFORMATION,
    UI_SELECT_PROBLEM_STATEMENT, UI_SELECT_TOP_REGION, UI_SELECT_SUB_REGION } from "./ui-actions";

export interface UIState {
    selected_top_regionid?:string
    selected_sub_regionid?:string
    selected_problem_statement_id?:string
    selected_task_id?:string
    selected_thread_id?:string
    selected_thread_section?:string
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
                selected_thread_id: action.thread_id,
            }
        case UI_SELECT_PROBLEM_STATEMENT:
            return {
                ...state,
                selected_problem_statement_id: action.problem_statement_id,
                selected_task_id: "",
                selected_thread_id: "",
                selected_thread_section: "",
            }
        case UI_SELECT_TASK:
            return {
                ...state,
                selected_task_id: action.task_id,
                selected_thread_id: "",
                selected_thread_section: "",
            }
        case UI_SELECT_THREAD:
            return {
                ...state,
                selected_thread_id: action.thread_id,
                //selected_thread_section: "variables"
            }
        case UI_SELECT_THREAD_SECTION:
            return {
                ...state,
                selected_thread_section: action.section
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
