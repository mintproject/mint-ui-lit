import { IdMap } from "app/reducers";
import {
  MCActionAdd,
  MCActionDelete,
  MODEL_CATALOG_ADD,
  MODEL_CATALOG_DELETE,
  ActionThunk,
} from "../actions";
import { ModelCatalogTypes } from "../reducers";
import { Configuration, BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "../default-redux-api";
import {
  SoftwareVersion,
  SoftwareVersionApi,
  Model,
} from "@mintproject/modelcatalog_client";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

export class CustomSoftwareVersionApi extends DefaultReduxApi<
  SoftwareVersion,
  SoftwareVersionApi
> {
  public constructor(
    ApiType: new (cfg?: Configuration) => SoftwareVersionApi,
    user: string,
    config?: Configuration
  ) {
    super(SoftwareVersionApi, user, config);
  }

  private simplePost: ActionThunk<Promise<SoftwareVersion>, MCActionAdd> =
    this.post;

  public post: ActionThunk<Promise<SoftwareVersion>, MCActionAdd> =
    (resource: SoftwareVersion, modelid: string) => (dispatch) => {
      return new Promise((resolve, reject) => {
        if (!modelid) throw "Error creating version. Invalid parent model ID.";
        let softwareVersionPost: Promise<SoftwareVersion> = dispatch(
          this.simplePost(resource)
        );
        softwareVersionPost.catch(reject);
        softwareVersionPost.then((newVersion: SoftwareVersion) => {
          let parentModelGet: Promise<Model> = dispatch(
            ModelCatalogApi.myCatalog.model.get(modelid)
          );
          parentModelGet.catch(reject);
          parentModelGet.then((model: Model) => {
            if (model.hasVersion) {
              model.hasVersion.push(newVersion);
            } else {
              model.hasVersion = [newVersion];
            }
            let parentModelPut: Promise<Model> = dispatch(
              ModelCatalogApi.myCatalog.model.put(model)
            );
            parentModelPut.catch(reject);
            parentModelPut.then((model: Model) => {
              console.log("model updated!", model);
              resolve(newVersion);
            });
          });
        });
      });
    };
}
