import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { EMULATORS_LIST, EMULATORS_LIST_EXECUTIONS_FOR_MODEL, EMULATORS_LIST_MODEL_INPUTS, EMULATORS_LIST_MODEL_INPUT_DATA_VALUES, EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES, EMULATORS_NUM_EXECUTIONS_FOR_FILTER, EMULATORS_SELECT_MODEL } from "./actions";

export interface EmulatorsState {
    models?: ModelsList,
    selected_model?: string,
    emulators?: EmulatorsList,
    filtered_emulators?: EmulatorsList,
    model_inputs?: EmulatorModelInputs
}

export interface ModelsList {
    loading?: boolean,
    list: string[]
}
export interface EmulatorsList {
    [modelid:string]: EmulatorsListWithStatus
}

export interface EmulatorsListWithStatus {
    loading?: boolean,
    total?: number,
    list?: any[]
} 

export interface EmulatorModelInputs {
    [modelid:string]: EmulatorModelInputsWithStatus
}

export interface EmulatorModelInputsWithStatus {
    loading?: boolean,
    list: EmulatorModelInput[]
}

export interface EmulatorModelInput {
    name: string
    type: string
    datatype: string
    changed?: boolean
    values?: any[]
}

export interface EmulatorSearchConstraint {
    model: string
    input: string
    inputtype: string
    values: any[]
}

const INITIAL_STATE: EmulatorsState = {
    models: null,
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
            state.models = { 
                loading: action.loading,
                list: action.models
            };
            return {
                ...state
            };
        case EMULATORS_LIST_EXECUTIONS_FOR_MODEL:
            state.emulators = { ...state.emulators };
            state.emulators[action.model] = {
                loading: action.loading,
                list: action.emulators
            }
            return {
                ...state
            };
        case EMULATORS_NUM_EXECUTIONS_FOR_FILTER:
            state.filtered_emulators = { ...state.filtered_emulators };
            state.filtered_emulators[action.model] = {
                loading: action.loading,
                total: action.num_filtered_emulators
            }
            return {
                ...state
            };
        case EMULATORS_LIST_MODEL_INPUTS:
            state.model_inputs = { ...state.model_inputs };
            state.model_inputs[action.model] = {
                loading: action.loading,
                list: action.inputs
            }
            return {
                ...state
            };
        case EMULATORS_LIST_MODEL_INPUT_DATA_VALUES:
        case EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES:
            state.model_inputs = { ...state.model_inputs };
            if(state.model_inputs[action.model].list) {
                state.model_inputs[action.model].list.forEach((input) => {
                    if(input.name == action.input) {
                        input.values = action.values;
                        input.changed = true;
                    }
                })
            }
            return {
                ...state
            };                 
    }
    return state;
}

export default emulators;