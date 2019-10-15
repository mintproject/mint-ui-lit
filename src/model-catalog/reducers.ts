import { Reducer } from "redux";
import { RootAction } from "../app/store";
import { START_LOADING, END_LOADING, START_POST, END_POST,
         MODELS_GET, VERSIONS_GET, CONFIGURATIONS_GET, PARAMETER_GET,
         DATASET_SPECIFICATION_GET, PERSON_GET, ALL_PERSONS,
         GRID_GET, PROCESS_GET, TIME_INTERVAL_GET, SOFTWARE_IMAGE_GET, PERSONS_GET } from './actions'

export interface ModelCatalogState {
    loading: {[key:string]: boolean},
    loadedAll: {[key:string]: boolean},
    created: {[key:string]: string}, //Here we assign some identifier to a POST request, when complete stores the URI
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
    loading: {},
    loadedAll: {},
    created: {},
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
    let tmp : any = {};
    switch (action.type) {
        case START_POST:
            tmp = { ...state.created };
            tmp[action.id] = '';
            return {
                ...state,
                created: tmp,
            }
        case END_POST:
            tmp = { ...state.created };
            tmp[action.id] = action.uri;
            return {
                ...state,
                created: tmp,
            }
        case START_LOADING:
            tmp = { ...state.loading };
            tmp[action.id] = true;
            return {
                ...state,
                loading: tmp,
            }
        case END_LOADING:
            tmp = { ...state.loading };
            tmp[action.id] = false
            return {
                ...state,
                loading: tmp,
            }
        case MODELS_GET:
            tmp = { ...state.loadedAll };
            tmp['models'] = true;
            return {
                ...state,
                loadedAll: tmp,
                models: {...state.models, ...action.payload}
            }
        case VERSIONS_GET:
            tmp = { ...state.loadedAll };
            tmp['versions'] = true;
            return {
                ...state,
                loadedAll: tmp,
                versions: {...state.version, ...action.payload}
            }
        case CONFIGURATIONS_GET:
            tmp = { ...state.loadedAll };
            tmp['configurations'] = true;
            return {
                ...state,
                loadedAll: tmp,
                configurations: {...state.configuration, ...action.payload}
            }
        case PERSONS_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_PERSONS] = true;
            return {
                ...state,
                loadedAll: tmp,
                persons: {...state.persons, ...action.payload}
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
