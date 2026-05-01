import { IdMap } from "app/reducers";
import {
  MCActionAdd,
  MODEL_CATALOG_ADD,
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
import { ModelCatalogTypes } from "../reducers";

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

  /** Override get to restore isOptional on hasInput items from the raw API response.
   *  The generated ModelConfigurationFromJSON strips isOptional because it is not in
   *  the v1.8.0 OpenAPI schema used to generate the client.  We fetch the raw JSON
   *  alongside the typed object and merge the flag back before dispatching to Redux.
   */
  public get: ActionThunk<Promise<ModelConfiguration>, MCActionAdd> =
    (uri: string) => (dispatch) => {
      const id: string = this._getIdFromUri(uri);
      const rawReq = this._api.modelconfigurationsIdGetRaw({
        username: this._username,
        id,
      });
      return rawReq.then(async (apiResponse) => {
        const [rawJson, typed] = await Promise.all([
          apiResponse.raw.clone().json() as Promise<any>,
          apiResponse.value(),
        ]);
        // Restore isOptional on hasInput items from the raw JSON
        if (typed.hasInput && rawJson.hasInput) {
          typed.hasInput = typed.hasInput.map((item: any, i: number) => ({
            ...item,
            isOptional: !!(rawJson.hasInput[i]?.isOptional),
          }));
        }
        if (this._redux) {
          dispatch({
            type: MODEL_CATALOG_ADD,
            kind: this.getName(),
            payload: this._idReducer({}, typed),
          });
        }
        return typed;
      });
    };

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
}
