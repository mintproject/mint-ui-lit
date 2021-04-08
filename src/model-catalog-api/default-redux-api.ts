import { IdMap } from 'app/reducers'
import { Action } from "redux";
import { MCActionAdd, MCActionDelete, MODEL_CATALOG_ADD, MODEL_CATALOG_DELETE, ActionThunk } from './actions';
import { ModelCatalogTypes } from './reducers';

import { Configuration, BaseAPI } from '@mintproject/modelcatalog_client';
import { IdObject } from './interfaces';
import { DEFAULT_GRAPH, PREFIX_URI } from 'config/default-graph';

// This class adds redux and authentication capabilities to the modelcatalog-client generated APIs.
// The provides the standard get, getAll, put, post and delete but can be customized. Check ./custom-api
export class DefaultReduxApi<T extends IdObject, API extends BaseAPI> {
    protected _api : API;
    protected _username : string;
    protected _redux : boolean = true;
    protected _editable : boolean = false;
    protected _cached : Promise<IdMap<T>>;
    private _name : string;
    private _lname : ModelCatalogTypes;

    public getName () : ModelCatalogTypes {
        return this._lname;
    }

    public constructor (ApiType: new (cfg?:Configuration) => API, user:string, config?:Configuration) {
        if (config) {
            this._api = new ApiType(config);
            if (config.accessToken('')) this._editable = true;
        } else {
            this._api = new ApiType();
            this._redux = false;
        }
        let apiName : string = this._api.constructor.name;
        let name = apiName.replace('Api','');
        this._lname = name.toLowerCase() as ModelCatalogTypes;
        this._name = name.charAt(0).toLowerCase() + name.slice(1);
        this._username = user;
    }

    public get : ActionThunk<Promise<T>, MCActionAdd> = (uri:string) => (dispatch) => {
        let id : string = this._getIdFromUri(uri);
        let req : Promise<T> = this._api[this._lname + 'sIdGet']({username: this._username, id: id});
        if (this._redux) req.then((resp:T) => {
            dispatch({
                type: MODEL_CATALOG_ADD,
                kind: this._lname,
                payload: this._idReducer({}, resp)
            });
        });
        return req;
    }

    public getAll : ActionThunk<Promise<IdMap<T>>, MCActionAdd> = (ignoreCache:boolean=false) => (dispatch) => {
        if (ignoreCache || !this._cached) {
            this._cached = new Promise((resolve, reject) => {
                let req : Promise<T[]> = this._api[this._lname + 'sGet']({
                    username: this._username,
                    perPage: 200
                });

                req.then((resp:T[]) => {
                    let data : IdMap<T> = resp.reduce(this._idReducer, {});
                    if (this._redux) dispatch({
                        type: MODEL_CATALOG_ADD,
                        kind: this._lname,
                        payload: data
                    });
                    resolve(data);
                });
                req.catch((err) => reject(err));
            });
        }
        return this._cached;
    }

    public delete : ActionThunk<Promise<void>, MCActionDelete> = (uri:string) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        let id : string = this._getIdFromUri(uri);
        let req : Promise<void> = this._api[this._lname + 'sIdDelete']({user: this._username, id: id});
        if (this._redux) req.then(() => {
            dispatch({
                type: MODEL_CATALOG_DELETE,
                kind: this._lname,
                uri: uri
            });
        });
        return req;
    }

    public put : ActionThunk<Promise<T>, MCActionAdd> = (resource:T) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        let id : string = this._getIdFromUri(resource.id);
        let reqParams = {
            user: this._username,
            id: id,
        };
        reqParams[this._name] = resource;
        let req : Promise<T> = this._api[this._lname + 'sIdPut'](reqParams);
        req.then((resp:T) => {
            if (this._redux) dispatch({
                type: MODEL_CATALOG_ADD,
                kind: this._lname,
                payload: this._idReducer({}, resp)
            });
        });
        return req;
    }

    public post : ActionThunk<Promise<T>, MCActionAdd> = (resource:T) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        if (resource.id) return Promise.reject(new Error('POST error. Resource has id:' + resource.id));
        else {
            let reqParams = { user: this._username };
            reqParams[this._name] = resource;
            let req : Promise<T> = this._api[this._lname + 'sPost'](reqParams);
            req.then((resp:T) => {
                if (this._redux) dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: this._lname,
                    payload: this._createIdMap(resp)
                });
            });
            return req;
        }
    }

    public isEditable () : boolean {
        return this._editable;
    }

    protected _notAllowedError () : Promise<any> {
        return Promise.reject(new Error("You do not have permissions to modify the " + this._username + " catalog"));
    }

    protected _getIdFromUri (uri:string) : string {
        return uri.split('/').pop();
    }

    // Moves resources to a hashmap (id -> resource)
    protected _idReducer (dic:IdMap<T>, elem:T) : IdMap<T> {
        dic[elem.id] = elem;
        return dic;
    }

    // Creates hashmap (id -> resource)
    protected _createIdMap (item:T) : IdMap<T> {
        let uri : string = PREFIX_URI + item.id
        let map : IdMap<T> = {} as IdMap<T>;
        map[uri] = item;
        item.id = uri;
        return map;
    }
}
