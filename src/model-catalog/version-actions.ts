import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, SoftwareVersion, SoftwareVersionApi, Model } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         getUser, modelPut, modelGet } from './actions';

function debug (...args: any[]) { console.log('[MC SoftwareVersion]', ...args); }

export const VERSIONS_ADD = "VERSIONS_ADD";
export const VERSION_DELETE = "VERSION_DELETE";

interface MCAVersionsAdd extends Action<'VERSIONS_ADD'> { payload: IdMap<SoftwareVersion> };
interface MCAVersionDelete extends Action<'VERSION_DELETE'> { uri: string };

export type ModelCatalogVersionAction =  MCAVersionsAdd | MCAVersionDelete;

let versionsPromise : Promise<IdMap<SoftwareVersion>> | null = null;

export const versionsGet: ActionThunk<Promise<IdMap<SoftwareVersion>>, MCAVersionsAdd> = () => (dispatch) => {
    if (!versionsPromise) {
        versionsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : SoftwareVersionApi = new SoftwareVersionApi();
            let req : Promise<SoftwareVersion[]> = api.softwareversionsGet({username: getUser()});
            req.then((resp:SoftwareVersion[]) => {
                let data : IdMap<SoftwareVersion> = resp.reduce(idReducer, {});
                dispatch({
                    type: VERSIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Versions', err);
                reject(err);
            });
        });
    } else {
        debug('All versions are already in memory or loading');
    }
    return versionsPromise;
}

export const versionGet: ActionThunk<Promise<SoftwareVersion>, MCAVersionsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : SoftwareVersionApi = new SoftwareVersionApi();
    let req : Promise<SoftwareVersion> = api.softwareversionsIdGet({username: getUser(), id: id});
    req.then((resp:SoftwareVersion) => {
        dispatch({
            type: VERSIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET SoftwareVersion', err);
    });
    return req;
}

export const versionPost: ActionThunk<Promise<SoftwareVersion>, MCAVersionsAdd> = (version:SoftwareVersion, model:Model) => (dispatch) => {
    if (!model || !model.id) {
        return Promise.reject(new Error('Version creation needs a valid model.'));
    }
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', version);
        let postProm = new Promise((resolve,reject) => {
            let api : SoftwareVersionApi = new SoftwareVersionApi(cfg);
            let req = api.softwareversionsPost({user: user, softwareVersion: version}); // This should be my username on prod.
            req.then((resp:SoftwareVersion) => {
                debug('Response for POST', resp);
                dispatch({
                    type: VERSIONS_ADD,
                    payload: createIdMap(resp)
                });

                // ADD Version to Model
                dispatch(modelGet(model.id)).then((sModel:Model) => {
                    let syncModel = { ...sModel };
                    if (syncModel.hasVersion) syncModel.hasVersion.push(resp);
                    else syncModel.hasVersion = [resp];
                    //FIXME: --> FIX DATES
                    if (syncModel.dateCreated) delete syncModel.dateCreated;
                    dispatch(modelPut(syncModel)).then((rModel:Model) => {
                        resolve(resp);
                    });
                });
            });
            req.catch((err) => {
                console.error('Error on POST SoftwareVersion', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('SoftwareVersion error'));
    }
}

export const versionPut: ActionThunk<Promise<SoftwareVersion>, MCAVersionsAdd> = (version: SoftwareVersion) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', version);
        let api : SoftwareVersionApi = new SoftwareVersionApi(cfg);
        let id : string = getIdFromUri(version.id);
        let req : Promise<SoftwareVersion> = api.softwareversionsIdPut({id: id, user: user, softwareVersion: version});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: VERSIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT SoftwareVersion', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const versionDelete: ActionThunk<void, MCAVersionDelete> = (version:SoftwareVersion) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', version.id);
        let api : SoftwareVersionApi = new SoftwareVersionApi(cfg);
        let id : string = getIdFromUri(version.id);
        let req : Promise<void> = api.softwareversionsIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: VERSION_DELETE,
                uri: version.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE SoftwareVersion', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
