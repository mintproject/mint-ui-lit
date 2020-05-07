import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG,
         EXPLORER_SELECT_CALIBRATION, ADD_MODEL_TO_COMPARE, EXPLORER_SET_MODE } from './ui-actions'

export interface ComparisonEntry {
    uri:        string;
    type:       'Model' | 'ModelConfiguration' | 'ModelConfigurationSetup'; //TODO: could change to enum
}

export interface ExplorerUIState {
    selectedModel:          string;
    selectedVersion:        string;
    selectedConfig:         string;
    selectedCalibration:    string;
    mode:                   string;
    compare?:               ComparisonEntry[];
}

const INITIAL_STATE: ExplorerUIState = { 
    selectedModel:          '',
    selectedVersion:        '',
    selectedConfig:         '',
    selectedCalibration:    '',
    mode:                   'view',
    compare:                [],
}

const explorerUI: Reducer<ExplorerUIState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_SELECT_MODEL:
            return {
                ...state,
                selectedModel: action.uri,
                selectedVersion: '',
                selectedConfig: '',
                selectedCalibration: '',
            }
        case EXPLORER_SELECT_VERSION:
            return {
                ...state,
                selectedVersion: action.uri,
                selectedConfig: '',
                selectedCalibration: '',
            }
        case EXPLORER_SELECT_CONFIG:
            return {
                ...state,
                selectedConfig: action.uri,
                selectedCalibration: '',
            }
        case EXPLORER_SELECT_CALIBRATION:
            return {
                ...state,
                selectedCalibration: action.uri
            }
        case EXPLORER_SET_MODE:
            return {
                ...state,
                mode: action.mode
            }
        case ADD_MODEL_TO_COMPARE: 
            let comp = [ ...state.compare ];
            comp.push(action.comparison);
            return {
                ...state,
                compare: comp
            }
        default:
            return state;
    }
};

export default explorerUI;
