import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../store";
import { Dataset, DatasetDetail } from "../reducers/datasets";
import { EXAMPLE_DATASETS_QUERY } from "../offline_data/sample_datasets";

export const DATASETS_QUERY = 'DATASETS_QUERY';
export const DATASETS_DETAIL = 'DATASETS_DETAIL';

export interface DatasetsActionQuery extends Action<'DATASETS_QUERY'> { modelid: string, inputid: string, datasets: Dataset[] };
export interface DatasetsActionDetail extends Action<'DATASETS_DETAIL'> { dataset: DatasetDetail };

export type DatasetsAction = DatasetsActionQuery | DatasetsActionDetail;

// Query Data Catalog
type QueryDatasetsThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionQuery>;
export const queryDatasets: ActionCreator<QueryDatasetsThunkResult> = 
        (modelid: string, inputid: string, driving_variables: string[]) => (dispatch) => {
    let datasets = [] as Dataset[];
    //console.log(driving_variables);
    EXAMPLE_DATASETS_QUERY.map((ds) => {
        let i=0;
        for(;i<driving_variables.length; i++) {
            if(ds.variables.indexOf(driving_variables[i]) >= 0) {
                datasets.push(ds);
                break;
            }
        }
    });
    if(driving_variables.length > 0) {
        dispatch({
            type: DATASETS_QUERY,
            modelid: modelid,
            inputid: inputid,
            datasets: datasets
        });        
    }
};

// Query Dataset Details
type QueryDataDetailThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionDetail>;
export const queryDatasetDetail: ActionCreator<QueryDataDetailThunkResult> = (datasetid: string) => (dispatch) => {
    if(datasetid) {
        let dataset = {
            id: datasetid,
            name: datasetid
        } as DatasetDetail;
        dispatch({
            type: DATASETS_DETAIL,
            dataset: dataset
        });        
    }
};