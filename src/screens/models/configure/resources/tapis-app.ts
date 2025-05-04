import { ModelCatalogResource } from "./resource";
import { html, customElement } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";
import {
  TapisApp,
  TapisAppFromJSON,
  TapisAppApi,
} from "@mintproject/modelcatalog_client";

import { Textfield } from "weightless/textfield";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

interface TapisAppFileInput {
  name: string;
  description: string;
  inputMode: string;
  autoMountLocal: boolean;
  envKey: string | null;
  notes: Record<string, any>;
  sourceUrl: string | null;
  targetPath: string;
}

@customElement("model-catalog-tapis-app")
export class ModelCatalogTapisApp extends connect(store)(
  ModelCatalogResource
)<TapisApp> {
  protected classes: string = "resource tapis-app";
  protected name: string = "tapis app";
  protected pname: string = "tapis apps";

  protected resourceApi: DefaultReduxApi<TapisApp, BaseAPI> =
    ModelCatalogApi.myCatalog.tapisApp;

  constructor() {
    super();
    this.disableEdition();
    this.disableCreation();
    this.disableDeletion();
  }


  public _fromUri(uri: string): TapisApp {
    // Extract the tenant, id, and version from the URI using regex
    // Expected format: https://{tenant}.tapis.io/v3/apps/{id}/{version}
    const pattern = /^https:\/\/([^.]+)\.tapis\.io\/v3\/apps\/([^/]+)\/([^/]+)$/;
    const match = uri.match(pattern);

    if (!match) {
      return {
        id: undefined,
        version: undefined,
        tenant: undefined,
      };
    }

    const [, tenant, id, version] = match;
    return {
      id,
      version,
      tenant,
    };
  }



  public async loadFullTapisApp(app: TapisApp): Promise<TapisApp> {
    if (!app.id || !app.version || !app.tenant) {
      return app;
    }
    try {
      const fullApp = await store.dispatch(
        this.resourceApi.getTapisApp(app.id, app.version, app.tenant)
      );
      return fullApp;
    } catch (error) {
      console.error('Failed to load full TapisApp details:', error);
      return app;
    }
  }

  public setResources(resources: TapisApp[] | null): void {
    if (resources && resources.length > 0) {
      super.setResources([resources[0]]);
    } else {
      super.setResources(resources);
    }
  }

  public _toUri(r: TapisApp): string {
    return `https://${r.tenant}.tapis.io/v3/apps/${r.id}/${r.version}`;
  }

  protected _renderResource(r: TapisApp) {
    let url = this._toUri(r);
    return html`
      <div style="display: grid; grid-template-columns: auto 36px 36px;">
        <a target="_blank" href="${url}" style="vertical-align: middle; line-height: 40px; font-size: 16px;">
          ${r.tenant}/${r.id}:${r.version}
        </a>
      </div>
    `;
  }

  protected _renderForm() {
    return null;
  }

  protected _getResourceFromForm() {
    return null;
  }


}
