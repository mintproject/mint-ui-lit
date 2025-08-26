import { html, customElement, css, property } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import datasets from "./reducers";
import dataExplorerUI from "./ui-reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "./datasets-browse";
//import './datasets-register';
import "./datasets-quality-workflows";
import "./datasets-rs-workflows";
import "./data-transformation-list";
import "../../components/nav-title";

store.addReducers({
  datasets,
  dataExplorerUI,
});

@customElement("datasets-home")
export class DatasetsHome extends connect(store)(PageViewElement) {
  @property({ type: String })
  private _dsid!: string;

  static get styles() {
    return [
      css`
        datasets-browse {
          height: calc(100% - 40px);
        }
        .scrollable {
          overflow: scroll;
        }
      `,
      SharedStyles,
    ];
  }

  protected render() {
    return html`
      <nav-title .ignore="${[]}"></nav-title>

      <div class="${this._subpage != "home" ? "hiddensection" : "icongrid"}">
        <a href="${this._regionid}/datasets/browse">
          <wl-icon>search</wl-icon>
          <div>Browse Datasets</div>
        </a>
        <!--a href="this._regionid/datasets/register"-->
        <!--a disabled>
                    <wl-icon>library_add</wl-icon>
                    <div>Add Datasets</div>
                </a-->
        <a class="tight" href="${this._regionid}/datasets/data-transformations">
          <wl-icon>addchart</wl-icon>
          <div>Data Transformations</div>
        </a>
        <a href="${this._regionid}/datasets/quality-workflows">
          <wl-icon>high_quality</wl-icon>
          <div>Improve Quality</div>
        </a>
        <a href="${this._regionid}/datasets/rs-workflows">
          <wl-icon>satellite</wl-icon>
          <div>Remote Sensing</div>
        </a>
      </div>

      <datasets-browse
        class="page ${this._dsid ? "scrollable" : ""}"
        ?active="${this._subpage == "browse"}"
      ></datasets-browse>
      <data-transformation-list
        class="page"
        ?active="${this._subpage == "data-transformations"}"
      ></data-transformation-list>
      <!--datasets-register class="page" ?active="{this._subpage == 'register'}"></datasets-register-->
      <datasets-quality-workflows
        class="page"
        ?active="${this._subpage == "quality-workflows"}"
      ></datasets-quality-workflows>
      <datasets-rs-workflows
        class="page"
        ?active="${this._subpage == "rs-workflows"}"
      ></datasets-rs-workflows>
    `;
  }

  stateChanged(state: RootState) {
    super.setSubPage(state);
    super.setRegionId(state);
    if (state.dataExplorerUI) {
      this._dsid = state.dataExplorerUI.selected_datasetid;
    }
  }
}
