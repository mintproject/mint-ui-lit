import { IdMap } from 'app/reducers'
import { MCActionAdd, MCActionDelete, MODEL_CATALOG_ADD, MODEL_CATALOG_DELETE, ActionThunk } from '../actions';
import { ModelCatalogTypes } from '../reducers';
import { Configuration, BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from '../default-redux-api';
import { Model, ModelApi, CoupledModel, CoupledModelApi } from '@mintproject/modelcatalog_client';

export class CustomModelApi extends DefaultReduxApi<Model, ModelApi> {
    private _coupledApi : CoupledModelApi;
    public isCoupledModel : (t: string) => boolean = (t:string) => (t === "https://w3id.org/okn/o/sdm#CoupledModel" || t === "CoupledModel");

    public constructor (ApiType: new (cfg?:Configuration) => ModelApi, user:string, config?:Configuration) {
        //This ignores ApiType and uses model/coupled model instead.
        super(ModelApi, user, config);
        if (config) {
            this._coupledApi = new CoupledModelApi(config);
        } else {
            this._coupledApi = new CoupledModelApi();
        }
    }

    public get : ActionThunk<Promise<Model|CoupledModel>, MCActionAdd> = (uri:string) => (dispatch) => {
        let id : string = this._getIdFromUri(uri);
        return new Promise((resolve,reject) => {
            let req : Promise<Model> = this._api.modelsIdGet({username: this._username, id: id});
            req.then((resp:Model) => {
                if (resp.type.some(this.isCoupledModel)) {
                    //Is coupled model
                    let req2 : Promise<CoupledModel> = this._coupledApi.coupledmodelsIdGet({username: this._username, id: id});
                    req2.then((resp2:CoupledModel) => {
                        if (this._redux) {
                            dispatch({
                                type: MODEL_CATALOG_ADD,
                                kind: "model",
                                payload: this._idReducer({}, resp2)
                            });
                        }
                        resolve(resp2);
                    });
                    req2.catch(reject);
                } else {
                    if (this._redux) {
                        dispatch({
                            type: MODEL_CATALOG_ADD,
                            kind: "model",
                            payload: this._idReducer({}, resp)
                        });
                    }
                    resolve(resp);
                }
            });
            req.catch(reject);
        });
    }

    public getAll : ActionThunk<Promise<IdMap<Model|CoupledModel>>, MCActionAdd> = (ignoreCache:boolean=false) => (dispatch) => {
        if (ignoreCache || !this._cached) {
            this._cached = new Promise((resolve, reject) => {
                let req : Promise<Model[]> = this._api.modelsGet({
                    username: this._username,
                    perPage: 200
                });
                let reqCoupled : Promise<CoupledModel[]> = this._coupledApi.coupledmodelsGet({
                    username: this._username,
                    perPage: 200
                });
                let allProm : [Promise<Model[]>, Promise<CoupledModel[]>] = [req, reqCoupled];
                let allReq : Promise<any[]> = Promise.all(allProm);
                allReq.catch((err) => reject(err));
                allReq.then(([models, coupledModels]) => {
                    let idModels : IdMap<Model> = models.reduce(this._idReducer, {});
                    let idCoupledModels : IdMap<CoupledModel> = coupledModels.reduce(this._idReducer, {});
                    let both : IdMap<Model|CoupledModel> = { ...idModels, ...idCoupledModels };
                    if (this._redux) dispatch({
                        type: MODEL_CATALOG_ADD,
                        kind: "model",
                        payload: both
                    });
                    resolve(both);
                });
            });
        }
        return this._cached;
    }

    public delete : ActionThunk<Promise<void>, MCActionDelete> = (resource:Model|CoupledModel) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        let uri : string = resource.id;
        let id : string = this._getIdFromUri(uri);
        let req : Promise<void> = this._api.modelsIdDelete({user: this._username, id: id});
        if (this._redux) req.then(() => {
            dispatch({
                type: MODEL_CATALOG_DELETE,
                kind: "model",
                uri: uri
            });
        });
        return req;
    }

    public put : ActionThunk<Promise<Model|CoupledModel>, MCActionAdd> = (resource:Model|CoupledModel) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        let id : string = this._getIdFromUri(resource.id);
        let reqParams = {
            user: this._username,
            id: id,
        };
        let isCoupled : boolean = resource.type.some(this.isCoupledModel);
        let name : string = isCoupled ? 'coupledModel' : "model";
        let call : string = isCoupled ? 'coupledmodelsIdPut' : 'modelsIdPut';
        let api : BaseAPI = isCoupled ? this._coupledApi : this._api;

        reqParams[name] = resource;
        let req : Promise<Model|CoupledModel> = api[call](reqParams);
        req.then((resp:Model|CoupledModel) => {
            if (this._redux) dispatch({
                type: MODEL_CATALOG_ADD,
                kind: "model",
                payload: this._idReducer({}, resp)
            });
        });
        return req;
    }

    public post : ActionThunk<Promise<Model|CoupledModel>, MCActionAdd> = (resource:Model|CoupledModel) => (dispatch) => {
        if (!this.isEditable()) return this._notAllowedError();
        if (resource.id) return Promise.reject(new Error('POST error. Resource has id:' + resource.id));
        else {
            let reqParams = { user: this._username };
            let isCoupled : boolean = resource.type.some(this.isCoupledModel);
            let name : string = isCoupled ? 'coupledModel' : "model";
            let call : string = isCoupled ? 'coupledmodelsPost' : 'modelsPost';
            let api : BaseAPI = isCoupled ? this._coupledApi : this._api;

            reqParams[name] = resource;
            let req : Promise<Model|CoupledModel> = api[call](reqParams);
            req.then((resp:Model|CoupledModel) => {
                if (this._redux) dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: "model",
                    payload: this._createIdMap(resp)
                });
            });
            return req;
        }
    }
}
