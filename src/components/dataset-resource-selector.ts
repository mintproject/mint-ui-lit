import { customElement, html, css, property, TemplateResult, LitElement } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "app/store";
import { SharedStyles } from "styles/shared-styles";

import "weightless/title";
import "weightless/icon";
import "weightless/button";
import { Point, RegionMap } from "screens/regions/reducers";
import { DataResource, Dataset } from "screens/datasets/reducers";
import { hideDialog, showDialog } from "util/ui_functions";
import { mapStyles } from "styles/map-style";
import { BoundingBox, Region as LocalRegion, RegionCategory} from "screens/regions/reducers";

import * as mintConfig from 'config/config.json';
import { MintPreferences } from "app/reducers";
import { GoogleMapCustom } from "./google-map-custom";
import "./google-map-custom";
import { DataCatalogAdapter } from "util/data-catalog-adapter";
import { DateRange } from "screens/modeling/reducers";
import { Dialog } from "weightless";
let prefs = mintConfig["default"] as MintPreferences;
const GOOGLE_API_KEY = prefs.google_maps_key;

type StatusType = "warning" | "done" | "error";

@customElement('dataset-resource-selector')
export class DatasetResourceSelector extends connect(store)(LitElement) {
    @property({type: Boolean}) protected editMode: boolean = false;
    @property({type: Boolean}) protected loading: boolean = true;
    @property({type: Boolean}) protected mapReady: boolean = false;
    @property({type: String}) public dialogSize : "auto" | "fullscreen" | "large" | "medium" | "small" = "medium";
    @property({type: Object}) protected selectedDataset : Dataset;
    @property({type: Object}) protected selectedRegion : LocalRegion;
    @property({type: Object}) protected selectedDateRange : DateRange;
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

    constructor (dataset:Dataset) {
        super();
        this.selectedDataset = dataset;
        this.stateChanged(store.getState() as RootState);
    }

    public render () : TemplateResult {
        return html`
        ${this.loading ? 
            html`<wl-progress-spinner class="small"></wl-progress-spinner>` : 
            html`<wl-icon style="cursor:pointer;" @click=${this.open}>travel_explore</wl-icon>`
        }
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

    public addRegionsToMap() {
        let map = this.shadowRoot.querySelector<GoogleMapCustom>("#map");
        let visibleRegions : LocalRegion[] = [this.selectedRegion];

        if (map && visibleRegions) {
            try {
                //map.setRegions(visibleRegions, this.selectedRegion.id);
                map.addRegion(this.selectedRegion);
                this.mapReady = this.setDatasetLocations();
            } catch {
                map.addEventListener("google-map-ready", (e) => {
                    //map.setRegions(visibleRegions, this.selectedRegion.id);
                    map.addRegion(this.selectedRegion);
                    this.mapReady = this.setDatasetLocations();
                })
            }
        }
    }

    private setDatasetLocations() : boolean {
        let map = this.shadowRoot.querySelector<GoogleMapCustom>("#map");
        let covers = this.resources.map((res:DataResource) => res.spatial_coverage);
        console.log(this.resources, covers);
        if(covers.length > 0) {
            let covertype = covers[0].type;
            if(covertype.toLowerCase() == "point") {
                let covervalues = covers.map((cover) => {
                    return {
                        x: parseFloat(cover.value.x),
                        y: parseFloat(cover.value.y)
                    } as Point;
                });
                map.setPoints(covervalues as Point[]);
                return true;
            }
            else if(covertype.toLowerCase() == "boundingbox") {
                let covervalues = covers.map((cover) => {
                    return {
                        xmin: parseFloat(cover.value.xmin),
                        xmax: parseFloat(cover.value.xmax),
                        ymin: parseFloat(cover.value.ymin),
                        ymax: parseFloat(cover.value.ymax)
                    } as BoundingBox;
                });
                map.setBoundingBoxes(covervalues as BoundingBox[]);
                return true;
            } else if (covertype.toLowerCase() == "polygon") {
                map.setPolygon(covers[0].coordinates[0]);
                return true;
            }
        }
        return false;
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
        // Example
        this.loading = true;
        setTimeout(() => {this.loading = false; this.editMode = false;}, 1000);
    }

    public open () : void {
        showDialog("resourceMapDialog", this.shadowRoot);
        this.addRegionsToMap();
    }

    protected onOpen () : void {}
    protected onClose () : void {}

    private getAllResources () : void {
        this.loading = true;
        console.log(this.selectedDataset, this.selectedRegion);
        let req : Promise<DataResource[]> = DataCatalogAdapter.getDatasetResources(this.selectedDataset.id, this.selectedRegion, this.selectedDateRange);
        req.catch((e) => {
            console.warn(e);
            this.loading = false;
        });
        req.then((resources:DataResource[]) => {
            this.resources = resources; //FIXME: filter by main region!
            this.loading = false;
            this.addRegionsToMap();
        });
    }

    stateChanged(state: RootState) {
        if (state.modeling.thread) {
            if (state.modeling.thread.dates)
                this.selectedDateRange = state.modeling.thread.dates;
            if (state.modeling.thread.regionid && state.regions.regions &&
                    this.selectedRegion != state.regions.regions[state.modeling.thread.regionid]) {
                this.selectedRegion = state.regions.regions[state.modeling.thread.regionid];
                this.getAllResources();
            }
        }
    }
}