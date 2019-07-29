import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG,
         EXPLORER_SELECT_CALIBRATION } from './ui-actions'

export interface ExplorerUIState {
    selectedModel: string;
    selectedVersion: string;
    selectedConfig: string;
    selectedCalibration: string;
}

const INITIAL_STATE: ExplorerUIState = { 
    selectedModel: '',
    selectedVersion: '',
    selectedConfig: '',
    selectedCalibration: '',
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
        default:
            return state;
    }
};

export default explorerUI;
