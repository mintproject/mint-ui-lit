import { customElement, property, html, css } from "lit-element";

import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";

import "components/google-map-custom";
import "weightless/progress-spinner";
import { RegionQueryPage } from "./region-query-page";
import { DatasetsWithStatus, Dataset } from "screens/datasets/reducers";
import { queryDatasetsByRegion } from "screens/datasets/actions";
import { SharedStyles } from "styles/shared-styles";
import { UserPreferences } from "app/reducers";
import { goToPage } from "app/actions";
import { BoundingBox } from "./reducers";

const boundingBoxToQueryString = (bb: BoundingBox) => {
  let xmin = bb.xmin > 0 ? bb.xmin : "-" + bb.xmin;
  let ymin = bb.ymin > 0 ? bb.ymin : "-" + bb.ymin;
  let xmax = bb.xmax > 0 ? bb.xmax : "-" + bb.xmax;
  let ymax = bb.ymax > 0 ? bb.ymax : "-" + bb.ymax;
  return xmin + ", " + ymin + ", " + xmax + ", " + ymax;
};

@customElement("region-datasets")
export class RegionDatasets extends connect(store)(RegionQueryPage) {
  @property({ type: Object })
  private _datasets: DatasetsWithStatus;

  @property({ type: Object })
  private prefs: UserPreferences;

  static get styles() {
    return [
      SharedStyles,
      css`
        :host {
          margin-bottom: 10px;
        }
      `,
    ];
  }

  _transform(ds: Dataset) {
    let url: URL = new URL(
      `https://data-trans.mint.isi.edu/pipeline/create?dcatId=${ds.id}`
    );
    /*url.searchParams.append('slct_adp', '10 topoflow4_climate_write_func%2FDcatReadTopoflow4ClimateUploadFunc');
        //url.searchParams.append('add_adp', '');
        //url.searchParams.append('update_pipe', '');
        url.searchParams.append('clear_add_pipe', '');
        // dataset + region
        url.searchParams.append('0.inputs.dataset_id', ds.id);
        url.searchParams.append('0.inputs.DEM_bounds', boundingBoxToQueryString(this._selectedRegion.bounding_box));
        // resolution TODO
        url.searchParams.append('0.inputs.DEM_xres_arcsecs', '267');
        url.searchParams.append('0.inputs.DEM_yres_arcsecs', '257');
        url.searchParams.append('0.inputs.var_name', 'HQprecipitation');
        //url.searchParams.append('0.inputs.DEM_ncols', '30');
        //url.searchParams.append('0.inputs.DEM_nrows', '30');*/
    return String(url);
  }

  _isGPM(ds: Dataset) {
    return ds.id === "adfca6fb-ad82-4be3-87d8-8f60f9193e43";
  }

  protected render() {
    let data_link_suffix = "";
    if (this._selectedRegion) {
      data_link_suffix = "/" + this._selectedRegion.id;
    }
    return html`
      ${this._selectedRegion
        ? html` <wl-title level="4" style="font-size: 17px;"
              >Datasets with resources in ${this._selectedRegion.name}</wl-title
            >
            ${!this._datasets || this._datasets.loading
              ? html`<div style="width:100%; text-align: center;">
                  <wl-progress-spinner></wl-progress-spinner>
                </div>`
              : !this._datasets.datasets || this._datasets.datasets.length === 0
              ? "No datasets for this region"
              : this._datasets.datasets.map(
                  (ds) => html`
                    <wl-list-item
                      class="active"
                      @click="${() =>
                        goToPage(
                          "datasets/browse/" + ds.id + data_link_suffix
                        )}"
                    >
                      <wl-icon slot="before">folder</wl-icon>
                      ${this._isGPM(ds)
                        ? html`
                            <a
                              slot="after"
                              target="_blank"
                              href="${this._transform(ds)}"
                            >
                              <wl-button
                                @click="${(ev: any) => ev.stopPropagation()}"
                                >Transform</wl-button
                              >
                            </a>
                          `
                        : ""}
                      <wl-title level="4" style="margin: 0"
                        >${ds.name}</wl-title
                      >
                      <div>
                        ${ds.is_cached
                          ? html`<span style="color: green"
                              >Available on MINT servers</span
                            >`
                          : html`<span style="color: lightsalmon"
                              >Available for download</span
                            >`}
                        ${ds.resource_repr || ds.dataset_repr
                          ? html` |
                              <span style="color: 'green'">
                                MINT Understandable Format
                              </span>`
                          : ""}
                        <span style="color: gray">-</span> ${ds.resource_count}
                        files
                      </div>
                    </wl-list-item>
                  `
                )}`
        : ""}
    `;
  }

  stateChanged(state: RootState) {
    let curregion = this._selectedRegion;
    super.setSelectedRegion(state);

    this.prefs = state.app.prefs;

    if (this._selectedRegion) {
      if (curregion != this._selectedRegion) {
        // New region. Requery
        store.dispatch(
          queryDatasetsByRegion(this._selectedRegion, this.prefs.mint)
        );
      }

      if (state.datasets && state.datasets.region_datasets) {
        this._datasets = state.datasets.region_datasets;
      }
    }
  }
}
