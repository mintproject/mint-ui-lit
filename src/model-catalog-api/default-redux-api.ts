import { IdMap } from 'app/reducers'
import { Action } from "redux";
import { MCActionAdd, MCActionDelete, MODEL_CATALOG_ADD, MODEL_CATALOG_DELETE, ActionThunk } from './actions';
import { apiNameToCaptionName, ModelCatalogTypes } from './reducers';

import { Configuration, BaseAPI } from '@mintproject/modelcatalog_client';
import { IdObject } from './interfaces';
import { DEFAULT_GRAPH, PREFIX_URI } from 'config/default-graph';

const PERPAGE = 200; //This is the max the API allows

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

    private getNameFromPrototype (obj:API) : string {
        let proto : object = Object.getPrototypeOf(this._api);
        let fregex : RegExp = /(\w*?)sIdGetRaw/;
        if (!!proto) {
            let name : string;
            Object.getOwnPropertyNames(proto).forEach((funcname:string) => {
                let matches = fregex.exec(funcname);
                if (matches != null && matches.length == 2) {
                    name = matches[1];
                }
            });
            if (!!name) return name;
        }
        return this._api.constructor.name; // This can be an error if the js is simplified.
    }

    public constructor (ApiType: new (cfg?:Configuration) => API, user:string, config?:Configuration) {
        if (config) {
            this._api = new ApiType(config);
            if (config.accessToken('')) this._editable = true;
        } else {
            this._api = new ApiType();
            this._redux = false;
        }
        this._lname =  this.getNameFromPrototype(this._api) as ModelCatalogTypes;
        this._name = apiNameToCaptionName[this._lname];
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
            // Create the promise that will run several requests
            this._cached = new Promise((resolve, reject) => {

                let getNextPage = (page:number) => new Promise<T[]> ((resolve, reject) => {
                    let curPage = this.getAllFromPage(page);
                    curPage.catch(reject);
                    curPage.then((resp:T[]) => {
                        // Fist add data to redux:
                        if (resp.length > 0 && this._redux) {
                            let data : IdMap<T> = resp.reduce(this._idReducer, {});
                            dispatch({
                                type: MODEL_CATALOG_ADD,
                                kind: this._lname,
                                payload: data
                            });
                        }

                        // Then check if we need next page
                        if (resp.length >= PERPAGE) {
                            let nextPage : Promise<T[]> = getNextPage(page+1);
                            nextPage.then((innerResp: T[]) => {
                                resolve(resp.concat(innerResp));
                            });
                            nextPage.catch((err) => {
                                console.error("Error getting page " + page + " of " + this._name);
                                resolve(resp);
                            });
                        } else {
                            resolve(resp);
                        }
                    })
                });

                let all : Promise<T[]> = getNextPage(1);

                all.then((resp:T[]) => {
                    let data : IdMap<T> = resp.reduce(this._idReducer, {});
                    resolve(data);
                });
                all.catch((err) => reject(err));
            });
        }
        return this._cached;
    }

    private getAllFromPage (currentPage:number=1) : Promise<T[]> {
        return this._api[this._lname + 'sGet']({
                username: this._username,
                perPage: PERPAGE,
                page: currentPage
        });
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
