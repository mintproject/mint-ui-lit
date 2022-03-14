
import { Model, ModelCategory, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Region, GeoShape } from "@mintproject/modelcatalog_client";
import { RootState, store } from "app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { customElement, LitElement, property, html, css, CSSResult, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { RegionMap, RegionsState } from '../screens/regions/reducers';

import "weightless/button";
import "weightless/icon";
import { IdMap, MintPreferences } from "app/reducers";
import { getId, getLabel } from "model-catalog-api/util";
import { SharedStyles } from "styles/shared-styles";
import { mapStyles } from "styles/map-style";

import { BoundingBox, Region as LocalRegion, RegionCategory} from "screens/regions/reducers";

import * as mintConfig from 'config/config.json';
import { GoogleMapCustom } from "components/google-map-custom";
import { showDialog } from "util/ui_functions";
let prefs = mintConfig["default"] as MintPreferences;
const GOOGLE_API_KEY = prefs.google_maps_key;

@customElement("region-selector")
//export class ModelSelector extends connect(store)(LitElement) {
export class RegionSelector extends LitElement {
    @property({type: Boolean}) private editMode : boolean = false;
    @property({type: Boolean}) private mapReady : boolean = false;

    @property({type: Object}) private categories : IdMap<RegionCategory>;
    @property({type: String}) private selectedCategoryId: string = '';

    @property({type: Array})  private mapRegions : LocalRegion[] = [];
    @property({type: Object}) private selectedRegion : LocalRegion;
    @property({type: String}) private selectedRegionId : string = "";

    @property({type: Object}) private topRegion : LocalRegion;
    @property({type: String}) private topRegionId : string = "";
    @property({type: String}) private topRegionUri : string = "";

    @property({type: String}) private candidateId : string = "";

    private regions : IdMap<Region>;
    private geoshapes : IdMap<GeoShape>;

    static get styles() {
        return [css`
            .map {
                width: 500px;
                height: 300px;
                margin: 5px;
            }
            .mapFooter {
                display: flex;
                justify-content: space-between;
                width: 500px;
            }
        `];
    }

    public setEditable () {
        this.editMode = true;
    }

    public cancel () {
        this.editMode = false;
        this.candidateId = "";
        if (this.selectedRegion) {
            this.selectedCategoryId = this.selectedRegion.category_id ? this.selectedRegion.category_id : "";
        }
    }

    public save () {
        this.editMode = false;
        if (this.candidateId) {
            this.setSelected(this.candidateId)
            if (this.selectedRegion) {
                this.selectedCategoryId = this.selectedRegion.category_id ? this.selectedRegion.category_id : "";
            }
        }
    }

    public render () : TemplateResult {
        let loading : boolean = this.mapRegions.length === 0;
        return loading ? html`<loading-dots style="--width: 20px"></loading-dots>` : 
        (this.editMode ?  this.renderEditForm() : this.renderView());
    }

    public renderEditForm () : TemplateResult {
        let nRegions : IdMap<number> = {};
        Object.values(this.categories||{}).forEach((cat:RegionCategory) => {
            nRegions[cat.id] = 0;
            cat.subcategories.forEach((subcat:RegionCategory) => {
                nRegions[subcat.id] = this.mapRegions
                        .filter((region:LocalRegion) => region.category_id == subcat.id)
                        .length;
                nRegions[cat.id] += nRegions[subcat.id];
            });
        });

        return html`
        <form id="regionForm">
            <label>Region category</label>
            <select name="category-selector" value="" @change="${this.onRegionCategoryChange}">
                <option value="">None</option>
                ${Object.values(this.categories||{}).filter((cat:RegionCategory) => nRegions[cat.id] > 0).map((cat: RegionCategory) => {
                    let subCategories : RegionCategory[] = cat.subcategories;
                    return html`
                    <option value="${cat.id}">${cat.name}</option>
                    ${subCategories.length > 0 ? subCategories.filter((subcat:RegionCategory) => nRegions[subcat.id] > 0).map((subcat: RegionCategory) => {
                        return html`<option value="${subcat.id}" ?selected=${subcat.id == this.selectedCategoryId}>&nbsp;&nbsp;&nbsp;&nbsp;${subcat.name}</option>`;
                    }) : html`
                        <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                    `}`
                })}
            </select>
        </form>
        
        <div style="width: fit-content;">
            <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" id="editable-map"
                .style="height: ${this.mapReady ? '400px' : '0px'}; visibility: ${this.mapReady ? 'visible': 'hidden'};"
                ?disable-default-ui="${true}" draggable="true"
                @click="${this.handleMapClick}"
                mapTypeId="terrain" .styles=${mapStyles}>
            </google-map-custom>
        </div>

        ${this.mapReady && this.selectedRegion ? html`
            <div class="mapFooter">
                <div>
                    ${this.selectedRegion ? html`
                    <b>Selected region name:</b> ${this.selectedRegion.name} <br/>
                    <b>Bounding Box:</b>
                        ${ this.selectedRegion.bounding_box.xmin.toFixed(4) + ',' + this.selectedRegion.bounding_box.ymin.toFixed(4) }
                        ${ this.selectedRegion.bounding_box.xmax.toFixed(4) + ',' + this.selectedRegion.bounding_box.ymax.toFixed(4) }
                    ` : ''}
                </div>
            </div>` : ""}

        `;
    }

    private handleMapClick (ev: any) : void {
        if (ev.detail && ev.detail.id)
            this.candidateId = ev.detail.id;
            //console.log("-->", ev.detail.id);
    }

    public renderView () : TemplateResult {
        return html`${!this.selectedRegionId ? "None selected" : (
            !this.selectedRegion ?  this.selectedRegionId : html`
                ${this.selectedRegion.name} 
                <a href="#" @click=${this.showMap}>(map)</a>
                ${this.renderMapDialog()}
            `
        )}`;
    }

    private renderMapDialog () : TemplateResult {
        return html`
         <wl-dialog id="regionDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Selected Region: ${this.selectedRegion.name}</h3>
            <div slot="content" style="width: fit-content;">
                <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" id="non-editable-map"
                    .style="height: ${this.mapReady ? '400px' : '0px'}; visibility: ${this.mapReady ? 'visible': 'hidden'};pointer-events: none;"
                    ?disable-default-ui="${true}" draggable="false"
                    mapTypeId="terrain" .styles=${mapStyles}>
                </google-map-custom>
            </div>
        </wl-dialog>
        `;
    }

    private showMap (e:Event) {
        e.preventDefault();
        showDialog("regionDialog", this.shadowRoot!);
        this.updateMap();
    }

    private onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionForm")!;
        let categoryId = (form.elements["category-selector"] as HTMLSelectElement).value;
        if (categoryId != this.selectedCategoryId) {
            this.selectedCategoryId = categoryId;
            this.addRegionsToMap();
        }
    }

    public setSelected (regionid:string) : boolean {
        this.selectedRegionId = regionid; //--
        this.selectedRegion = (regionid === this.topRegionId) ? 
                this.topRegion
                : this.mapRegions.filter(r => r.id === regionid)[0];

        if (!!this.selectedRegion) this.addRegionsToMap();
        //else console.log("Selected before map loaded");
        return !!this.selectedRegion;
    }

    public getSelectedId () : string {
        return this.selectedRegionId;
    }

    public getSelectedRegion () : LocalRegion {
        return this.selectedRegion;
    }

    public addRegionsToMap() {
        let map : GoogleMapCustom;
        if (this.editMode)
            map = this.shadowRoot.querySelector("#editable-map") as GoogleMapCustom;
        else
            map = this.shadowRoot.querySelector("#non-editable-map") as GoogleMapCustom;

        let selectedRegion : string = this.selectedRegionId ? this.selectedRegionId : this.topRegionId;
        let visibleRegions : LocalRegion[] = []
        if (this.topRegionId === selectedRegion && !this.selectedCategoryId) {
            visibleRegions = [this.topRegion];
        } else {
            if (this.selectedCategoryId) {
                visibleRegions = this.mapRegions.filter((region:LocalRegion) => region.category_id == this.selectedCategoryId);
            } else {
                //Search for Id on all regions.
                let candidates : LocalRegion[] = this.mapRegions.filter((region:LocalRegion) => region.id == selectedRegion);
                if (candidates.length > 0) {
                    this.selectedRegion =  candidates[0];
                    this.selectedCategoryId = this.selectedRegion.category_id;
                    visibleRegions = this.mapRegions.filter((region:LocalRegion) => region.category_id == this.selectedCategoryId);
                }
            }
        }

        if (map && visibleRegions) {
            try {
                map.setRegions(visibleRegions, selectedRegion);
                this.mapReady = true;
            } catch {
                map.addEventListener("google-map-ready", (e) => {
                    map.setRegions(visibleRegions, selectedRegion);
                    this.mapReady = true;
                })
            }
        }
    }

    public updateMap () : void {
        setTimeout(() => {this.addRegionsToMap()}, 300);
    }

    public loadRegionState (state:RegionsState, parentRegionId:string) {
        this.topRegionId = parentRegionId;
        this.categories = state.categories;

        if (this.topRegionId && state.regions && state.regions[this.topRegionId]) {
            this.topRegion = state.regions[this.topRegionId];
            if (this.topRegion.model_catalog_uri != this.topRegionUri)
                this.topRegionUri = this.topRegion.model_catalog_uri;
        }
        let subRegionIds : IdMap<string[]> = state.sub_region_ids;
        if (this.topRegionId && subRegionIds && subRegionIds[this.topRegionId]) {
            this.mapRegions = subRegionIds[this.topRegionId].map((regionid:string) => state.regions[regionid]);
        }

        if (this.mapRegions && this.selectedRegionId && !this.selectedRegion) {
            //Id set before load
            this.setSelected(this.selectedRegionId);
        }

        if (this.topRegion && this.mapRegions && this.mapRegions.length > 0 && !this.mapReady) {
            this.addRegionsToMap();
        }

    }
}