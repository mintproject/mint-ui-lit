import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, SourceCode, SourceCodeApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser,
         DEFAULT_GRAPH, geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC SourceCode]', ...args); }

export const SOURCE_CODES_ADD = "SOURCE_CODES_ADD";
export const SOURCE_CODE_DELETE = "SOURCE_CODE_DELETE";

interface MCASourceCodesAdd extends Action<'SOURCE_CODES_ADD'> { payload: IdMap<SourceCode> };
interface MCASourceCodeDelete extends Action<'SOURCE_CODE_DELETE'> { uri: string };

export type ModelCatalogSourceCodeAction =  MCASourceCodesAdd | MCASourceCodeDelete;

let sourceCodesPromise : Promise<IdMap<SourceCode>> | null = null;

export const sourceCodesGet: ActionThunk<Promise<IdMap<SourceCode>>, MCASourceCodesAdd> = () => (dispatch) => {
    if (!sourceCodesPromise) {
        debug('Fetching all');
        let api : SourceCodeApi = new SourceCodeApi();
        sourceCodesPromise = new Promise((resolve, reject) => {
            let req : Promise<SourceCode[]> = api.sourcecodesGet({username: DEFAULT_GRAPH});
            req.then((resp:SourceCode[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<SourceCode>
                dispatch({
                    type: SOURCE_CODES_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET SourceCodes', err);
                reject(err);
            });
        });
    } else {
        debug('All sourceCodes are already in memory or loading');
    }
    return sourceCodesPromise;
}

export const sourceCodeGet: ActionThunk<Promise<SourceCode>, MCASourceCodesAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : SourceCodeApi = new SourceCodeApi();
    let req : Promise<SourceCode> = api.sourcecodesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:SourceCode) => {
        dispatch({
            type: SOURCE_CODES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET SourceCode', err)
    });
    return req;
}

export const sourceCodePost: ActionThunk<Promise<SourceCode>, MCASourceCodesAdd> = (sourceCode:SourceCode) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', sourceCode);
        let postProm = new Promise((resolve,reject) => {
            let api : SourceCodeApi = new SourceCodeApi(cfg);
            let req = api.sourcecodesPost({user: DEFAULT_GRAPH, sourceCode: sourceCode});
            req.then((resp:SourceCode) => {
                debug('Response for POST', resp);
                dispatch({
                    type: SOURCE_CODES_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST SourceCode', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('SourceCode error'));
    }
}

export const sourceCodePut: ActionThunk<Promise<SourceCode>, MCASourceCodesAdd> = (sourceCode:SourceCode) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', sourceCode);
        let api : SourceCodeApi = new SourceCodeApi(cfg);
        let id : string = getIdFromUri(sourceCode.id);
        let req : Promise<SourceCode> = api.sourcecodesIdPut({id: id, user: DEFAULT_GRAPH, sourceCode: sourceCode});
        req.then((resp:SourceCode) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: SOURCE_CODES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT SourceCode', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const sourceCodeDelete: ActionThunk<void, MCASourceCodeDelete> = (sourceCode:SourceCode) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', sourceCode);
        let api : SourceCodeApi = new SourceCodeApi(cfg);
        let id : string = getIdFromUri(sourceCode.id);
        let req : Promise<void> = api.sourcecodesIdDelete({id: id, user: DEFAULT_GRAPH});
        req.then(() => {
            dispatch({
                type: SOURCE_CODE_DELETE,
                uri: sourceCode.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE SourceCode', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
