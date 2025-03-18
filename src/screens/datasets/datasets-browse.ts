import { html, customElement, property, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { RootState, store } from "../../app/store";
import {
  DatasetDetail,
  DatasetQueryParameters,
  Dataset,
  DatasetsWithStatus,
  DatasetWithStatus,
} from "./reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "weightless/card";
import "weightless/title";

import "./datasets-search";
import "./dataset-detail";

import { MINT_PREFERENCES } from "config";
const data_catalog_api_url = MINT_PREFERENCES.data_catalog_api;
console.log("data_catalog_api_url", data_catalog_api_url);

@customElement("datasets-browse")
export class DatasetsBrowse extends connect(store)(PageViewElement) {
  @property({ type: String })
  private _dsid!: string;

  static get styles() {
    return [
      css`
        :host {
          overflow: hidden;
        }

        @media (min-width: 1025px) {
          .content {
            width: 75%;
          }
        }
        @media (max-width: 1024) {
          .content {
            width: 100%;
          }
        }
        .content {
          margin: 0 auto;
        }
        .datacatalog {
          width: 100%;
          height: 100%;
          /*margin-top: -70px;*/
          height: 100vh;
          border: 0;
        }
      `,
      SharedStyles,
    ];
  }

  protected render() {
    if (this._dsid)
      return html` <div class="content">
        <dataset-detail class="page" ?active="${this._dsid}"></dataset-detail>
      </div>`;
    else
      return html` <iframe
        class="datacatalog"
        src="${data_catalog_api_url}"
      ></iframe>`;
  }

  stateChanged(state: RootState) {
    // If there are details about a particular dataset
    if (state.dataExplorerUI) {
      this._dsid = state.dataExplorerUI.selected_datasetid;
    }
  }
}
