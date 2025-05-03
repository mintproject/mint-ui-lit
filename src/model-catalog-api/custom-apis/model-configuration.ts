import { IdMap } from "app/reducers";
import {
  MCActionAdd,
  ActionThunk,
} from "../actions";
import { Configuration, BaseAPI, TapisApp } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "../default-redux-api";
import {
  ModelConfiguration,
  ModelConfigurationApi,
  SoftwareVersion,
} from "@mintproject/modelcatalog_client";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";
import { ModelCatalogTypes } from "@mintproject/modelcatalog_client";

export class CustomModelConfigurationApi extends DefaultReduxApi<
  ModelConfiguration,
  ModelConfigurationApi
> {
  public constructor(
    ApiType: new (cfg?: Configuration) => ModelConfigurationApi,
    user: string,
    config?: Configuration
  ) {
    super(ModelConfigurationApi, user, config);
  }

  private simplePost: ActionThunk<Promise<ModelConfiguration>, MCActionAdd> =
    this.post;

  public post: ActionThunk<Promise<ModelConfiguration>, MCActionAdd> =
    (resource: ModelConfiguration, versionid: string) => (dispatch) => {
      return new Promise((resolve, reject) => {
        if (!versionid)
          throw "Error creating configuration. Invalid parent version ID.";
        let configPost: Promise<ModelConfiguration> = dispatch(
          this.simplePost(resource)
        );
        configPost.catch(reject);
        configPost.then((newConfig: ModelConfiguration) => {
          let parentSoftwareVersionGet: Promise<SoftwareVersion> = dispatch(
            ModelCatalogApi.myCatalog.softwareVersion.get(versionid)
          );
          parentSoftwareVersionGet.catch(reject);
          parentSoftwareVersionGet.then((version: SoftwareVersion) => {
            if (version.hasConfiguration) {
              version.hasConfiguration.push(newConfig);
            } else {
              version.hasConfiguration = [newConfig];
            }
            let parentSoftwareVersionPut: Promise<SoftwareVersion> = dispatch(
              ModelCatalogApi.myCatalog.softwareVersion.put(version)
            );
            parentSoftwareVersionPut.catch(reject);
            parentSoftwareVersionPut.then((version: SoftwareVersion) => {
              console.log("version updated!", version);
              resolve(newConfig);
            });
          });
        });
      });
    };


  public postSyncWithTapisApp: ActionThunk<Promise<ModelConfiguration>, MCActionAdd> =
    (uri: string, tapisApp: TapisApp) => (dispatch) => {
      var id = this._getIdFromUri(uri);
      if (!tapisApp) return Promise.reject("Error syncing with Tapis app. Invalid Tapis app.");

      const reqParams = {
        id: id,
        tapisApp: tapisApp,
        username: this._username
      };

      return new Promise<ModelConfiguration>((resolve, reject) => {
        let req: Promise<ModelConfiguration> = this._api.modelconfigurationsIdTapisSyncPost(reqParams);
        req.catch(reject);
        req.then((resp: ModelConfiguration) => resolve(dispatch(this.get(resp.id))));
      });
    };
}
