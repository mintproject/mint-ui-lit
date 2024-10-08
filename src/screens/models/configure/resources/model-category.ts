import { ModelCatalogResource } from "./resource";
import { ModelCategory } from "@mintproject/modelcatalog_client";
import { customElement, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

@customElement("model-catalog-category")
export class ModelCatalogCategory extends connect(store)(
  ModelCatalogResource
)<ModelCategory> {
  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      this.getBasicStyles(),
      css`
        .two-inputs > wl-textfield,
        .two-inputs > wl-select {
          display: inline-block;
          width: 50%;
        }
      `,
    ];
  }

  protected classes: string = "resource category";
  protected name: string = "category";
  protected pname: string = "categories";

  protected resourceApi: DefaultReduxApi<ModelCategory, BaseAPI> =
    ModelCatalogApi.myCatalog.modelCategory;
}
