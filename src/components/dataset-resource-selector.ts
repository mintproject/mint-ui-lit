import {
  customElement,
  html,
  css,
  property,
  TemplateResult,
  LitElement,
} from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "app/store";
import { SharedStyles } from "styles/shared-styles";

import "weightless/title";
import "weightless/icon";
import "weightless/button";
import { Point } from "screens/regions/reducers";
import { DataResource, Dataset } from "screens/datasets/reducers";
import { hideDialog, showDialog } from "util/ui_functions";
import { mapStyles } from "styles/map-style";
import { BoundingBox, Region as LocalRegion } from "screens/regions/reducers";

import { GoogleMapCustom } from "./google-map-custom";
import "./google-map-custom";
import { MINT_PREFERENCES } from "config";
import { batchUpdateResourceSelection } from "screens/modeling/actions";

@customElement("dataset-resource-selector")
export class DatasetResourceSelector extends connect(store)(LitElement) {
  @property({ type: Boolean }) protected mapReady: boolean = false;
  @property({ type: Boolean }) protected isLoading: boolean = false;
  @property({ type: String }) public dialogSize:
    | "auto"
    | "fullscreen"
    | "large"
    | "medium"
    | "small" = "large";
  @property({ type: Object }) protected selectedDataset: Dataset;
  @property({ type: Object }) protected selectedRegion: LocalRegion;
  @property({ type: Array }) protected resources: DataResource[];
  @property({ type: String }) protected slice_id: string;
  static get styles() {
    return [
      SharedStyles,
      css`
        wl-progress-spinner.small {
          width: 21px;
          height: 21px;
        }
        .map {
          position: initial;
        }
      `,
    ];
  }

  constructor(
    sliceid: string,
    dataset: Dataset,
    resources: DataResource[],
    region: LocalRegion

  ) {
    super();
    this.selectedDataset = dataset;
    this.selectedRegion = region;
    this.slice_id = sliceid;
    this.resources = resources;
  }

  public renderMap(): TemplateResult {
    return html`<google-map-custom
      slot="content"
      class="map"
      api-key="${MINT_PREFERENCES.google_maps_key}"
      id="map"
      style="height: 400px"
          ?disable-default-ui="${true}"
          draggable="true"
          @click="${this.handleMapClick}"
          mapTypeId="terrain"
          .styles=${mapStyles}
        >
        </google-map-custom>
    `;
  }


  public renderTable(): TemplateResult {
    return html`
      <div style="margin-bottom: 10px;">
        <wl-button @click=${this.selectAll} ?disabled=${this.isLoading}>Select All</wl-button>
        <wl-button @click=${this.unselectAll} ?disabled=${this.isLoading}>Unselect All</wl-button>
      </div>
      <table class="resource-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          ${this.resources.length > 0 && this.resources.map(
            (resource) => html`
              <tr>
                <td>
                  <input
                    type="checkbox"
                    .checked=${resource.selected}
                    @change=${(e: Event) =>
                      this.toggleResourceSelection(e, resource)}
                    ?disabled=${this.isLoading}
                  />
                </td>
                <td>${resource.name}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  public render(): TemplateResult {
    return html` <wl-icon
        style="cursor:pointer; ${this.resources.length === 0
          ? "color:red;"
          : ""}"
        @click=${this.open}
        >travel_explore</wl-icon
      >
      <wl-dialog
        id="resourceMapDialog"
        fixed
        backdrop
        blockscrolling
        size=${this.dialogSize}
      >
        <h3 slot="header">
          Selecting resources
          ${this.selectedDataset ? "for " + this.selectedDataset.name : ""}
        </h3>
        <div slot="content">
          ${this.isLoading ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : this.renderTable()}
        </div>
        <div slot="footer" style="padding-top:0px;">
          <wl-button
            flat
            inverted
            style="margin-right:5px;"
            @click=${this.onCancelClicked}
            >Cancel</wl-button
          >
          <wl-button class="submit" ?disabled=${this.isLoading} @click=${this.onSaveClicked}>Save</wl-button>
        </div>
      </wl-dialog>`;
  }

  public updateMap(): void {
    let map = this.shadowRoot.querySelector<GoogleMapCustom>("#map");
    let covers = this.resources.map(
      (res: DataResource) => res.spatial_coverage
    );
    if (covers.length > 0 && !!map) {
      map.clear();
      map.addRegionBorder(this.selectedRegion);
      map.alignMapToRegions([this.selectedRegion]);

      covers.forEach((cover) => {
        let covertype: string = cover.type.toLowerCase();
        if (covertype === "point") {
          if (cover.value) {
            map.addPoint({
              x: parseFloat(cover.value.x),
              y: parseFloat(cover.value.y),
            } as Point);
          } else if (cover.coordinates) {
            console.log(cover.coordinates);
            map.addPoint({
              x: parseFloat(cover.coordinates[0]),
              y: parseFloat(cover.coordinates[1]),
            } as Point);
          }
        } else if (covertype === "boundingbox") {
          if (cover.value) {
            map.addBoundingBox({
              xmin: parseFloat(cover.value.xmin),
              xmax: parseFloat(cover.value.xmax),
              ymin: parseFloat(cover.value.ymin),
              ymax: parseFloat(cover.value.ymax),
            } as BoundingBox);
          } else if (cover.coordinates) {
            map.addBoundingBox({
              xmin: parseFloat(cover.coordinates[0]),
              xmax: parseFloat(cover.coordinates[2]),
              ymin: parseFloat(cover.coordinates[1]),
              ymax: parseFloat(cover.coordinates[3]),
            } as BoundingBox);
          }
        } else if (covertype === "polygon") {
          map.addPolygon(cover.coordinates[0]);
        }
      });
      this.mapReady = true;
    }
  }

  private handleMapClick(ev: any): void {
    if (ev.detail && ev.detail.id) console.log("-->", ev.detail.id);
  }


  protected onCancelClicked(): void {
    hideDialog("resourceMapDialog", this.shadowRoot);
  }

  protected async onSaveClicked(): Promise<void> {
    this.isLoading = true;
    await batchUpdateResourceSelection(this.resources.map(r => ({
      slice_id: this.slice_id,
      resource_id: r.id,
      selected: r.selected
    })));
    this.isLoading = false;
    hideDialog("resourceMapDialog", this.shadowRoot);
  }

  public open(): void {
    showDialog("resourceMapDialog", this.shadowRoot);
    this.updateMap();
  }

  private toggleResourceSelection(e: Event, resource: DataResource) {
    console.log("toggleResourceSelection", e, resource);
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      resource.selected = true;
    } else {
      resource.selected = false;
    }
  }

  private selectAll(): void {
    this.resources.forEach(resource => {
      resource.selected = true;
    });
    this.requestUpdate();
  }

  private unselectAll(): void {
    this.resources.forEach(resource => {
      resource.selected = false;
    });
    this.requestUpdate();
  }
}
