import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';
import { IdMap } from 'app/reducers'
import { IdObject } from './interfaces';
import { ModelCatalogTypes } from './reducers';

export type ActionThunk<R,A extends Action> = ActionCreator<ThunkAction<R, RootState, undefined, A>>

export const MODEL_CATALOG_ADD = "MODEL_CATALOG_ADD";
export const MODEL_CATALOG_DELETE = "MODEL_CATALOG_DELETE";

export interface MCActionAdd extends Action<'MODEL_CATALOG_ADD'> {
    kind: ModelCatalogTypes, //Could be a list of accepted model-catalog types
    payload: IdMap<any>
};

export interface MCActionDelete extends Action<'MODEL_CATALOG_DELETE'> { 
    kind: string,
    uri: string 
};

export type ModelCatalogAction = MCActionAdd | MCActionDelete;
