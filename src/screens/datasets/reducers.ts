import { IdNameObject } from "../../app/reducers";
import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { DATASETS_VARIABLES_QUERY, DATASETS_DETAIL, DATASETS_LIST, DATASETS_GENERAL_QUERY } from "./actions";
import { DateRange } from "screens/modeling/reducers";
import { BoundingBox } from "screens/regions/reducers";

export interface Dataset extends IdNameObject {
    region: string,
    variables: string[],
    time_period: DateRange,
    description: string,
    version: string,
    limitations: string,
    source: Source,
    categories?: string[],
    resources: DataResource[]
};

export interface DataResource extends IdNameObject {
    url: string
    time_period?: DateRange
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
    datasets: ModelDatasets
    dataset: DatasetDetail | null
    workflow_type?: String,
}
export interface DatasetsWithStatus {
    loading: boolean,
    datasets: Dataset[]
}
export type ModelInputDatasets = Map<string, DatasetsWithStatus[]>
export type ModelDatasets = Map<string, ModelInputDatasets>

const INITIAL_STATE: DatasetsState = { 
    datasets: {} as ModelDatasets, 
    dataset: {} as DatasetDetail,
};

const datasets: Reducer<DatasetsState, RootAction> = (state = INITIAL_STATE, action) => {

    switch (action.type) {
        case DATASETS_VARIABLES_QUERY:
            // Return datasets
            state.datasets = { ...state.datasets };
            state.datasets[action.modelid] = state.datasets[action.modelid] || {};
            state.datasets[action.modelid][action.inputid] = {
                loading: action.loading,
                datasets: action.datasets
            }
            return {
                ...state
            };

        case DATASETS_LIST:
        case DATASETS_GENERAL_QUERY:
            // Return datasets
            state.datasets = { ...state.datasets };
            state.datasets["*"] = {
                "*" : {
                    loading: action.loading,
                    datasets: action.datasets
                }
            };
            return {
                ...state
            };

        case DATASETS_DETAIL:
            // Return model details
            return {
                ...state,
                dataset: action.dataset
            };
        default:
            return state;
    }
};

export default datasets;