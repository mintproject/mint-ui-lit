import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, Process, ProcessApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, repeatAction, PREFIX_URI, 
         DEFAULT_GRAPH, START_LOADING, END_LOADING, START_POST, END_POST } from './actions';

function debug () { console.log('OBA:', ...arguments); }

export const ALL_PROCESSES = 'ALL_PROCESSES'

export const PROCESSES_GET = "PROCESSES_GET";
interface MCAProcessesGet extends Action<'PROCESSES_GET'> { payload: any };
export const processesGet: ActionCreator<ModelCatalogProcessThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_PROCESSES] || state.modelCatalog.loading[ALL_PROCESSES])) {
        console.log('All processes are already in memory or loading')
        return;
    }

    debug('Fetching all process');
    dispatch({type: START_LOADING, id: ALL_PROCESSES});

    let api : ProcessApi = new ProcessApi();
    api.processsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            console.log('DATA', data);
            dispatch({
                type: PROCESSES_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_PROCESSES});
        })
        .catch((err) => {console.log('Error on GET processes', err)})
}

export const PROCESS_GET = "PROCESS_GET";
interface MCAProcessGet extends Action<'PROCESS_GET'> { payload: any };
export const processGet: ActionCreator<ModelCatalogProcessThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching process', uri);
    let id : string = uri.split('/').pop();
    let api : ProcessApi = new ProcessApi();
    api.processsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: PROCESS_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getProcess', err)})
}

export const PROCESS_POST = "PROCESS_POST";
interface MCAProcessPost extends Action<'PROCESS_POST'> { payload: any };
export const processPost: ActionCreator<ModelCatalogProcessThunkResult> = (process:Process, identifier:string) => (dispatch) => {
    debug('creating new process', process);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        process.id = undefined;
        let api : ProcessApi = new ProcessApi(cfg);
        api.processsPost({user: DEFAULT_GRAPH, process: process}) // This should be my username on prod.
            .then((resp) => {
                console.log('Response for POST process:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: PROCESS_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
            })
            .catch((err) => {console.log('Error on POST process', err)})
    } else if (status === 'LOADING') {
        repeatAction(processPost, process);
    }
}

export const PROCESS_PUT = "PROCESS_PUT";
interface MCAProcessPut extends Action<'PROCESS_PUT'> { payload: any };
export const processPut: ActionCreator<ModelCatalogProcessThunkResult> = ( process: Process ) => (dispatch) => {
    debug('updating process', process.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: process.id});
        let api : ProcessApi = new ProcessApi(cfg);
        let id : string = process.id.split('/').pop();
        api.processsIdPut({id: id, user: DEFAULT_GRAPH, process: process}) // This should be my username on prod.
            .then((resp) => {
                console.log('Response for PUT process:', resp);
                let data = {};
                data[process.id] = resp;
                dispatch({
                    type: PROCESS_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: process.id});
            })
            .catch((err) => {console.log('Error on PUT process', err)})
    } else if (status === 'LOADING') {
        repeatAction(processPut, process);
    }
}

export type ModelCatalogProcessAction =  MCAProcessesGet | MCAProcessGet | MCAProcessPost | MCAProcessPut;
type ModelCatalogProcessThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogProcessAction>;
