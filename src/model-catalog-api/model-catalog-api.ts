import { Configuration, ConfigurationParameters, DefaultApi } from '@mintproject/modelcatalog_client';
import { store } from 'app/store';

import { DefaultReduxApi } from './default-redux-api';
import { UserCatalog } from './user-catalog';
import * as mintConfig from 'config/config.json';
import { MintPreferences } from 'app/reducers';

let prefs = mintConfig["default"] as MintPreferences;

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
        let cfg : ConfigurationParameters = {};
        if (token) cfg.accessToken = token;
        if (prefs.model_catalog_api) cfg.basePath = prefs.model_catalog_api;

        ModelCatalogApi.defaultConfiguration = new Configuration(cfg);
        return ModelCatalogApi.defaultConfiguration;
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

    //Catalogs:
    private static _userCatalog : UserCatalog;

    private static _getMyCatalog () : UserCatalog {
        if (!ModelCatalogApi._userCatalog) {
            ModelCatalogApi._userCatalog = new UserCatalog(
                ModelCatalogApi.username,
                ModelCatalogApi.getApiConfiguration());
        }
        return ModelCatalogApi._userCatalog;
    }

    public static getCatalog (username:string) : UserCatalog {
        return new UserCatalog(username);
    }

    public static get myCatalog () : UserCatalog {
        return ModelCatalogApi._getMyCatalog();
    }
}
