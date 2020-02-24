import { Reducer } from "redux";
import { RootAction } from "app/store";
import { MODELS_ADD, MODEL_DELETE,
         VERSIONS_ADD, VERSION_DELETE,
         MODEL_CONFIGURATIONS_ADD, MODEL_CONFIGURATION_DELETE,
         MODEL_CONFIGURATION_SETUPS_ADD, MODEL_CONFIGURATION_SETUP_DELETE,
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
         IMAGES_ADD, IMAGE_DELETE
         } from './actions'

import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Person, Region, GeoShape, Grid,
         Process, Parameter, TimeInterval, SoftwareImage, DatasetSpecification, SampleResource, Image,
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
    images:                 IdMap<Image>;
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
    sampleCollections:      {} as IdMap<SampleCollection>,
    images:                 {} as IdMap<Image>
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
        case MODEL_CONFIGURATIONS_ADD:
            return { ...state, configurations: {...state.configurations, ...action.payload} };
        case MODEL_CONFIGURATION_SETUPS_ADD:
            return { ...state, setups: {...state.setups, ...action.payload} };
        case IMAGES_ADD:
            return { ...state, images: {...state.images, ...action.payload} };

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
        case MODEL_CONFIGURATION_DELETE:
            tmp = { ...state.configurations };
            delete tmp[action.uri];
            return { ...state, configurations: tmp };
        case MODEL_CONFIGURATION_SETUP_DELETE:
            tmp = { ...state.setups };
            delete tmp[action.uri];
            return { ...state, setups: tmp };
        case IMAGE_DELETE:
            tmp = { ...state.images };
            delete tmp[action.uri];
            return { ...state, images: tmp };

        default:
            return state;
    }
}

export default modelCatalog;
