import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Process, ProcessApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) { console.log('[MC Process]', ...args); }

export const PROCESSES_ADD = "PROCESSES_ADD";
export const PROCESS_DELETE = "PROCESS_DELETE";

interface MCAProcessesAdd extends Action<'PROCESSES_ADD'> { payload: IdMap<Process> };
interface MCAProcessDelete extends Action<'PROCESS_DELETE'> { uri: string };

export type ModelCatalogProcessAction =  MCAProcessesAdd | MCAProcessDelete;

let processesPromise : Promise<IdMap<Process>> | null = null;

export const processesGet: ActionThunk<Promise<IdMap<Process>>, MCAProcessesAdd> = () => (dispatch) => {
    if (!processesPromise) {
        processesPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : ProcessApi = new ProcessApi();
            let req : Promise<Process[]> = api.processsGet({username: DEFAULT_GRAPH});
            req.then((resp:Process[]) => {
                let data : IdMap<Process> = resp.reduce(idReducer, {});
                dispatch({
                    type: PROCESSES_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Processes', err);
                reject(err);
            });
        });
    } else {
        debug('All processes are already in memory or loading');
    }
    return processesPromise;
}

export const processGet: ActionThunk<Promise<Process>, MCAProcessesAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ProcessApi = new ProcessApi();
    let req : Promise<Process> = api.processsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Process) => {
        dispatch({
            type: PROCESSES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Process', err);
    });
    return req;
}

export const processPost: ActionThunk<Promise<Process>, MCAProcessesAdd> = (process:Process) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', process);
        let postProm = new Promise((resolve,reject) => {
            let api : ProcessApi = new ProcessApi(cfg);
            let req = api.processsPost({user: DEFAULT_GRAPH, process: process}); // This should be my username on prod.
            req.then((resp:Process) => {
                debug('Response for POST', resp);
                dispatch({
                    type: PROCESSES_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Process', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Process error'));
    }
}

export const processPut: ActionThunk<Promise<Process>, MCAProcessesAdd> = (process: Process) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', process);
        let api : ProcessApi = new ProcessApi(cfg);
        let id : string = getIdFromUri(process.id);
        let req : Promise<Process> = api.processsIdPut({id: id, user: DEFAULT_GRAPH, process: process});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: PROCESSES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Process', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const processDelete: ActionThunk<void, MCAProcessDelete> = (process:Process) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', process.id);
        let api : ProcessApi = new ProcessApi(cfg);
        let id : string = getIdFromUri(process.id);
        let req : Promise<void> = api.processsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: PROCESS_DELETE,
                uri: process.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Process', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
