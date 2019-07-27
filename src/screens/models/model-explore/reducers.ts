import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_VERSIONS, EXPLORER_IO, EXPLORER_VAR_UNIT, EXPLORER_COMPATIBLE_INPUT,
         EXPLORER_COMPATIBLE_OUTPUT, EXPLORER_MODEL_METADATA, EXPLORER_GET_PARAMETERS } from './actions'
import { FetchedModel, IODetail, VersionDetail, VariableDetail, CompIODetail } from './api-interfaces'

export type UriModels   = Map<string, FetchedModel>;
type UriIO       = Map<string, IODetail[]>;
type UriVersion  = Map<string, VersionDetail[]>;
type UriVariable = Map<string, VariableDetail[]>;
type UriCompIO   = Map<string, CompIODetail[]>;

export interface ExplorerState {
    models:             UriModels,
    io:                 UriIO, 
    versions:           UriVersion,
    variables:          UriVariable,
    compatibleInput:    UriCompIO;
    compatibleOutput:   UriCompIO;
    modelMetadata:      any;
    parameters:         any;
}

const INITIAL_STATE: ExplorerState = { 
    models:             {} as UriModels,
    io:                 {} as UriIO,
    versions:           {} as UriVersion,
    variables:          {} as UriVariable,
    compatibleInput:    {} as UriCompIO,
    compatibleOutput:   {} as UriCompIO,
    modelMetadata:      {},
    parameters:         {},
}

const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_FETCH:
            state.models = action.models;
            break;
        case EXPLORER_VERSIONS:
            state.versions[action.uri] = action.details;
            state.models[action.uri].versions = action.details;
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

export default explorer;
