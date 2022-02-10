import { MCActionAdd, ActionThunk, MODEL_CATALOG_ADD } from '../actions';
import { Configuration } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from '../default-redux-api';
import { Parameter, ParameterApi } from '@mintproject/modelcatalog_client';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { IdMap } from 'app/reducers';

export class CustomParameterApi extends DefaultReduxApi<Parameter, ParameterApi> {
    public constructor (ApiType: new (cfg?:Configuration) => ParameterApi, user:string, config?:Configuration) {
        super(ParameterApi, user, config);
        this._redux = false;
        // We will do the redux here
    }

    private _fixRecommendedIncrement (p:Parameter) : Parameter {
        if (p.recommendedIncrement && p.recommendedIncrement.length > 0) {
            //Should only be one
            if (typeof p.recommendedIncrement[0] === 'string' || (p.recommendedIncrement[0] as any) instanceof String) {
                console.log("Fixed recommended increment", p.recommendedIncrement[0]);
                p.recommendedIncrement = [ parseFloat(String(p.recommendedIncrement[0])) ];
            }
        }
        return p;
    }

    private simpleGet : ActionThunk<Promise<Parameter>, MCActionAdd> = this.get;
    private simpleGetAll : ActionThunk<Promise<IdMap<Parameter>>, MCActionAdd> = this.getAll;
    private simplePost : ActionThunk<Promise<Parameter>, MCActionAdd> = this.post;
    private simplePut : ActionThunk<Promise<Parameter>, MCActionAdd> = this.put;

    public get : ActionThunk<Promise<Parameter>, MCActionAdd> = (uri:string) => (dispatch) => {
        return new Promise((resolve, reject) => { 
            let pReq : Promise<Parameter> = dispatch(this.simpleGet(uri));
            pReq.catch(reject);
            pReq.then((parameter: Parameter) => {
                parameter = this._fixRecommendedIncrement(parameter);
                dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: "parameter",
                    payload: this._idReducer({}, parameter)
                });
                resolve(parameter);
            });
        });
    }

    public getAll : ActionThunk<Promise<IdMap<Parameter>>, MCActionAdd> = (ignoreCache:boolean=false) => (dispatch) => {
        return new Promise((resolve, reject) => { 
            let pReq : Promise<IdMap<Parameter>> = dispatch(this.simpleGetAll());
            pReq.catch(reject);
            pReq.then((parameters: IdMap<Parameter>) => {
                Object.keys(parameters).forEach((paramid:string) => {
                    parameters[paramid] = this._fixRecommendedIncrement(parameters[paramid]);
                })
                dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: "parameter",
                    payload: parameters
                });
                resolve(parameters);
            });

        });
    }

    public post : ActionThunk<Promise<Parameter>, MCActionAdd> = (resource:Parameter) => (dispatch) => {
        return new Promise((resolve, reject) => { 
            resource = this._fixRecommendedIncrement(resource);
            let pReq : Promise<Parameter> = dispatch(this.simplePost(resource));
            pReq.catch(reject);
            pReq.then((param:Parameter) => {
                dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: "parameter",
                    payload: this._createIdMap(param)
                });
                resolve(param);
            });
        });
    }

    public put : ActionThunk<Promise<Parameter>, MCActionAdd> = (resource:Parameter) => (dispatch) => {
        return new Promise((resolve, reject) => { 
            resource = this._fixRecommendedIncrement(resource);
            let pReq : Promise<Parameter> = dispatch(this.simplePut(resource));
            pReq.catch(reject);
            pReq.then((param:Parameter) => {
                dispatch({
                    type: MODEL_CATALOG_ADD,
                    kind: "parameter",
                    payload: this._idReducer({}, param)
                });
                resolve(param);
            });
        });
    }

}
