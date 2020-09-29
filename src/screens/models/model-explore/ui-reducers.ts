import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG, REGISTER_SET_STEP,
         EXPLORER_SELECT_CALIBRATION, ADD_MODELS_TO_COMPARE, EXPLORER_SET_MODE, CLEAR_COMPARE } from './ui-actions'

export interface ComparisonEntry {
    uri:        string;
    type:       'Model' | 'SoftwareVersion' | 'ModelConfiguration' | 'ModelConfigurationSetup';
}

export interface ExplorerUIState {
    selectedModel:          string;
    selectedVersion:        string;
    selectedConfig:         string;
    selectedCalibration:    string;
    mode:                   string;
    step:                   number;
    compare?:               ComparisonEntry[];
}

const INITIAL_STATE: ExplorerUIState = { 
    selectedModel:          '',
    selectedVersion:        '',
    selectedConfig:         '',
    selectedCalibration:    '',
    mode:                   'view',
    step:                   0,
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
        case ADD_MODELS_TO_COMPARE: 
            let comp = [ ... action.comparisons ];
            return {
                ...state,
                compare: comp
            }
        case CLEAR_COMPARE:
            return {
                ...state,
                compare: []
            }
        case REGISTER_SET_STEP:
            return {
                ...state,
                step: action.step
            }
        default:
            return state;
    }
};

export default explorerUI;
