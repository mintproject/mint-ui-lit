import { Reducer } from "redux";
import { RootAction } from "../app/store";
import { MODELS_GET, VERSIONS_GET, CONFIGURATIONS_GET, PARAMETER_GET, DATASET_SPECIFICATION_GET, PERSON_GET,
         GRID_GET, PROCESS_GET, TIME_INTERVAL_GET, SOFTWARE_IMAGE_GET } from './actions'

export interface ModelCatalogState {
    models: any;
    versions: any;
    configurations: any;
    parameters: any;
    datasetSpecifications: any;
    persons: any;
    grids: any;
    processes: any;
    timeIntervals: any;
    softwareImages: any;
}

const INITIAL_STATE: ModelCatalogState = { 
    models: null,
    versions: null,
    configurations: null,
    parameters: null,
    datasetSpecifications: null,
    persons: null,
    grids: null,
    processes: null,
    timeIntervals: null,
    softwareImages: null
}

const modelCatalog: Reducer<ModelCatalogState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case MODELS_GET:
            return {
                ...state,
                models: {...state.models, ...action.payload}
            }
        case VERSIONS_GET:
            return {
                ...state,
                versions: {...state.version, ...action.payload}
            }
        case CONFIGURATIONS_GET:
            return {
                ...state,
                configurations: {...state.configuration, ...action.payload}
            }
        case PARAMETER_GET:
            return {
                ...state,
                parameters: {...state.parameters, ...action.payload}
            }
        case DATASET_SPECIFICATION_GET:
            return {
                ...state,
                datasetSpecifications: {...state.datasetSpecifications, ...action.payload}
            }
        case PERSON_GET:
            return {
                ...state,
                persons: {...state.persons, ...action.payload}
            }
        case PROCESS_GET:
            return {
                ...state,
                processes: {...state.processes, ...action.payload}
            }
        case GRID_GET:
            return {
                ...state,
                grids: {...state.grids, ...action.payload}
            }
        case TIME_INTERVAL_GET:
            return {
                ...state,
                timeIntervals: {...state.timeIntervals, ...action.payload}
            }
        case SOFTWARE_IMAGE_GET:
            return {
                ...state,
                softwareImages: {...state.softwareImages, ...action.payload}
            }
        default:
            return state;
    }
}

export default modelCatalog;
