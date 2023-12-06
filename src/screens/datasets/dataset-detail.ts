import { html, customElement, property, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { RootState, store } from "../../app/store";
import { Dataset, DatasetWithStatus, DataResource } from "./reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "weightless/card";
import "weightless/title";
import "weightless/dialog";

import "components/google-map-custom";

import { ComparisonFeature } from "screens/modeling/reducers";
import { BoundingBox, Point, Region } from "screens/regions/reducers";
import { queryDatasetResources } from "./actions";
import { GoogleMapCustom } from "components/google-map-custom";
import { UserPreferences, MintPreferences } from "app/reducers";
import { showDialog, hideDialog } from "util/ui_functions";
import { MINT_PREFERENCES } from "config";

@customElement("dataset-detail")
export class DatasetDetail extends connect(store)(PageViewElement) {
  private _dsid: string;
  private _filterby_regionid: string;

  @property({ type: Object })
  private _filterby_region: Region;

  @property({ type: Object })
  private _dataset: DatasetWithStatus;

  @property({ type: Boolean })
  private _mapReady: boolean = false;

  @property({ type: Object })
  private prefs: UserPreferences;

  private _mapStyles =
    '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';

  private _datasetFeatures: Array<ComparisonFeature> = [
    {
      name: "Description",
      fn: (ds: Dataset) => ds.description,
    },
    {
      name: "Source",
      fn: (ds: Dataset) =>
        html`<a target="_blank" href="${ds.source.url}">${ds.source.name}</a>`,
    },
    {
      name: "Source Type",
      fn: (ds: Dataset) => ds.source.type,
    },
    {
      name: "Limitations",
      fn: (ds: Dataset) => ds.limitations,
    },
    {
      name: "Version",
      fn: (ds: Dataset) => ds.version,
    },
  ];

  static get styles() {
    return [
      css`
        wl-card {
          padding: 15px;
        }
        fieldset {
          border: 1px solid #ccc;
        }
        fieldset legend {
          color: #aaa;
          font-size: 12px;
        }
        .map {
          height: 400px;
          width: 100%;
        }
      `,
      SharedStyles,
    ];
  }

  protected render() {
    let _ds =
      this._dataset && !this._dataset.loading ? this._dataset.dataset : null;
    if (!_ds && this._dataset && !this._dataset.loading) {
      return html`<center>No resources found for this dataset</center>`;
    }
    return html`
      ${!_ds
        ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>`
        : html`
            ${this._renderJsonDialog(_ds)}
            <br />
            <wl-title level="4">${_ds.name}</wl-title>
            <div style="display:flex; justify-content:space-between">
              <wl-title level="5" style="color:#aaa">id:${_ds.id}</wl-title>
              <div style="text-align: right;">
                <span style="color: ${_ds.is_cached ? "green" : "lightsalmon"}">
                  ${_ds.is_cached
                    ? "Available on MINT servers"
                    : "Available for download"}
                </span>
                ${_ds.resource_repr || _ds.dataset_repr
                  ? html`
                      |
                      <span
                        style="cursor: pointer; color: 'green'"
                        @click="${() => {
                          showDialog("jsonDialog", this.shadowRoot);
                        }}"
                      >
                        MINT Understandable Format
                      </span>
                    `
                  : ""}
                ${_ds.is_cached
                  ? ""
                  : html`
                      <br />
                      <span style="cursor: not-allowed;">
                        <wl-button
                          flat
                          inverted
                          outlined
                          disabled
                          style="margin-top: 5px; --button-padding: 4px 8px;"
                        >
                          Download to MINT servers
                        </wl-button>
                      </span>
                    `}
              </div>
            </div>
            <br />
            <table class="pure-table pure-table-striped">
              <thead>
                <tr>
                  <th style="width:15%">Metadata</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${this._datasetFeatures.map((feature) => {
                  return html`
                    <tr>
                      <td style="width:15%"><b>${feature.name}</b></td>
                      <td>${feature.fn(_ds)}</td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
            <br />
            ${this._filterby_region
              ? html`<wl-title level="4"
                    >Region: ${this._filterby_region.name}</wl-title
                  ><br />`
              : ""}
          `}

      <google-map-custom
        class="map"
        api-key="${MINT_PREFERENCES.google_maps_key}"
        .style="visibility: ${this._mapReady ? "visible" : "hidden"}"
        disable-default-ui="true"
        draggable="true"
        styles="${this._mapStyles}"
        mapTypeId="terrain"
        id="dataset-map"
      >
      </google-map-custom>

      ${_ds
        ? html`
            <br />
            <br />
            <wl-title level="4">
              ${_ds.resources.length < _ds.resource_count
                ? html`Showing ${_ds.resources.length} of`
                : ""}
              ${_ds.resource_count} Resource(s)
            </wl-title>
            <div style="height:400px; overflow:auto">
              <div class="clt">
                <ul>
                  ${_ds.resources.map((res) => {
                    return html`
                      <li>
                        ${res.name}
                        <ul>
                          <li>Download: <a href="${res.url}">${res.url}</a></li>
                          ${res.time_period && res.time_period.start_date
                            ? html`
                                <li>
                                  Time:
                                  ${res.time_period.start_date.toLocaleDateString(
                                    "en-US"
                                  )}
                                  to
                                  ${res.time_period.end_date.toLocaleDateString(
                                    "en-US"
                                  )}
                                </li>
                              `
                            : ""}
                        </ul>
                      </li>
                    `;
                  })}
                </ul>
              </div>
            </div>
          `
        : ""}
    `;
  }

  _renderJsonDialog(ds) {
    return html` <wl-dialog
      class="larger"
      id="jsonDialog"
      fixed
      backdrop
      blockscrolling
    >
      <h3 slot="header">
        ${ds.resource_repr ? "resource_repr" : "dataset_repr"} details
      </h3>
      <div slot="content">
        <pre>
${JSON.stringify(ds.resource_repr || ds.dataset_repr, null, 2)}</pre
        >
      </div>
      <div slot="footer">
        <wl-button
          @click="${() => {
            hideDialog("jsonDialog", this.shadowRoot);
          }}"
          style="margin-right: 5px;"
          inverted
          flat
          >Close</wl-button
        >
      </div>
    </wl-dialog>`;
  }

  _showDatasetLocations() {
    let map = this.shadowRoot.querySelector(
      "google-map-custom"
    ) as GoogleMapCustom;
    if (map && this._dataset && this._dataset.dataset) {
      try {
        this._mapReady = this._setDatasetLocations(this._dataset.dataset);
      } catch {
        map.addEventListener("google-map-ready", (e) => {
          this._mapReady = this._setDatasetLocations(this._dataset.dataset);
        });
      }
    }
  }

  _setDatasetLocations(ds: Dataset) {
    let map = this.shadowRoot.querySelector(
      "google-map-custom"
    ) as GoogleMapCustom;
    let covers = ds.resources
      .map((res) => res.spatial_coverage)
      .filter((cover) => cover);
    if (covers.length > 0) {
      map.style.display = "";
      let covertype = covers[0].type;
      if (covertype.toLowerCase() == "point") {
        let covervalues = covers.map((cover) => {
          console.log(cover);
          if (cover.value) {
            return {
              x: parseFloat(cover.value.x),
              y: parseFloat(cover.value.y),
            } as Point;
          }
          else if(cover.coordinates) {
            return {
              x: parseFloat(cover.coordinates[0]),
              y: parseFloat(cover.coordinates[1]),
            } as Point;
          }
        });
        map.setPoints(covervalues as Point[]);
        return true;
      } else if (covertype.toLowerCase() == "boundingbox") {
        let covervalues = covers.map((cover) => {
          if (cover.value) {
            return {
              xmin: parseFloat(cover.value.xmin),
              xmax: parseFloat(cover.value.xmax),
              ymin: parseFloat(cover.value.ymin),
              ymax: parseFloat(cover.value.ymax),
            } as BoundingBox;
          }
          else if(cover.coordinates) {
            return {
              xmin: parseFloat(cover.coordinates[0]),
              xmax: parseFloat(cover.coordinates[2]),
              ymin: parseFloat(cover.coordinates[1]),
              ymax: parseFloat(cover.coordinates[3]),
            } as BoundingBox;
          }
        });
        map.setBoundingBoxes(covervalues as BoundingBox[]);
        return true;
      } else if (covertype.toLowerCase() == "polygon") {
        map.setPolygon(covers[0].coordinates[0]);
        return true;
      }
    } else {
      map.style.display = "none";
    }
    return false;
  }

  stateChanged(state: RootState) {
    super.setRegion(state);
    this.prefs = state.app.prefs!;

    if (
      state.dataExplorerUI &&
      this._regionid &&
      state.regions.sub_region_ids &&
      state.regions.sub_region_ids[this._regionid]
    ) {
      let newdsid = state.dataExplorerUI.selected_datasetid;
      let newregionid = state.dataExplorerUI.selected_regionid;
      if (newdsid != this._dsid || newregionid != this._filterby_regionid) {
        this._dsid = newdsid;
        this._filterby_regionid = newregionid;
        this._dataset = null;
        this._mapReady = false;
        if (this._dsid) {
          this._filterby_region = newregionid
            ? state.regions.regions[newregionid]
            : null;
          store.dispatch(
            queryDatasetResources(
              this._dsid,
              this._filterby_region,
              this.prefs.mint
            )
          );
        }
      }
    }
    if (state.datasets && this._dataset != state.datasets.dataset) {
      this._dataset = state.datasets.dataset;
      if (this._dataset && !this._dataset.loading) this._showDatasetLocations();
    }
  }
}
