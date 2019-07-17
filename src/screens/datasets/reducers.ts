import { IdNameObject } from "../../app/reducers";
import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { DATASETS_VARIABLES_QUERY, DATASETS_DETAIL, DATASETS_LIST } from "./actions";

export interface Dataset extends IdNameObject {
    region: string,
    variables: string[],
    time_period: string,
    description: string,
    version: string,
    limitations: string,
    source: Source,
    categories?: string[]
};

export interface DatasetDetail extends Dataset {
    documentation: string,
    image: string
}

export interface Source {
    name: string,
    url: string,
    type: string
}

export interface DatasetsState {
    datasets: ModelDatasets
    dataset: DatasetDetail
}
export type ModelInputDatasets = Map<string, Dataset[]>
export type ModelDatasets = Map<string, ModelInputDatasets>

const INITIAL_STATE: DatasetsState = { datasets: {} as ModelDatasets, dataset: {} as DatasetDetail };

const datasets: Reducer<DatasetsState, RootAction> = (state = INITIAL_STATE, action) => {

    switch (action.type) {
        case DATASETS_VARIABLES_QUERY:
            // Return datasets
            state.datasets = { ...state.datasets };
            state.datasets[action.modelid] = state.datasets[action.modelid] || {};
            state.datasets[action.modelid][action.inputid] = action.datasets;
            return {
                ...state
            };

        case DATASETS_LIST:
            // Return datasets
            state.datasets = { ...state.datasets };
            state.datasets["*"] = {
                "*" : action.datasets
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