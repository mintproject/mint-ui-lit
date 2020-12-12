import { Configuration, DefaultApi } from '@mintproject/modelcatalog_client';
import { store } from 'app/store';

import { DefaultReduxApi } from './default-redux-api';
import { Model, ModelApi,
         SoftwareVersion, SoftwareVersionApi } from '@mintproject/modelcatalog_client';

//export const FETCH_MODEL_CATALOG_ACCESS_TOKEN = 'FETCH_MODEL_CATALOG_ACCESS_TOKEN';
//export const STATUS_MODEL_CATALOG_ACCESS_TOKEN = 'STATUS_MODEL_CATALOG_ACCESS_TOKEN';

export class ModelCatalogApi {
    private static _accessToken : string;
    public static username : string;
    public static defaultConfiguration : Configuration;

    public static setUsername (username:string) : void {
        ModelCatalogApi.username = username;
    }

    public static getApiConfiguration () : Configuration {
        if (ModelCatalogApi.defaultConfiguration) return ModelCatalogApi.defaultConfiguration;
        let token : string = ModelCatalogApi.getAccessToken();
        if (token) {
            ModelCatalogApi.defaultConfiguration = new Configuration({accessToken: token});
            return ModelCatalogApi.defaultConfiguration;
        }
        return new Configuration();
    }

    public static login (username: string, password:string, dispatch:boolean = true) : Promise<string> {
        let API : DefaultApi = new DefaultApi();
        //if (dispatch) store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'LOADING'})
        let req : Promise<string> = API.userLoginPost({user: {username: username, password: password}});
        req.then((data:string) => {
            let accessToken : string = JSON.parse(data)['access_token'];
            if (accessToken) {
                console.log('Access token was retrieved and stored.');
                localStorage.setItem('accessToken', accessToken);
                ModelCatalogApi._accessToken = accessToken;
                ModelCatalogApi.username = username;
                //if (dispatch) store.dispatch({type: FETCH_MODEL_CATALOG_ACCESS_TOKEN, accessToken: accessToken});
            } else {
                //if (dispatch) store.dispatch({type: STATUS_MODEL_CATALOG_ACCESS_TOKEN, status: 'ERROR'})
                console.error('Error fetching the model catalog token!');
            }
        });
        return req;
    }

    private static getAccessToken () : string {
        if (ModelCatalogApi._accessToken) return ModelCatalogApi._accessToken;
        let localToken : string = this.getLocalAccessToken();
        if (localToken) {
            console.log('Access token was read from local storage.');
            ModelCatalogApi._accessToken = localToken;
            return localToken;
        }
        throw new Error('Could not get access token');
    }

    private static getLocalAccessToken () : string {
        let accessToken = localStorage.getItem('accessToken');
        if (accessToken) return accessToken;
                
        console.info('No access token on local storage');
        //maybe should log out here.
        return '';
    }

    public static clearLocalAccessToken () : void {
        localStorage.removeItem('accessToken');
    }


    //--- APIS:
    private static _modelApi : DefaultReduxApi<Model, ModelApi>;
    public static get model () : DefaultReduxApi<Model, ModelApi> {
        if (!ModelCatalogApi._modelApi) {
            ModelCatalogApi._modelApi = new DefaultReduxApi<Model, ModelApi>(
                ModelApi,
                ModelCatalogApi.username,
                ModelCatalogApi.getApiConfiguration()
            );
            console.log("ModelApi created!");
        }
        return ModelCatalogApi._modelApi;
    }

    public static externalModel (username:string, cfg?:Configuration) {
        if (!username || username === ModelCatalogApi.username) {
            return ModelCatalogApi.model;
        } else {
            return new DefaultReduxApi<Model, ModelApi>(
                ModelApi,
                username,
                cfg ? cfg : null
            );
        }
    }
}
