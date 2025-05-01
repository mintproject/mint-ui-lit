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
  private hasError: boolean = false;
  private errors: string[] = [];
  private _fileInputs: TapisAppFileInput[] = [];

  protected resourceApi: DefaultReduxApi<TapisApp, BaseAPI> =
    ModelCatalogApi.myCatalog.tapisApp;

  constructor() {
    super();
    this.disableEdition();
    this.disableCreation();
    this.disableDeletion();
  }

  public getFileInputs(): TapisAppFileInput[] {
    return this._fileInputs;
  }

  public setFileInputs(fileInputs: TapisAppFileInput[]): void {
    this._fileInputs = fileInputs;
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

      // Update file inputs if available in the full app
      if (fullApp && typeof fullApp === 'object' && 'fileInputs' in fullApp) {
        this.setFileInputs((fullApp as any).fileInputs);
      }

      return fullApp;
    } catch (error) {
      console.error('Failed to load full TapisApp details:', error);
      return app;
    }
  }

  public validateInputs(modelInputs: { parameters?: any[], datasets?: any[] }): boolean {
    if (!this._resources || this._resources.length === 0) {
      return true;
    }

    const tapisApp = this._resources[0];
    const fileInputs = this.getFileInputs();

    // Validate parameters
    if (modelInputs.parameters) {
      const requiredParams = fileInputs
        .filter(input => input.inputMode === 'PARAMETER')
        .map(input => input.name);

      const providedParams = modelInputs.parameters.map(param => param.label?.[0]);
      const missingParams = requiredParams.filter(param => !providedParams.includes(param));

      if (missingParams.length > 0) {
        this.hasError = true;
        this.errors.push(`Missing required parameters: ${missingParams.join(', ')}`);
        return false;
      }
    }

    // Validate datasets
    if (modelInputs.datasets) {
      const requiredDatasets = fileInputs
        .filter(input => input.inputMode === 'DATASET')
        .map(input => input.name);

      const providedDatasets = modelInputs.datasets.map(dataset => dataset.label?.[0]);
      const missingDatasets = requiredDatasets.filter(dataset => !providedDatasets.includes(dataset));

      if (missingDatasets.length > 0) {
        this.hasError = true;
        this.errors.push(`Missing required datasets: ${missingDatasets.join(', ')}`);
        return false;
      }
    }

    this.hasError = false;
    this.errors = [];
    return true;
  }

  public setResources(resources: TapisApp[] | null): void {
    if (resources && resources.length > 0) {
      const app = resources[0];
      this.loadFullTapisApp(app).then((fullApp) => {
        super.setResources([fullApp]);
      }).catch((error) => {
        console.error('Error loading full TapisApp:', error);
        super.setResources(resources);
      });
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
        <span
          tip="Tapis App: A containerized application that can be executed on Tapis systems.&#10;Format: tenant/app_id:version"
          id="tapis-app-tooltip"
          class="tooltip"
          style="top: 8px;"
        >
          <wl-icon style="--icon-size: 24px;">help_outline</wl-icon>
        </span>
        <span
          tip="${this.hasError ? 'Invalid: ' + this.errors.join(', ') : 'Valid: Component is properly configured'}"
          id="tapis-app-validation"
          class="tooltip"
          style="top: 8px;"
        >
          <wl-icon style="--icon-size: 24px; color: ${this.hasError ? 'red' : 'green'}">
            ${this.hasError ? 'error' : 'check_circle'}
          </wl-icon>
        </span>
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
