import { Configuration, ConfigurationParameters } from '@mintproject/modelcatalog_client';
import { UserCatalog } from './user-catalog';
import { MINT_PREFERENCES  } from 'config';

export class ModelCatalogApi {
    private static _accessToken : string;
    public static username : string;
    public static defaultConfiguration : Configuration;
    public static authenticated : boolean = false;

    public static setUsername (username:string) : void {
        ModelCatalogApi.username = username;
    }

    public static setAccessToken (token:string) {
        ModelCatalogApi.authenticated = true;
        ModelCatalogApi.saveAccessToken(token);
    }

    private static saveAccessToken (token:string) {
        localStorage.setItem('accessToken', token);
        ModelCatalogApi._accessToken = token;
    }

    public static getApiConfiguration () : Configuration {
        if (ModelCatalogApi.defaultConfiguration) return ModelCatalogApi.defaultConfiguration;
        let cfg : ConfigurationParameters = {};
        if (this.authenticated) {
            let token : string = ModelCatalogApi.getAccessToken();
            if (token) cfg.accessToken = token;
        }
        if (MINT_PREFERENCES.model_catalog_api) cfg.basePath = MINT_PREFERENCES.model_catalog_api;

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
