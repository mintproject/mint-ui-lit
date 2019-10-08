import { Reducer } from "redux";
import { RootAction } from "../app/store";
import { MODELS_GET, VERSIONS_GET, CONFIGURATIONS_GET, PARAMETER_GET, DATASET_SPECIFICATION_GET } from './actions'

export interface ModelCatalogState {
    models: any;
    versions: any;
    configurations: any;
    parameters: any;
    datasetSpecifications: any;
}

const INITIAL_STATE: ModelCatalogState = { 
    models: null,
    versions: null,
    configurations: null,
    parameters: null,
    datasetSpecifications: null,
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
        default:
            return state;
    }
}

export default modelCatalog;
