import { BaseAPI } from '@mintproject/modelcatalog_client';
import { IdMap } from 'app/reducers'
import { Action } from "redux";
import { ActionThunk } from './actions';

import { SoftwareVersion, Model } from '@mintproject/modelcatalog_client';

interface IdObject {
    id?: string;
}

type ModelCatalogTypes = "model" | "softwareversion";
type ModelCatalogAdds = "MODEL_ADD" | "VERSIONS_ADD";
type ModelCatalogDels = "MODEL_DELETE" | "VERSION_DELETE";

//---
export interface MCAVersionsAdd extends Action<'VERSIONS_ADD'> { payload: IdMap<SoftwareVersion> };
export interface MCAVersionDelete extends Action<'VERSION_DELETE'> { uri: string };

export interface MCAModelsAdd extends Action<'MODEL_ADD'> { payload: IdMap<Model> };
export interface MCAModelDelete extends Action<'MODEL_DELETE'> { uri: string };

export type ActionsAdds = MCAVersionsAdd | MCAModelsAdd;
export type ActionsDels = MCAVersionDelete | MCAModelDelete;


export type ModelCatalogVersionAction = ActionsAdds | ActionsDels;
//---

type TypeAddMap = { [k in ModelCatalogTypes]: ModelCatalogAdds};
type TypeDelMap = { [k in ModelCatalogTypes]: ModelCatalogDels};

export const adds : TypeAddMap = { 
    'softwareversion': "VERSIONS_ADD",
    'model': "MODEL_ADD",
}

export const dels : TypeDelMap = {
    'softwareversion': "VERSION_DELETE",
    'model': "MODEL_DELETE"
}

export class ModelCatalogReduxApi<T extends IdObject, API extends BaseAPI> {
    private _api : API;
    private _username : string;
    private _lname : ModelCatalogTypes;
    private _actionAdd : ModelCatalogAdds;

    public constructor (ApiType: new () => API, lname: ModelCatalogTypes, username: string) {
        this._api = new ApiType();
        this._username = username;
        this._lname = lname;
        this._actionAdd = adds[lname];
    }

    public get : ActionThunk<Promise<T>, ActionsAdds> = (uri:string) => (dispatch) => {
        let id : string = this._getIdFromUri(uri);
        let req : Promise<T> = this._api[this._lname + 'sIdGet']({username: this._username, id: id});
        req.then((resp:T) => {
            console.log('wtf', resp);

            dispatch({
                type: this._actionAdd,
                payload: this._idReducer({}, resp)
            });
        });
        return req;
    }

    private _getIdFromUri (uri:string) : string {
        return uri.split('/').pop();
    }

    private _idReducer (dic:IdMap<T>, elem:T) : IdMap<T> {
        dic[elem.id] = elem;
        return dic;
    }

}
