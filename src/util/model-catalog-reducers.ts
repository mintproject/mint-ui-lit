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
         FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG, FETCH_SEARCH_MODEL_BY_VAR_SN, ADD_URLS, ADD_PARAMETERS, ADD_CALIBRATION,
         ADD_INPUTS, ADD_METADATA, FETCH_DESCRIPTION_FOR_VAR } from './model-catalog-actions'

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
    sampleVis:          any;
    screenshots:        any;
    authors:            any;
    explDiagrams:       UriExplDiag;
    search:             SearchResult;
    vars:               any;
    urls:               any;
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
    sampleVis:          {},
    screenshots:        {},
    authors:            {},
    explDiagrams:       {} as UriExplDiag,
    search:             {} as SearchResult,
    vars:               {},
    urls:               {}
}

// Should change to a model-catalog state
const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case ADD_PARAMETERS:
            let newParam = {...state.parameters}
            newParam[action.uri] = action.data;
            return {
                ...state,
                parameters: newParam
            }
        case ADD_CALIBRATION:
            let crVersions = { ...state.versions };
            let crUrls = { ...state.urls }
            Object.keys(crVersions).forEach(modelUri => {
                crVersions[modelUri].forEach(ver => {
                    (ver.configs || []).forEach(cfg => {
                        if (cfg.uri === action.config) {
                            if (!cfg.calibrations) cfg.calibrations = [];
                            cfg.calibrations.push({uri: action.uri, label: action.label});
                            crUrls[action.uri] = modelUri.split('/').pop() + '/' + ver.uri.split('/').pop() + '/'
                                               + cfg.uri.split('/').pop() + '/' + action.uri.split('/').pop();
                        }
                    })
                })
            })
            return {
                ...state,
                versions: crVersions,
                urls: crUrls
            }
        case ADD_INPUTS:
            let crInputs = { ...state.inputs }
            crInputs[action.uri] = action.data;
            return { 
                ...state,
                inputs: crInputs
            };
        case ADD_METADATA:
            let crMetadata = { ...state.metadata }
            crMetadata[action.uri] = action.data;
            return {
                ...state,
                metadata: crMetadata
            };
        /*case ADD_AUTHORS:
            let crAuthors = { ...state.authors }
            crAuthors[action.uri] = action.data;
            return {
                ...state,
                authors: crAuthors
            }*/

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
            let allVersions = { ...state.versions, ...action.data };
            return { 
                ...state, 
                versions: allVersions
            }
        case FETCH_DESCRIPTION_FOR_VAR:
            let newVars =  { ...state.vars };
            newVars[action.uri] = action.data;
            return { 
                ...state, 
                vars: newVars
            }

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
            let newAuthors = { ...state.authors }
            if (!newAuthors[action.uri]) {
                newAuthors[action.uri] = action.data;
            }
            return {
                ...state,
                authors: newAuthors
            };
        case FETCH_GRID_FOR_MODEL_CONFIG:
            console.log(action); return { ...state };
        case FETCH_SCREENSHOTS_FOR_MODEL_CONFIG:
            let newScreenshots = { ...state.screenshots };
            newScreenshots[action.uri] = action.data;
            return  {
                ...state,
                screenshots: newScreenshots
            }
        case FETCH_DIAGRAMS_FOR_MODEL_CONFIG:
            let newExplDiags = {...state.explDiagrams};
            newExplDiags[action.uri] = action.data;
            return { 
                ...state,
                explDiagrams: newExplDiags
            }
        case FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG:
            let newSampleVis = { ...state.sampleVis };
            newSampleVis[action.uri] = action.data
            return { 
                ...state,
                sampleVis: newSampleVis
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
            if (action.data.length>0 && !newMetadataNoIO[action.uri]) newMetadataNoIO[action.uri] = action.data;
            return {
                ...state,
                metadata: newMetadataNoIO
            }
        case FETCH_PARAMETERS_FOR_CONFIG:
            let newParams = {...state.parameters};
            if (!newParams[action.uri]) {
                newParams[action.uri] = action.data;
            }
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
            if (!newInputs[action.uri]) {
                newInputs[action.uri] = action.data.filter((i:any)=> i.kind==="Input");
            }
            let newOutputs = {...state.outputs};
            if (!newOutputs[action.uri]) {
                newOutputs[action.uri] = action.data.filter((o:any)=> o.kind==="Output");
            }
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
