import { Reducer } from "redux";
import { RootAction } from "app/store";
import { MODELS_ADD, MODEL_DELETE,
         VERSIONS_ADD, VERSION_DELETE,
         PERSONS_ADD, PERSON_DELETE,
         REGIONS_ADD, REGION_DELETE,
         GEO_SHAPES_ADD, GEO_SHAPE_DELETE,
         GRIDS_ADD, GRID_DELETE,
         PROCESSES_ADD, PROCESS_DELETE,
         PARAMETERS_ADD, PARAMETER_DELETE,
         TIME_INTERVALS_ADD, TIME_INTERVAL_DELETE,
         DATASET_SPECIFICATIONS_ADD, DATASET_SPECIFICATION_DELETE,
         SAMPLE_RESOURCES_ADD, SAMPLE_RESOURCE_DELETE, 
         SAMPLE_COLLECTIONS_ADD, SAMPLE_COLLECTION_DELETE, 
         SOFTWARE_IMAGES_ADD, SOFTWARE_IMAGE_DELETE,
         START_LOADING, END_LOADING, START_POST, END_POST,
         MODEL_CONFIGURATION_GET, MODEL_CONFIGURATIONS_GET, ALL_MODEL_CONFIGURATIONS, MODEL_CONFIGURATION_DELETE,
         MODEL_CONFIGURATION_SETUP_GET, MODEL_CONFIGURATION_SETUPS_GET,
         } from './actions'

import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Person, Region, GeoShape, Grid,
         Process, Parameter, TimeInterval, SoftwareImage, DatasetSpecification, SampleResource, 
         SampleCollection } from '@mintproject/modelcatalog_client';
import { IdMap } from 'app/reducers'

export interface ModelCatalogState {
    loading: {[key:string]: boolean},
    loadedAll: {[key:string]: boolean},
    created: {[key:string]: string}, //Here we assign some identifier to a POST request, when complete stores the URI

    models:                 IdMap<Model>;
    versions:               IdMap<SoftwareVersion>;
    configurations:         IdMap<ModelConfiguration>;
    setups:                 IdMap<ModelConfigurationSetup>;
    persons:                IdMap<Person>;
    regions:                IdMap<Region>;
    geoShapes:              IdMap<GeoShape>;
    grids:                  IdMap<Grid>;
    processes:              IdMap<Process>;
    parameters:             IdMap<Parameter>;
    timeIntervals:          IdMap<TimeInterval>;
    softwareImages:         IdMap<SoftwareImage>;
    datasetSpecifications:  IdMap<DatasetSpecification>;
    sampleResources:        IdMap<SampleResource>;
    sampleCollections:      IdMap<SampleCollection>;
}

const INITIAL_STATE: ModelCatalogState = { 
    loading: {},
    loadedAll: {},
    created: {},

    models:                 {} as IdMap<Model>,
    versions:               {} as IdMap<SoftwareVersion>,
    configurations:         {} as IdMap<ModelConfiguration>,
    setups:                 {} as IdMap<ModelConfigurationSetup>,
    persons:                {} as IdMap<Person>,
    regions:                {} as IdMap<Region>,
    geoShapes:              {} as IdMap<GeoShape>,
    grids:                  {} as IdMap<Grid>,
    processes:              {} as IdMap<Process>,
    parameters:             {} as IdMap<Parameter>,
    timeIntervals:          {} as IdMap<TimeInterval>,
    softwareImages:         {} as IdMap<SoftwareImage>,
    datasetSpecifications:  {} as IdMap<DatasetSpecification>,
    sampleResources:        {} as IdMap<SampleResource>,
    sampleCollections:      {} as IdMap<SampleCollection>
} as ModelCatalogState;

const modelCatalog: Reducer<ModelCatalogState, RootAction> = (state = INITIAL_STATE, action) => {
    let tmp : any = {};
    switch (action.type) {
        case MODELS_ADD:
            return { ...state, models: {...state.models, ...action.payload} };
        case REGIONS_ADD:
            return { ...state, regions: {...state.regions, ...action.payload} };
        case GEO_SHAPES_ADD:
            return { ...state, geoShapes: {...state.geoShapes, ...action.payload} };
        case DATASET_SPECIFICATIONS_ADD:
            return { ...state, datasetSpecifications: {...state.datasetSpecifications, ...action.payload} };
        case PARAMETERS_ADD:
            return { ...state, parameters: {...state.parameters, ...action.payload} };
        case PERSONS_ADD:
            return { ...state, persons: {...state.persons, ...action.payload} };
        case PROCESSES_ADD:
            return { ...state, processes: {...state.processes, ...action.payload} };
        case GRIDS_ADD:
            return { ...state, grids: {...state.grids, ...action.payload} };
        case VERSIONS_ADD:
            return { ...state, versions: {...state.versions, ...action.payload} };
        case SAMPLE_RESOURCES_ADD:
            return { ...state, sampleResources: {...state.sampleResources, ...action.payload} };
        case SAMPLE_COLLECTIONS_ADD:
            return { ...state, sampleCollections: {...state.sampleCollections, ...action.payload} };
        case TIME_INTERVALS_ADD:
            return { ...state, timeIntervals: {...state.timeIntervals, ...action.payload} };
        case SOFTWARE_IMAGES_ADD:
            return { ...state, softwareImages: {...state.softwareImages, ...action.payload} };

        case MODEL_DELETE:
            tmp = { ...state.models };
            delete tmp[action.uri];
            return { ...state, models: tmp };
        case REGION_DELETE:
            tmp = { ...state.regions };
            delete tmp[action.uri];
            return { ...state, regions: tmp };
        case GEO_SHAPE_DELETE:
            tmp = { ...state.geoShapes };
            delete tmp[action.uri];
            return { ...state, geoShapes: tmp };
        case DATASET_SPECIFICATION_DELETE:
            tmp = { ...state.datasetSpecifications };
            delete tmp[action.uri];
            return { ...state, datasetSpecifications: tmp };
        case PARAMETER_DELETE:
            tmp = { ...state.parameters };
            delete tmp[action.uri];
            return { ...state, parameters: tmp };
        case PERSON_DELETE:
            tmp = { ...state.persons };
            delete tmp[action.uri];
            return { ...state, persons: tmp };
        case PROCESS_DELETE:
            tmp = { ...state.processes };
            delete tmp[action.uri];
            return { ...state, processes: tmp };
        case GRID_DELETE:
            tmp = { ...state.grids };
            delete tmp[action.uri];
            return { ...state, grids: tmp };
        case VERSION_DELETE:
            tmp = { ...state.versions };
            delete tmp[action.uri];
            return { ...state, versions: tmp };
        case SAMPLE_RESOURCE_DELETE:
            tmp = { ...state.sampleResources };
            delete tmp[action.uri];
            return { ...state, sampleResources: tmp };
        case SAMPLE_COLLECTION_DELETE:
            tmp = { ...state.sampleCollections };
            delete tmp[action.uri];
            return { ...state, sampleCollections: tmp };
        case TIME_INTERVAL_DELETE:
            tmp = { ...state.timeIntervals };
            delete tmp[action.uri];
            return { ...state, timeIntervals: tmp };
        case SOFTWARE_IMAGE_DELETE:
            tmp = { ...state.softwareImages };
            delete tmp[action.uri];
            return { ...state, softwareImages: tmp };


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
            tmp[ALL_MODEL_CONFIGURATIONS] = true;
            return {
                ...state,
                loadedAll: tmp,
                configurations: {...state.configurations, ...action.payload}
            }

        case MODEL_CONFIGURATION_SETUPS_GET:
            return {
                ...state,
                setups: {...state.setups, ...action.payload}
            }
        case MODEL_CONFIGURATION_SETUP_GET:
            return {
                ...state,
                setups: {...state.setups, ...action.payload}
            }


        default:
            return state;
    }
}

export default modelCatalog;
