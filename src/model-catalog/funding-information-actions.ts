import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, FundingInformation, FundingInformationApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC FundingInformation]', ...args); }

export const FUNDING_INFORMATIONS_ADD = "FUNDING_INFORMATIONS_ADD";
export const FUNDING_INFORMATION_DELETE = "FUNDING_INFORMATION_DELETE";

interface MCAFundingInformationsAdd extends Action<'FUNDING_INFORMATIONS_ADD'> { payload: IdMap<FundingInformation> };
interface MCAFundingInformationDelete extends Action<'FUNDING_INFORMATION_DELETE'> { uri: string };

export type ModelCatalogFundingInformationAction =  MCAFundingInformationsAdd | MCAFundingInformationDelete;

let fundingInformationsPromise : Promise<IdMap<FundingInformation>> | null = null;

export const fundingInformationsGet: ActionThunk<Promise<IdMap<FundingInformation>>, MCAFundingInformationsAdd> = () => (dispatch) => {
    if (!fundingInformationsPromise) {
        fundingInformationsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : FundingInformationApi = new FundingInformationApi();
            let req : Promise<FundingInformation[]> = api.fundinginformationsGet({username: DEFAULT_GRAPH});
            req.then((resp:FundingInformation[]) => {
                let data : IdMap<FundingInformation> = resp.reduce(idReducer, {});
                dispatch({
                    type: FUNDING_INFORMATIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET FundingInformations', err);
                reject(err);
            });
        });
    } else {
        debug('All fundingInformations are already in memory or loading');
    }
    return fundingInformationsPromise;
}

export const fundingInformationGet: ActionThunk<Promise<FundingInformation>, MCAFundingInformationsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : FundingInformationApi = new FundingInformationApi();
    let req : Promise<FundingInformation> = api.fundinginformationsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:FundingInformation) => {
        dispatch({
            type: FUNDING_INFORMATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET FundingInformation', err);
    });
    return req;
}

export const fundingInformationPost: ActionThunk<Promise<FundingInformation>, MCAFundingInformationsAdd> = (fundingInformation:FundingInformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', fundingInformation);
        let postProm = new Promise((resolve,reject) => {
            let api : FundingInformationApi = new FundingInformationApi(cfg);
            let req = api.fundinginformationsPost({user: DEFAULT_GRAPH, fundingInformation: fundingInformation}); // This should be my username on prod.
            req.then((resp:FundingInformation) => {
                debug('Response for POST', resp);
                dispatch({
                    type: FUNDING_INFORMATIONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST FundingInformation', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('FundingInformation error'));
    }
}

export const fundingInformationPut: ActionThunk<Promise<FundingInformation>, MCAFundingInformationsAdd> = (fundingInformation: FundingInformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', fundingInformation);
        let api : FundingInformationApi = new FundingInformationApi(cfg);
        let id : string = getIdFromUri(fundingInformation.id);
        let req : Promise<FundingInformation> = api.fundinginformationsIdPut({id: id, user: DEFAULT_GRAPH, fundingInformation: fundingInformation});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: FUNDING_INFORMATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT FundingInformation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const fundingInformationDelete: ActionThunk<void, MCAFundingInformationDelete> = (fundingInformation:FundingInformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', fundingInformation.id);
        let api : FundingInformationApi = new FundingInformationApi(cfg);
        let id : string = getIdFromUri(fundingInformation.id);
        let req : Promise<void> = api.fundinginformationsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: FUNDING_INFORMATION_DELETE,
                uri: fundingInformation.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE FundingInformation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
