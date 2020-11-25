import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, ModelCategory, ModelCategoryApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC Category]', ...args); }

export const CATEGORY_ADD = "CATEGORY_ADD";
export const CATEGORY_DELETE = "CATEGORY_DELETE";

interface MCACategoryAdd extends Action<'CATEGORY_ADD'> { payload: IdMap<ModelCategory> };
interface MCACategoryDelete extends Action<'CATEGORY_DELETE'> { uri: string };

export type ModelCatalogCategoryAction =  MCACategoryAdd | MCACategoryDelete;

let categorysPromise : Promise<IdMap<ModelCategory>> | null = null;

export const categoriesGet: ActionThunk<Promise<IdMap<ModelCategory>>, MCACategoryAdd> = () => (dispatch) => {
    if (!categorysPromise) {
        categorysPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let user : string = getUser();
            let api : ModelCategoryApi = new ModelCategoryApi();
            let req2 : Promise<ModelCategory[]> = api.modelcategorysGet({username: user});

            let promises : Promise<ModelCategory[]>[] = [req2];
            promises.forEach((p:Promise<ModelCategory[]>, i:number) => {
                p.then((resp:ModelCategory[]) => dispatch({ type: CATEGORY_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET Categorys ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<ModelCategory> = {};
                values.forEach((tis:ModelCategory[]) => {
                    data = tis.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET Categorys', err);
                reject(err);
            });
        });
    } else {
        debug('All categorys are already in memory or loading');
    }
    return categorysPromise;
}

export const categoryGet: ActionThunk<Promise<ModelCategory>, MCACategoryAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : ModelCategoryApi = new ModelCategoryApi();
    let req : Promise<ModelCategory> = api.modelcategorysIdGet({username: user, id: id});
    req.then((resp:ModelCategory) => {
        dispatch({
            type: CATEGORY_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Category', err);
    });
    return req;
}

export const categoryPost: ActionThunk<Promise<ModelCategory>, MCACategoryAdd> = (category:ModelCategory) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', category);
        let postProm = new Promise((resolve,reject) => {
            let api : ModelCategoryApi = new ModelCategoryApi(cfg);
            let req = api.modelcategorysPost({user: user, modelCategory: category}); // This should be my username on prod.
            req.then((resp:ModelCategory) => {
                debug('Response for POST', resp);
                dispatch({
                    type: CATEGORY_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Category', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Category error'));
    }
}

export const categoryPut: ActionThunk<Promise<ModelCategory>, MCACategoryAdd> = (category: ModelCategory) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', category);
        let api : ModelCategoryApi = new ModelCategoryApi(cfg);
        let id : string = getIdFromUri(category.id);
        let req : Promise<ModelCategory> = api.modelcategorysIdPut({id: id, user: user, modelCategory: category});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: CATEGORY_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Category', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const categoryDelete: ActionThunk<void, MCACategoryDelete> = (category:ModelCategory) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', category.id);
        let api : ModelCategoryApi = new ModelCategoryApi(cfg);
        let id : string = getIdFromUri(category.id);
        let req : Promise<void> = api.modelcategorysIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: CATEGORY_DELETE,
                uri: category.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Category', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
