import { customElement, html, css, property, TemplateResult, LitElement } from "lit-element";
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

import * as mintConfig from 'config/config.json';
import { MintPreferences } from "app/reducers";
import { GoogleMapCustom } from "./google-map-custom";
import "./google-map-custom";
let prefs = mintConfig["default"] as MintPreferences;
const GOOGLE_API_KEY = prefs.google_maps_key;

@customElement('dataset-resource-selector')
export class DatasetResourceSelector extends connect(store)(LitElement) {
    @property({type: Boolean}) protected editMode: boolean = false;
    @property({type: Boolean}) protected mapReady: boolean = false;
    @property({type: String}) public dialogSize : "auto" | "fullscreen" | "large" | "medium" | "small" = "medium";
    @property({type: Object}) protected selectedDataset : Dataset;
    @property({type: Object}) protected selectedRegion : LocalRegion;
    @property({type: Array}) protected resources : DataResource[];

    static get styles() {
        return [SharedStyles, css`
        wl-progress-spinner.small {
            width: 21px;
            height: 21px;
        }
        .map {
            position: initial
        }`];
    }

    constructor (dataset:Dataset, resources:DataResource[], region:LocalRegion) {
        super();
        this.selectedDataset = dataset;
        this.resources = resources;
        this.selectedRegion = region;
    }

    public render () : TemplateResult {
        return html`
        <wl-icon style="cursor:pointer;" @click=${this.open}>travel_explore</wl-icon>
        <wl-dialog id="resourceMapDialog" fixed backdrop blockscrolling size=${this.dialogSize}>
            <h3 slot="header">
                Selecting resources ${this.selectedDataset ? "for " + this.selectedDataset.name : ""}
            </h3>
            <google-map-custom slot="content" class="map" api-key="${GOOGLE_API_KEY}" id="map"
                style="height: 400px"
                ?disable-default-ui="${true}" draggable="true"
                @click="${this.handleMapClick}"
                mapTypeId="terrain" .styles=${mapStyles}>
            </google-map-custom>
            <div slot="footer" style="padding-top:0px;">
                <wl-button flat inverted style="margin-right:5px;" @click=${this.onCancelClicked}>Cancel</wl-button>
                ${this.editMode ? html`
                <wl-button class="submit" @click=${this.onSaveClicked}>Save</wl-button>
                ` : html`
                <wl-button class="submit" @click=${this.onEditClicked}>Edit</wl-button>
                `}
            </div>
        </wl-dialog>`;
    }

    public updateMap () : void {
        let map = this.shadowRoot.querySelector<GoogleMapCustom>("#map");
        let covers = this.resources.map((res:DataResource) => res.spatial_coverage);
        if (covers.length > 0 && !!map) {
            map.clear();
            map.addRegionBorder(this.selectedRegion);
            map.alignMapToRegions([this.selectedRegion])

            covers.forEach((cover) => {
                let covertype : string = cover.type.toLowerCase();
                if (covertype === "point") {
                    map.addPoint({
                        x: parseFloat(cover.value.x),
                        y: parseFloat(cover.value.y)
                    } as Point);
                } else if (covertype === "boundingbox") {
                    map.addBoundingBox({
                        xmin: parseFloat(cover.value.xmin),
                        xmax: parseFloat(cover.value.xmax),
                        ymin: parseFloat(cover.value.ymin),
                        ymax: parseFloat(cover.value.ymax)
                    } as BoundingBox);
                } else if (covertype === "polygon") {
                    map.addPolygon(cover.coordinates[0]);
                }
            });
            this.mapReady = true;
        }
    }

    private handleMapClick (ev: any) : void {
        if (ev.detail && ev.detail.id)
            console.log("-->", ev.detail.id);
    }

    protected onEditEnable () : void {
        this.editMode = true;
    }

    protected onEditClicked () : void  {
        this.onEditEnable();
    }

    protected onCancelClicked () : void {
        this.editMode = false;
        hideDialog("resourceMapDialog", this.shadowRoot);
    }

    protected onSaveClicked () : void {
    }

    public open () : void {
        showDialog("resourceMapDialog", this.shadowRoot);
        this.updateMap();
    }
}