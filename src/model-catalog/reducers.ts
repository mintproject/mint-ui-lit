import { Reducer } from "redux";
import { RootAction } from "app/store";
import { START_LOADING, END_LOADING, START_POST, END_POST,
         PERSON_GET, PERSONS_GET, ALL_PERSONS, PERSON_DELETE, 
         REGION_GET, REGIONS_GET, ALL_REGIONS, REGION_DELETE, 
         PROCESS_GET, PROCESSES_GET, ALL_PROCESSES,  PROCESS_DELETE,
         PARAMETER_GET, PARAMETERS_GET, ALL_PARAMETERS, PARAMETER_DELETE,
         DATASET_SPECIFICATION_GET, DATASET_SPECIFICATIONS_GET, ALL_DATASET_SPECIFICATIONS, DATASET_SPECIFICATION_DELETE, 
         SAMPLE_RESOURCE_GET, SAMPLE_RESOURCES_GET, ALL_SAMPLE_RESOURCES, SAMPLE_RESOURCE_DELETE, 
         MODEL_CONFIGURATION_GET, MODEL_CONFIGURATIONS_GET, ALL_MODEL_CONFIGURATIONS, MODEL_CONFIGURATION_DELETE,
         MODELS_GET, VERSIONS_GET,
         GRID_GET, TIME_INTERVAL_GET, SOFTWARE_IMAGE_GET } from './actions'

import { SampleResource, DatasetSpecification } from '@mintproject/modelcatalog_client';
import { IdMap } from 'app/reducers'

export interface ModelCatalogState {
    loading: {[key:string]: boolean},
    loadedAll: {[key:string]: boolean},
    created: {[key:string]: string}, //Here we assign some identifier to a POST request, when complete stores the URI
    models: any;
    versions: any;
    configurations: any;
    parameters: any;
    //datasetSpecifications: any;
    persons: any;
    grids: any;
    processes: any;
    timeIntervals: any;
    softwareImages: any;
    regions: any;
    datasetSpecifications: {[key:string]: DatasetSpecification};
    sampleResources: IdMap<SampleResource>;
}

const INITIAL_STATE: ModelCatalogState = { 
    loading: {},
    loadedAll: {},
    created: {},
    models: null,
    versions: null,
    configurations: null,
    parameters: null,
    //datasetSpecifications: null,
    persons: null,
    grids: null,
    processes: null,
    timeIntervals: null,
    softwareImages: null,
    datasetSpecifications: {} as DatasetSpecification,
    sampleResources: {} as IdMap<SampleResource>,
} as ModelCatalogState;

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
                versions: {...state.versions, ...action.payload}
            }

        case MODEL_CONFIGURATION_DELETE:
            tmp = { ...state.configurations }
            tmp[action.uri] = undefined
            return {
                ...state,
                configurations: tmp
            }
        case MODEL_CONFIGURATION_GET:
            return {
                ...state,
                configurations: {...state.configurations, ...action.payload}
            }
        case MODEL_CONFIGURATIONS_GET:
            tmp = { ...state.loadedAll };
            tmp['configurations'] = true;
            return {
                ...state,
                loadedAll: tmp,
                configurations: {...state.configurations, ...action.payload}
            }

        case PARAMETER_DELETE:
            tmp = { ...state.parameters };
            delete tmp[action.uri];
            return {
                ...state,
                parameters: tmp
            }
        case PARAMETER_GET:
            return {
                ...state,
                parameters: {...state.parameters, ...action.payload}
            }
        case PARAMETERS_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_PARAMETERS] = true;
            return {
                ...state,
                loadedAll: tmp,
                parameters: {...state.parameters, ...action.payload}
            }

        case REGION_DELETE:
            tmp = { ...state.regions };
            delete tmp[action.uri];
            return {
                ...state,
                regions: tmp
            }
        case REGION_GET:
            return {
                ...state,
                regions: {...state.regions, ...action.payload}
            }
        case REGIONS_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_REGIONS] = true;
            return {
                ...state,
                loadedAll: tmp,
                regions: {...state.regions, ...action.payload}
            }

        case PERSON_DELETE:
            tmp = { ...state.persons };
            delete tmp[action.uri];
            return {
                ...state,
                persons: tmp
            }
        case PERSON_GET:
            return {
                ...state,
                persons: {...state.persons, ...action.payload}
            }
        case PERSONS_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_PERSONS] = true;
            return {
                ...state,
                loadedAll: tmp,
                persons: {...state.persons, ...action.payload}
            }

        case PROCESS_DELETE:
            tmp = { ...state.processes };
            delete tmp[action.uri];
            return {
                ...state,
                processes: tmp
            }
        case PROCESS_GET:
            return {
                ...state,
                processes: {...state.processes, ...action.payload}
            }
        case PROCESSES_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_PROCESSES] = true;
            return {
                ...state,
                loadedAll: tmp,
                processes: {...state.processes, ...action.payload}
            }

        case DATASET_SPECIFICATION_DELETE:
            tmp = { ...state.datasetSpecifications };
            delete tmp[action.uri];
            return {
                ...state,
                datasetSpecifications: tmp
            }
        case DATASET_SPECIFICATION_GET:
            return {
                ...state,
                datasetSpecifications: {...state.datasetSpecifications, ...action.payload}
            }
        case DATASET_SPECIFICATIONS_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_DATASET_SPECIFICATIONS] = true;
            return {
                ...state,
                loadedAll: tmp,
                datasetSpecifications: {...state.datasetSpecifications, ...action.payload}
            }

        case SAMPLE_RESOURCE_DELETE:
            tmp = { ...state.sampleResources };
            delete tmp[action.uri];
            return {
                ...state,
                sampleResources: tmp
            }
        case SAMPLE_RESOURCE_GET:
            return {
                ...state,
                sampleResources: {...state.sampleResources, ...action.payload}
            }
        case SAMPLE_RESOURCES_GET:
            tmp = { ...state.loadedAll };
            tmp[ALL_SAMPLE_RESOURCES] = true;
            return {
                ...state,
                loadedAll: tmp,
                sampleResources: {...state.sampleResources, ...action.payload}
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
