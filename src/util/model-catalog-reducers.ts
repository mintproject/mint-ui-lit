import { Reducer } from "redux";
import { RootAction } from "../app/store";
import { FETCH_MODELS, FETCH_VERSIONS_AND_CONFIGS, FETCH_CATEGORIES, FETCH_CONFIGS, FETCH_CONFIGS_AND_IOS,
         FETCH_INPUTS_AND_VARS_SN, FETCH_OUTPUTS_AND_VARS_SN, FETCH_VARS_AND_SN, FETCH_METADATA_FOR_ANY,
         FETCH_VERSIONS_FOR_MODEL, FETCH_VARS_FOR_MODEL, FETCH_AUTHORS_FOR_MODEL_CONFIG, FETCH_GRID_FOR_MODEL_CONFIG,
         FETCH_SCREENSHOTS_FOR_MODEL_CONFIG, FETCH_DIAGRAMS_FOR_MODEL_CONFIG, FETCH_METADATA_FOR_MODEL_CONFIG,
         FETCH_METADATA_NOIO_FOR_MODEL_CONFIG, FETCH_PARAMETERS_FOR_CONFIG, FETCH_INPUT_COMPATIBLE_FOR_CONFIG,
         FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG, FETCH_IO_FOR_CONFIG, FETCH_IO_AND_VARS_SN_FOR_CONFIG,
         FETCH_VARS_SN_AND_UNITS_FOR_IO, FETCH_CONFIGS_FOR_VAR, FETCH_CONFIGS_FOR_VAR_SN, FETCH_CALIBRATIONS_FOR_VAR_SN,
         FETCH_IO_FOR_VAR_SN, FETCH_METADATA_FOR_VAR_SN, FETCH_PROCESS_FOR_CAG, FETCH_SEARCH_MODEL_BY_NAME,
         FETCH_SEARCH_MODEL_BY_CATEGORY, FETCH_SEARCH_ANY, FETCH_SEARCH_IO, FETCH_SEARCH_MODEL, FETCH_SEARCH_VAR,
         FETCH_SEARCH_MODEL_BY_VAR_SN, ADD_URLS } from './model-catalog-actions'

// For the moment storing on explorer
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
    metadata:           any;
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
    metadata:           {},
    parameters:         {},
    explDiagrams:       {} as UriExplDiag,
    search:             {} as SearchResult,
    urls:               {}
}

// Should change to a model-catalog state
const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case ADD_URLS:
            let newUrls = {...state.urls, ...action.data};
            return {
                ...state,
                urls: newUrls
            }
        case FETCH_MODELS:
            return {
                ...state,
                models: action.data
            }
        case FETCH_VERSIONS_AND_CONFIGS:
            console.log(action); return { ...state };
        case FETCH_CATEGORIES:
            console.log(action); return { ...state };
        case FETCH_CONFIGS:
            console.log(action); return { ...state };
        case FETCH_CONFIGS_AND_IOS:
            console.log(action); return { ...state };
        case FETCH_INPUTS_AND_VARS_SN:
            console.log(action); return { ...state };
        case FETCH_OUTPUTS_AND_VARS_SN:
            console.log(action); return { ...state };
        case FETCH_VARS_AND_SN:
            console.log(action); return { ...state };
        case FETCH_METADATA_FOR_ANY:
            console.log(action); return { ...state };
        case FETCH_VERSIONS_FOR_MODEL:
            let newVersions = {...state.versions};
            newVersions[action.uri] = action.data;
            return {
                ...state,
                versions: newVersions
            }
        case FETCH_VARS_FOR_MODEL:
            console.log(action); return { ...state };
        case FETCH_AUTHORS_FOR_MODEL_CONFIG:
            console.log(action); return { ...state };
        case FETCH_GRID_FOR_MODEL_CONFIG:
            console.log(action); return { ...state };
        case FETCH_SCREENSHOTS_FOR_MODEL_CONFIG:
            console.log(action); return { ...state };
        case FETCH_DIAGRAMS_FOR_MODEL_CONFIG:
            let newExplDiags = {...state.explDiagrams};
            newExplDiags[action.uri] = action.details;
            return { 
                ...state,
                explDiagrams: newExplDiags
            }
        case FETCH_METADATA_FOR_MODEL_CONFIG:
            let newMetadata = {...state.metadata};
            if (action.data.length>0) newMetadata[action.uri] = action.data;
            return {
                ...state,
                metadata: newMetadata
            }
        case FETCH_METADATA_NOIO_FOR_MODEL_CONFIG:
            let newMetadataNoIO = {...state.metadata};
            if (action.data.length>0) newMetadataNoIO[action.uri] = action.data;
            return {
                ...state,
                metadata: newMetadataNoIO
            }
        case FETCH_PARAMETERS_FOR_CONFIG:
            let newParams = {...state.parameters};
            newParams[action.uri] = action.data;
            return {
                ...state,
                parameters: newParams
            }
        case FETCH_INPUT_COMPATIBLE_FOR_CONFIG:
            let newCompInput = {...state.compatibleInput};
            newCompInput[action.uri] = action.data;
            return {
                ...state,
                compatibleInput: newCompInput
            }
        case FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG:
            let newCompOutput = {...state.compatibleOutput};
            newCompOutput[action.uri] = action.data;
            return {
                ...state,
                compatibleOutput: newCompOutput
            }
        case FETCH_IO_FOR_CONFIG:
            console.log(action); return { ...state };
        case FETCH_IO_AND_VARS_SN_FOR_CONFIG:
            let newInputs = {...state.inputs};
            newInputs[action.uri] = action.data.filter((i:any)=> i.kind==="Input");
            let newOutputs = {...state.outputs};
            newOutputs[action.uri] = action.data.filter((o:any)=> o.kind==="Output");
            return {
                ...state,
                inputs: newInputs,
                outputs: newOutputs
            }
        case FETCH_VARS_SN_AND_UNITS_FOR_IO:
            let newVariables = {...state.variables};
            newVariables[action.uri] = action.data;
            return {
                ...state,
                variables: newVariables
            }
        case FETCH_CONFIGS_FOR_VAR:
            console.log(action); return { ...state };
        case FETCH_CONFIGS_FOR_VAR_SN:
            console.log(action); return { ...state };
        case FETCH_CALIBRATIONS_FOR_VAR_SN:
            console.log(action); return { ...state };
        case FETCH_IO_FOR_VAR_SN:
            console.log(action); return { ...state };
        case FETCH_METADATA_FOR_VAR_SN:
            console.log(action); return { ...state };
        case FETCH_PROCESS_FOR_CAG:
            console.log(action); return { ...state };
        case FETCH_SEARCH_MODEL_BY_NAME:
            console.log(action); return { ...state };
        case FETCH_SEARCH_MODEL_BY_CATEGORY:
            console.log(action); return { ...state };
        case FETCH_SEARCH_ANY:
            console.log(action); return { ...state };
        case FETCH_SEARCH_IO:
            console.log(action); return { ...state };
        case FETCH_SEARCH_MODEL:
            console.log(action); return { ...state };
        case FETCH_SEARCH_VAR:
            console.log(action); return { ...state };
        case FETCH_SEARCH_MODEL_BY_VAR_SN:
            let newSearchResults = { ...state.search };
            newSearchResults[action.text] = action.data;
            return {
                ...state,
                search: newSearchResults
            }
        default:
            return state;
    }
}

export default explorer;
