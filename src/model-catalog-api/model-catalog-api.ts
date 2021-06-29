import { Configuration, ConfigurationParameters, DefaultApi } from '@mintproject/modelcatalog_client';
import { UserCatalog } from './user-catalog';
import * as mintConfig from 'config/config.json';
import { MintPreferences } from 'app/reducers';

let prefs = mintConfig["default"] as MintPreferences;

export class ModelCatalogApi {
    private static _accessToken : string;
    public static username : string;
    public static defaultConfiguration : Configuration;

    public static setUsername (username:string) : void {
        ModelCatalogApi.username = username;
    }

    public static setAccessToken (token:string) {
        ModelCatalogApi.saveAccessToken(token);
    }

    private static saveAccessToken (token:string) {
        localStorage.setItem('accessToken', token);
        ModelCatalogApi._accessToken = token;
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
        let accessToken = localStorage.getItem('access-token');
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
