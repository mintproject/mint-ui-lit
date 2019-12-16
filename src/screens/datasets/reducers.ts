import { IdNameObject } from "../../app/reducers";
import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { DATASETS_VARIABLES_QUERY, DATASETS_GENERAL_QUERY, DATASETS_RESOURCE_QUERY,
         DATASETS_REGION_QUERY, DATASET_ADD } from "./actions";
import { DateRange } from "screens/modeling/reducers";
import { BoundingBox } from "screens/regions/reducers";
import { IdMap } from 'app/reducers';

export interface Dataset extends IdNameObject {
    region: string,
    variables: string[],
    datatype: string,
    time_period: DateRange,
    description: string,
    version: string,
    limitations: string,
    source: Source,
    categories?: string[],
    is_cached?: boolean,
    resource_repr?: any,
    dataset_repr?: any,
    resources: DataResource[]
};

export interface DataResource extends IdNameObject {
    url: string
    time_period?: DateRange,
    spatial_coverage?: any
    selected? : boolean
}

export interface DatasetDetail extends Dataset {
    documentation: string,
    image: string
}

export interface Source {
    name: string,
    url: string,
    type: string
}

export interface DatasetQueryParameters {
    spatialCoverage?: BoundingBox,
    dateRange?: DateRange,
    name?: string,
    variables?: string[]
}

export interface DatasetsState {
    model_datasets?: ModelDatasets
    query_datasets?: DatasetsWithStatus
    region_datasets?: DatasetsWithStatus
    dataset?: DatasetWithStatus
    datasets?: IdMap<Dataset>
}
export interface DatasetsWithStatus {
    loading: boolean,
    datasets: Dataset[]
}
export interface DatasetWithStatus {
    loading: boolean,
    dataset: Dataset
}
export type ModelInputDatasets = Map<string, DatasetsWithStatus[]>
export type ModelDatasets = Map<string, ModelInputDatasets>

const INITIAL_STATE: DatasetsState = {};

const datasets: Reducer<DatasetsState, RootAction> = (state = INITIAL_STATE, action) => {

    switch (action.type) {
        case DATASETS_VARIABLES_QUERY:
            // Return datasets
            state.model_datasets = { ...state.model_datasets };
            state.model_datasets[action.modelid] = state.model_datasets[action.modelid] || {};
            state.model_datasets[action.modelid][action.inputid] = {
                loading: action.loading,
                datasets: action.datasets
            }
            return {
                ...state
            };

        case DATASETS_GENERAL_QUERY:
            // Return datasets
            state.dataset = null;
            state.query_datasets = {
                loading: action.loading,
                datasets: action.datasets
            };
            return {
                ...state
            };

        case DATASETS_REGION_QUERY:
            // Return datasets
            state.dataset = null;
            state.region_datasets = {
                loading: action.loading,
                datasets: action.datasets
            };
            return {
                ...state
            };
        case DATASETS_RESOURCE_QUERY:
            // Return model details
            state.dataset = {
                loading: action.loading,
                dataset: action.dataset
            }
            return {
                ...state,
            };
        case DATASET_ADD:
            let tmp = {...state.datasets};
            tmp[action.dsid] = action.dataset;
            return {
                ...state, datasets: tmp
            };
        default:
            return state;
    }
};

export default datasets;
