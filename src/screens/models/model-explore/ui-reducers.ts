import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG,
         EXPLORER_SELECT_CALIBRATION } from './ui-actions'
import { ExplorerState, INITIAL_STATE } from './state'

const explorerUIReducer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_SELECT_MODEL:
            state.selectedModel = action.uri;
            break;
        case EXPLORER_SELECT_VERSION:
            state.selectedVersion = action.uri;
            break;
        case EXPLORER_SELECT_CONFIG:
            state.selectedConfig = action.uri;
            break;
        case EXPLORER_SELECT_CALIBRATION:
            state.selectedCalibration = action.uri;
            break;
    }
    return {
      ...state
    }
};

export default explorerUIReducer;
