import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Dataset, DatasetDetail } from "./reducers";
import { EXAMPLE_DATASETS_QUERY } from "../../offline_data/sample_datasets";

export const DATASETS_VARIABLES_QUERY = 'DATASETS_VARIABLES_QUERY';
export const DATASETS_LIST = 'DATASETS_LIST';
export const DATASETS_DETAIL = 'DATASETS_DETAIL';

export interface DatasetsActionList extends Action<'DATASETS_LIST'> { datasets: Dataset[] };
export interface DatasetsActionVariablesQuery extends Action<'DATASETS_VARIABLES_QUERY'> { 
    modelid: string, 
    inputid: string, 
    datasets: Dataset[] 
};
export interface DatasetsActionDetail extends Action<'DATASETS_DETAIL'> { dataset: DatasetDetail };

export type DatasetsAction = DatasetsActionVariablesQuery | DatasetsActionDetail | DatasetsActionList;

//const DATA_CATALOG_URI = "https://api.mint-data-catalog.org";

// List all Datasets
type ListDatasetsThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionList>;
export const listAllDatasets: ActionCreator<ListDatasetsThunkResult> = () => (dispatch) => {

    /*
    fetch(DATA_CATALOG_URI + "/datasets/find").then((response) => {
        response.json().then((obj) => {
            let models = [] as Model[];
            let bindings = obj["results"]["bindings"];
            bindings.map((binding: Object) => {
                models.push({
                    name: binding["label"]["value"],
                    description: binding["desc"]["value"],
                    original_model: binding["model"]["value"]
                } as Model);
            });
            dispatch({
                type: MODELS_LIST,
                models
            });            
        })
    });
    */

    dispatch({
        type: DATASETS_LIST,
        datasets: EXAMPLE_DATASETS_QUERY as Dataset[]
    });
};

// Query Data Catalog by Variables
type QueryDatasetsThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionVariablesQuery>;
export const queryDatasetsByVariables: ActionCreator<QueryDatasetsThunkResult> = 
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
            type: DATASETS_VARIABLES_QUERY,
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