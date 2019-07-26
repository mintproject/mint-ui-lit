import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_VERSIONS, EXPLORER_IO, EXPLORER_VAR_UNIT, EXPLORER_COMPATIBLE_INPUT,
         EXPLORER_COMPATIBLE_OUTPUT, EXPLORER_MODEL_METADATA, EXPLORER_GET_PARAMETERS } from './actions'
import { ExplorerState, INITIAL_STATE, IODetail } from './state'

const explorerReducer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_FETCH:
            state.models = action.models;
            break;
        case EXPLORER_VERSIONS:
            state.version[action.uri] = action.details;
            state.models[action.uri].version = action.details;
            break;
        case EXPLORER_VAR_UNIT:
            state.variables[action.uri] = action.details;
            break;
        case EXPLORER_IO:
            let ios : IODetail[] = [];
            action.details.forEach( io => {
                ios.push( io as IODetail );
            })
            state.io[action.uri] = ios;
            break;
        case EXPLORER_COMPATIBLE_INPUT:
            state.compatibleInput[action.uri] = action.details;
            break;
        case EXPLORER_COMPATIBLE_OUTPUT:
            state.compatibleOutput[action.uri] = action.details;
            break;
        case EXPLORER_MODEL_METADATA:
            if (action.details.length>0) {
                state.modelMetadata[action.uri] = action.details;
            }
            break;
        case EXPLORER_GET_PARAMETERS:
            if (action.details.length>0) {
                state.parameters[action.uri] = action.details;
            }
            break;
    }
    return {
      ...state
    }
};

export default explorerReducer;
