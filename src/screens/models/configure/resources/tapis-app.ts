import { ModelCatalogResource } from "./resource";
import { html, customElement } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";
import {
  TapisApp,
  TapisAppFromJSON,
} from "@mintproject/modelcatalog_client";

import { Textfield } from "weightless/textfield";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

@customElement("model-catalog-tapis-app")
export class ModelCatalogTapisApp extends connect(store)(
  ModelCatalogResource
)<TapisApp> {
  protected classes: string = "resource tapis-app";
  protected name: string = "tapis app";
  protected pname: string = "tapis apps";

  protected resourceApi: DefaultReduxApi<TapisApp, BaseAPI> =
    ModelCatalogApi.myCatalog.tapisApp;

  public _fromUri(uri: string): TapisApp {
    // Extract the tenant, id, and version from the URI using regex
    // Expected format: https://{tenant}.tapis.io/v3/apps/{id}/{version}
    const pattern = /^https:\/\/([^.]+)\.tapis\.io\/v3\/apps\/([^/]+)\/([^/]+)$/;
    const match = uri.match(pattern);

    if (!match) {
      throw new Error(`Invalid Tapis app URI format: ${uri}`);
    }

    const [, tenant, id, version] = match;
    return {
      id,
      version,
      tenant,
    };
  }

  public _toUri(r: TapisApp): string {
    return `https://${r.tenant}.tapis.io/v3/apps/${r.id}/${r.version}`;
  }

  protected _renderResource(r: TapisApp) {
    let url = this._toUri(r);
    return html`<a target="_blank" href="${url}">${r.id}:${r.version}</a>`;
  }

  protected _renderForm() {
    return null
  }

  protected _getResourceFromForm() {
    return null
  }

  public validateInputs(modelInputs: { parameters?: any[], datasets?: any[] }): boolean {
    // TODO: Implement actual validation by fetching TapisApp inputs from the API
    // For now, we'll return true to not block the flow
    return true;
  }
}
