import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, SoftwareVersion, SoftwareVersionApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('[MC Version]', ...args); }

export const ALL_VERSIONS = 'ALL_VERSIONS'

export const VERSIONS_GET = "VERSIONS_GET";
interface MCAVersionsGet extends Action<'VERSIONS_GET'> { payload: any };
export const versionsGet: ActionCreator<ModelCatalogVersionThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_VERSIONS] || state.modelCatalog.loading[ALL_VERSIONS])) {
        debug('All versions are already in memory or loading')
        return;
    }
    dispatch({type: START_LOADING, id: ALL_VERSIONS});

    let api = new SoftwareVersionApi();
    let req = api.softwareversionsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: VERSIONS_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_VERSIONS});
    });
    req.catch((err) => {console.log('Error on GET versions', err)});
}

export const VERSION_GET = "VERSION_GET";
interface MCAVersionGet extends Action<'VERSION_GET'> { payload: any };
export const versionGet: ActionCreator<ModelCatalogVersionThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching version', uri);
    let id : string = uri.split('/').pop();
    let api : SoftwareVersionApi = new SoftwareVersionApi();
    let req = api.softwareversionsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: VERSION_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getVersion', err)});
}

export type ModelCatalogVersionAction =  MCACommon | MCAVersionsGet | MCAVersionGet;
type ModelCatalogVersionThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogVersionAction>;
