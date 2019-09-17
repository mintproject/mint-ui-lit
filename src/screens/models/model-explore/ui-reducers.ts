import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG,
         EXPLORER_SELECT_CALIBRATION, EXPLORER_SET_COMPARE_A, EXPLORER_SET_COMPARE_B,
         EXPLORER_COMPARE_MODEL, EXPLORER_SET_MODE } from './ui-actions'

export interface ComparisonEntry {
    model:          string;
    version:        string;
    config:         string;
    calibration:    string;
}

export interface ExplorerUIState {
    selectedModel:          string;
    selectedVersion:        string;
    selectedConfig:         string;
    selectedCalibration:    string;
    mode:                   string;
    compareA?:              ComparisonEntry | null;
    compareB?:              ComparisonEntry | null;
}

const INITIAL_STATE: ExplorerUIState = { 
    selectedModel:          '',
    selectedVersion:        '',
    selectedConfig:         '',
    selectedCalibration:    '',
    mode:                   'view',
    compareA:               null,
    compareB:               null
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
        case EXPLORER_SET_COMPARE_A:
            return {
                ...state,
                compareA: { ...action.compare }
            }
        case EXPLORER_SET_COMPARE_B:
            return {
                ...state,
                compareB: { ...action.compare }
            }
        case EXPLORER_COMPARE_MODEL:
            if (!state.compareA || !state.compareA.model) {
                return { 
                    ...state,
                    compareA: {model:action.uri, version: '', config: '', calibration: ''}
                }
            } else {
                return {
                    ...state,
                    compareB: {model:action.uri, version: '', config: '', calibration: ''}
                }
            }
        default:
            return state;
    }
};

export default explorerUI;
