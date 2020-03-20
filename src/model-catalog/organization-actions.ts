import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Organization, OrganizationApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC Organization]', ...args); }

export const ORGANIZATIONS_ADD = "ORGANIZATIONS_ADD";
export const ORGANIZATION_DELETE = "ORGANIZATION_DELETE";

interface MCAOrganizationsAdd extends Action<'ORGANIZATIONS_ADD'> { payload: IdMap<Organization> };
interface MCAOrganizationDelete extends Action<'ORGANIZATION_DELETE'> { uri: string };

export type ModelCatalogOrganizationAction =  MCAOrganizationsAdd | MCAOrganizationDelete;

let organizationsPromise : Promise<IdMap<Organization>> | null = null;

export const organizationsGet: ActionThunk<Promise<IdMap<Organization>>, MCAOrganizationsAdd> = () => (dispatch) => {
    if (!organizationsPromise) {
        organizationsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : OrganizationApi = new OrganizationApi();
            let req : Promise<Organization[]> = api.organizationsGet({username: DEFAULT_GRAPH});
            req.then((resp:Organization[]) => {
                let data : IdMap<Organization> = resp.reduce(idReducer, {});
                dispatch({
                    type: ORGANIZATIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Organizations', err);
                reject(err);
            });
        });
    } else {
        debug('All organizations are already in memory or loading');
    }
    return organizationsPromise;
}

export const organizationGet: ActionThunk<Promise<Organization>, MCAOrganizationsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : OrganizationApi = new OrganizationApi();
    let req : Promise<Organization> = api.organizationsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Organization) => {
        dispatch({
            type: ORGANIZATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Organization', err);
    });
    return req;
}

export const organizationPost: ActionThunk<Promise<Organization>, MCAOrganizationsAdd> = (organization:Organization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', organization);
        let postProm = new Promise((resolve,reject) => {
            let api : OrganizationApi = new OrganizationApi(cfg);
            let req = api.organizationsPost({user: DEFAULT_GRAPH, organization: organization}); // This should be my username on prod.
            req.then((resp:Organization) => {
                debug('Response for POST', resp);
                dispatch({
                    type: ORGANIZATIONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Organization', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Organization error'));
    }
}

export const organizationPut: ActionThunk<Promise<Organization>, MCAOrganizationsAdd> = (organization: Organization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', organization);
        let api : OrganizationApi = new OrganizationApi(cfg);
        let id : string = getIdFromUri(organization.id);
        let req : Promise<Organization> = api.organizationsIdPut({id: id, user: DEFAULT_GRAPH, organization: organization});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: ORGANIZATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Organization', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const organizationDelete: ActionThunk<void, MCAOrganizationDelete> = (organization:Organization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', organization.id);
        let api : OrganizationApi = new OrganizationApi(cfg);
        let id : string = getIdFromUri(organization.id);
        let req : Promise<void> = api.organizationsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: ORGANIZATION_DELETE,
                uri: organization.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Organization', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
