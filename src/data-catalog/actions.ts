import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';
import { IdMap } from 'app/reducers'

import { Dataset, DCResponseToDataset } from './datacatalog_client';

//TODO: get this from prefs
export const API_URI = 'https://api.mint-data-catalog.org';

export type ActionThunk<R,A extends Action> = ActionCreator<ThunkAction<R, RootState, undefined, A>>
//interface IdObject { id?: string };

const idReducer = (dic:any, elem:any) => {
    dic[elem.id] = elem;
    return dic;
}

export type DataCatalogAction = DatasetsAddAction;

export const DATASETS_ADD = 'DATASETS_ADD';
interface DatasetsAddAction extends Action<'DATASETS_ADD'> {
    datasets: IdMap<Dataset>,
}
export interface SearchQueryParameters {
    name?: string;
    variables?: string[];
}

export const searchDatasets: ActionThunk<Promise<IdMap<Dataset>>, DatasetsAddAction> = 
        (searchParameters: SearchQueryParameters) => (dispatch) => {
    let query = {limit: 5000};
    if (searchParameters.name) query["dataset_names__in"] = ['*'+searchParameters.name+'*'];
    if (searchParameters.variables) query["standard_variable_names__in"] = searchParameters.variables;
    //If no parameters, search all
    if (Object.keys(query).length === 1) query["dataset_names__in"] = ['*'];

    //console.log('QUERYING', query);
    return new Promise((resolve, reject) => {
        let req = fetch(API_URI + '/find_datasets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(query)
        });
        req.then((doc) => {
            doc.json().then((response) => {
                let datasets = response.datasets.map(DCResponseToDataset).reduce(idReducer, {});
                dispatch({
                    type: DATASETS_ADD,
                    datasets: datasets
                });
                resolve(datasets);
            });
        });
        req.catch(reject);
    });
}
