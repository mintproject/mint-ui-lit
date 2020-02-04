import { Reducer } from "redux";
import { RootAction } from "app/store";
import { DATASETS_ADD } from './actions'
import { IdMap } from 'app/reducers'
import { Dataset } from './datacatalog_client';

export interface DataCatalogState {
    datasets: IdMap<Dataset>;
}

const INITIAL_STATE: DataCatalogState = { 
    datasets: {} as IdMap<Dataset>
} as DataCatalogState;

const dataCatalog: Reducer<DataCatalogState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case DATASETS_ADD:
            return { ...state, datasets: {...state.datasets, ...action.datasets} };
        default:
            return state;
    }
}

export default dataCatalog;
