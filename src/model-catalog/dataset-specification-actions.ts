import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, DatasetSpecification, DatasetSpecificationApi, SampleResource,
         SampleCollection } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         sampleCollectionPost, sampleResourcePost } from './actions';

function debug (...args: any[]) { }//console.log('[MC DatasetSpecification]', ...args); }

export const DATASET_SPECIFICATIONS_ADD = "DATASET_SPECIFICATIONS_ADD";
export const DATASET_SPECIFICATION_DELETE = "DATASET_SPECIFICATION_DELETE";

export interface MCADatasetSpecificationsAdd extends Action<'DATASET_SPECIFICATIONS_ADD'> { payload: IdMap<DatasetSpecification> };
interface MCADatasetSpecificationDelete extends Action<'DATASET_SPECIFICATION_DELETE'> { uri: string };

export type ModelCatalogDatasetSpecificationAction =  MCADatasetSpecificationsAdd | MCADatasetSpecificationDelete;

let datasetSpecificationsPromise : Promise<IdMap<DatasetSpecification>> | null = null;

export const datasetSpecificationsGet: ActionThunk<Promise<IdMap<DatasetSpecification>>, MCADatasetSpecificationsAdd> = () => (dispatch) => {
    if (!datasetSpecificationsPromise) {
        datasetSpecificationsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : DatasetSpecificationApi = new DatasetSpecificationApi();
            let user : string = getUser();
            let req2 : Promise<DatasetSpecification[]> = api.datasetspecificationsGet({username: user});

            let promises : Promise<DatasetSpecification[]>[] = [req2];
            promises.forEach((p:Promise<DatasetSpecification[]>, i:number) => {
                p.then((resp:DatasetSpecification[]) => dispatch({ type: DATASET_SPECIFICATIONS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET DatasetSpecifications ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<DatasetSpecification> = {};
                values.forEach((arr:DatasetSpecification[]) => {
                    data = arr.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET DatasetSpecifications', err);
                reject(err);
            });
        });
    } else {
        debug('All datasetSpecifications are already in memory or loading');
    }
    return datasetSpecificationsPromise;
}

export const datasetSpecificationGet: ActionThunk<Promise<DatasetSpecification>, MCADatasetSpecificationsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : DatasetSpecificationApi = new DatasetSpecificationApi();
    let req : Promise<DatasetSpecification> = api.datasetspecificationsIdGet({username: user, id: id});
    req.then((resp:DatasetSpecification) => {
        dispatch({
            type: DATASET_SPECIFICATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET DatasetSpecification', err);
    });
    return req;
}

export const datasetSpecificationPost: ActionThunk<Promise<DatasetSpecification>, MCADatasetSpecificationsAdd> = (datasetSpecification:DatasetSpecification) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', datasetSpecification);
        if (datasetSpecification.id) {
            return Promise.reject(new Error('Cannot create DatasetSpecification, object has ID'));
        } else {
            return new Promise((resolve,reject) => {
                let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
                let req = api.datasetspecificationsPost({user: user, datasetSpecification: datasetSpecification});
                req.then((resp:DatasetSpecification) => {
                    debug('Response for POST', resp);
                    dispatch({
                        type: DATASET_SPECIFICATIONS_ADD,
                        payload: createIdMap(resp)
                    });
                    resolve(resp);
                });
                req.catch((err) => {
                    console.error('Error on POST DatasetSpecification', err);
                    reject(err);
                });
            });
        }
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('DatasetSpecification error'));
    }
}

export const datasetSpecificationPut: ActionThunk<Promise<DatasetSpecification>, MCADatasetSpecificationsAdd> = (datasetSpecification: DatasetSpecification) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', datasetSpecification);
        let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
        let id : string = getIdFromUri(datasetSpecification.id);
        let req : Promise<DatasetSpecification> = api.datasetspecificationsIdPut({id: id, user: user, datasetSpecification: datasetSpecification});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: DATASET_SPECIFICATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT DatasetSpecification', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const datasetSpecificationDelete: ActionThunk<void, MCADatasetSpecificationDelete> = (datasetSpecification:DatasetSpecification) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', datasetSpecification.id);
        let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
        let id : string = getIdFromUri(datasetSpecification.id);
        let req : Promise<void> = api.datasetspecificationsIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: DATASET_SPECIFICATION_DELETE,
                uri: datasetSpecification.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE DatasetSpecification', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
