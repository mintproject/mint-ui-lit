import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { EMULATORS_LIST, EMULATORS_LIST_EMULATORS_FOR_MODEL, EMULATORS_SELECT_MODEL } from "./actions";

export interface EmulatorsState {
    models?: string[],
    loading?: boolean,
    selected_model?: string,
    emulators?: EmulatorsList
}

export interface EmulatorsList {
    [modelid:string]: any[]
}

const INITIAL_STATE: EmulatorsState = {
    models: null, //[ "pihm", "topoflow", "hand", "cycles", "eacs"],
    selected_model: null
};

const emulators: Reducer<EmulatorsState, RootAction> = (state = INITIAL_STATE, action) => {
    switch(action.type) {
        case EMULATORS_SELECT_MODEL:
            return {
                ...state,
                selected_model: action.selected_model
            };        
        case EMULATORS_LIST:
            return {
                ...state,
                loading: action.loading,
                models: action.models
            };
        case EMULATORS_LIST_EMULATORS_FOR_MODEL:
            state.emulators = { ...state.emulators };
            state.emulators[action.model] = action.emulators;
            return {
                ...state,
                loading: action.loading
            };
    }
    return state;
}

export default emulators;