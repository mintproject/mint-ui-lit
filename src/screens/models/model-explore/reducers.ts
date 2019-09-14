import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_VERSIONS, EXPLORER_IO, EXPLORER_VAR_UNIT, EXPLORER_COMPATIBLE_INPUT,
         EXPLORER_COMPATIBLE_OUTPUT, EXPLORER_MODEL_METADATA, EXPLORER_GET_PARAMETERS, EXPLORER_URLS,
         EXPLORER_GET_EXPL_DIAGS, EXPLORER_SEARCH_BY_VAR_NAME } from './actions'
import { FetchedModel, IODetail, VersionDetail, VariableDetail, CompIODetail,
         ExplanationDiagramDetail } from './api-interfaces'

export type UriModels   = Map<string, FetchedModel>;
type UriIO       = Map<string, IODetail[]>;
type UriVersion  = Map<string, VersionDetail[]>;
type UriVariable = Map<string, VariableDetail[]>;
type UriCompIO   = Map<string, CompIODetail[]>;
type UriExplDiag = Map<string, ExplanationDiagramDetail[]>;
type SearchResult = Map<string, string[]>;

export interface ExplorerState {
    models:             UriModels,
    inputs:             UriIO, 
    outputs:            UriIO, 
    versions:           UriVersion,
    variables:          UriVariable,
    compatibleInput:    UriCompIO;
    compatibleOutput:   UriCompIO;
    modelMetadata:      any;
    parameters:         any;
    explDiagrams:       UriExplDiag;
    search:             SearchResult;
    urls:               Map<string,string>;
}

const INITIAL_STATE: ExplorerState = { 
    models:             {} as UriModels,
    inputs:             {} as UriIO, 
    outputs:            {} as UriIO, 
    versions:           {} as UriVersion,
    variables:          {} as UriVariable,
    compatibleInput:    {} as UriCompIO,
    compatibleOutput:   {} as UriCompIO,
    modelMetadata:      {},
    parameters:         {},
    explDiagrams:       {} as UriExplDiag,
    search:             {} as SearchResult,
    urls:               {}
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
        case EXPLORER_URLS:
            let newUrls = {...state.urls, ...action.details};
            return {
                ...state,
                urls: newUrls
            }
        case EXPLORER_VAR_UNIT:
            let newVariables = {...state.variables};
            newVariables[action.uri] = action.details;
            return {
                ...state,
                variables: newVariables
            }
        case EXPLORER_IO:
            let newInputs = {...state.inputs};
            newInputs[action.uri] = action.details.filter((i:any)=> i.kind==="Input");
            let newOutputs = {...state.outputs};
            newOutputs[action.uri] = action.details.filter((o:any)=> o.kind==="Output");
            return {
                ...state,
                inputs: newInputs,
                outputs: newOutputs
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
        case EXPLORER_GET_EXPL_DIAGS:
            let newExplDiags = {...state.explDiagrams};
            newExplDiags[action.uri] = action.details;
            return { 
                ...state,
                explDiagrams: newExplDiags
            }
        case EXPLORER_SEARCH_BY_VAR_NAME:
            let newSearchResults = { ...state.search };
            newSearchResults[action.text] = action.details;
            return {
                ...state,
                search: newSearchResults
            }
        default:
            return state;
    }
};

export default explorer;
