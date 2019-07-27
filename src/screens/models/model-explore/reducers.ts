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
            return {
                ...state,
                models: action.models
            }
        case EXPLORER_VERSIONS:
            let newVersions = {...state.versions};
            newVersions[action.uri] = action.details;
            return {
                ...state,
                versions: newVersions
            }
        case EXPLORER_VAR_UNIT:
            let newVariables = {...state.variables};
            newVariables[action.uri] = action.details;
            return {
                ...state,
                variables: newVariables
            }
        case EXPLORER_IO:
            let newIOs = {...state.io};
            newIOs[action.uri] = action.details;
            return {
                ...state,
                io: newIOs
            }
        case EXPLORER_COMPATIBLE_INPUT:
            let newCompInput = {...state.compatibleInput};
            newCompInput[action.uri] = action.details;
            return {
                ...state,
                compatibleInput: newCompInput
            }
        case EXPLORER_COMPATIBLE_OUTPUT:
            let newCompOutput = {...state.compatibleOutput};
            newCompOutput[action.uri] = action.details;
            return {
                ...state,
                compatibleOutput: newCompOutput
            }
        case EXPLORER_MODEL_METADATA:
            let newMetadata = {...state.modelMetadata};
            if (action.details.length>0) newMetadata[action.uri] = action.details;
            return {
                ...state,
                modelMetadata: newMetadata
            }
            break;
        case EXPLORER_GET_PARAMETERS:
            let newParams = {...state.parameters};
            newParams[action.uri] = action.details;
            return {
                ...state,
                parameters: newParams
            }
        default:
            return state;
    }
};

export default explorer;
