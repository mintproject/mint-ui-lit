import { ModelConfigurationSetup, Region, GeoShape } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { RootState, store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel, isMainRegion } from "model-catalog-api/util";
import { ModelQuestion } from '../model-question';
import { mapStyles } from "styles/map-style";

import { BoundingBox, Region as LocalRegion, RegionCategory} from "screens/regions/reducers";

import { MintPreferences } from 'app/reducers';
import * as mintConfig from 'config/config.json';
import { GoogleMapCustom } from "components/google-map-custom";
import { bboxInRegion, doBoxesIntersect, getBoundingBoxFromGeoShape } from "screens/regions/actions";
let prefs = mintConfig["default"] as MintPreferences;
const GOOGLE_API_KEY = prefs.google_maps_key;

@customElement("is-in-bounding-box-question")
export class IsInBoundingBoxQuestion extends connect(store)(ModelQuestion) {
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

    @property({type: String}) private selectedCategory: string = '';
    @property({type: Object}) private categories : IdMap<RegionCategory>;
    @property({type: Boolean}) private mapReady: boolean = false;
    @property({type: String}) private topRegionId : string = "";
    @property({type: String}) private topRegionUri : string = "";
    @property({type: Object}) private topRegion : LocalRegion;
    @property({type: Object}) private selectedMapRegion : LocalRegion;
    @property({type: String}) private selectedRegionId : string = "";
    @property({type: Array})  private mapRegions : LocalRegion[] = [];
    @property({type: Boolean}) private mustUpdateSelected : boolean = false;
    @property({type: Boolean}) public canBeAdded : boolean = false;

    constructor (
            id:string = "isInboundingBoxQuestion",
            name:string = "Model is inside of region",
            template:string = "That are configured to work on ?region",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasRegion> ?region ."//TODO: add geoshape logic
        ) {
        super(id, name, template, pattern);

        let regionReq : Promise<IdMap<Region>> = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        let geoShapeReq : Promise<IdMap<GeoShape>> = store.dispatch(ModelCatalogApi.myCatalog.geoShape.getAll());
        regionReq.then((regions : IdMap<Region>) => {
            this.regions = regions;
            
        });
        geoShapeReq.then((shapes: IdMap<GeoShape>) => {
            this.geoshapes = shapes;
        });

        Promise.all([regionReq, geoShapeReq]).then(() => {
            if (this.possibleSetups) {
                this.filterPossibleOptions(this.possibleSetups);
            }
        })
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);
    }

    public createCopy () : IsInBoundingBoxQuestion {
        return new IsInBoundingBoxQuestion(this.id, this.name, this.template, this.pattern);
    }

    public filterModels (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let regionid : string = this.settedOptions["?region"];
        if (!regionid) return [];
        let selected : LocalRegion;
        if (regionid === this.topRegionId)
            selected = this.topRegion;
        else
            selected = this.mapRegions.filter(r => r.id === regionid)[0];

        let regionsInBoundingBox : Region[] = [];

        Object.values(this.regions).forEach((r:Region) => {
            if (r.geo && r.geo.map((shape:GeoShape) => this.geoshapes[shape.id]).some((shape:GeoShape) => {
                let bb : BoundingBox = getBoundingBoxFromGeoShape(shape);
                return !!bb && (
                    (!isMainRegion(r) && selected.bounding_box && doBoxesIntersect(bb, selected.bounding_box)) 
                    || (selected.model_catalog_uri && selected.model_catalog_uri === r.id));
            })) {
                regionsInBoundingBox.push(r);
            }
        });

        return modelsToFilter.filter((s:ModelConfigurationSetup) => 
            !!s.hasRegion && s.hasRegion
                    .map((r:Region) => this.regions[r.id])
                    .some((r:Region) => regionsInBoundingBox.some((r2:Region) => r2.id === r.id))
        );
    }

    public renderForm (isEditable : boolean) : TemplateResult {
        return html`
            ${isEditable ? html`
                <form id="regionForm">
                    <label>Region category</label>
                    <select name="category-selector" value="" @change="${this.onRegionCategoryChange}">
                        <option value="">None</option>
                        ${Object.values(this.categories||{}).map((cat: RegionCategory) => {
                            let subCategories : RegionCategory[] = cat.subcategories;
                            return html`
                            <option value="${cat.id}">${cat.name}</option>
                            ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                                return html`<option value="${subcat.id}" ?selected=${subcat.id == this.selectedCategory}>&nbsp;&nbsp;&nbsp;&nbsp;${subcat.name}</option>`;
                            }) : html`
                                <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                            `}`
                        })}
                    </select>
                </form>
            ` : ""}
            ${!this.mapReady ? (isEditable ? 
                html`<span>Please select a region category</span>`
                : html`<loading-dots style="--width: 20px"></loading-dots>`
            ) : ""}
            <div style="cursor: ${isEditable ? "auto" : "not-allowed"}; width: fit-content;">
                <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" 
                    .style="height: ${this.mapReady ? '400px' : '0px'}; visibility: ${this.mapReady ? 'visible': 'hidden'}; pointer-events: ${isEditable ? "auto" : "none"};"
                    ?disable-default-ui="${true}" draggable="true"
                    @click="${this.handleMapClick}"
                    mapTypeId="terrain" .styles=${mapStyles}>
                </google-map-custom>
            </div>

            ${this.mapReady && this.selectedMapRegion ? html`
                <div class="mapFooter">
                    <div>
                        ${this.selectedMapRegion ? html`
                        <b>Selected region name:</b> ${this.selectedMapRegion.name} <br/>
                        <b>Bounding Box:</b>
                            ${ this.selectedMapRegion.bounding_box.xmin.toFixed(4) + ',' + this.selectedMapRegion.bounding_box.ymin.toFixed(4) }
                            ${ this.selectedMapRegion.bounding_box.xmax.toFixed(4) + ',' + this.selectedMapRegion.bounding_box.ymax.toFixed(4) }
                        ` : ''}
                    </div>
                    <div>
                        ${this.textRepresentation ? html`
                            <button @click="${this.onAddClicked}">Filter using this region</button>
                        ` : ""}
                    </div>
                </div>` : ""}

        `;
    }

    private onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionForm")!;
        let category = (form.elements["category-selector"] as HTMLSelectElement).value;
        if (category != this.selectedCategory) {
            this.selectedCategory = category;
            this.addRegionsToMap();
        }
    }

    public addRegionsToMap() {
        let map = this.shadowRoot.querySelector("google-map-custom") as GoogleMapCustom;
        let selectedRegion : string = this.selectedRegionId ? this.selectedRegionId : this.topRegionId;

        let visibleRegions : LocalRegion[] = []
        if (this.topRegionId === selectedRegion && !this.selectedCategory) {
            visibleRegions = [this.topRegion];
        } else {
            if (this.selectedCategory) {
                visibleRegions = this.mapRegions.filter((region:LocalRegion) => region.category_id == this.selectedCategory);
            } else {
                //Search for Id on all regions.
                let candidates : LocalRegion[] = this.mapRegions.filter((region:LocalRegion) => region.id == selectedRegion);
                if (candidates.length > 0) {
                    this.selectedMapRegion =  candidates[0];
                    this.selectedCategory = this.selectedMapRegion.category_id;
                    visibleRegions = this.mapRegions.filter((region:LocalRegion) => region.category_id == this.selectedCategory);
                }
            }
        }

        if (this.mustUpdateSelected && (this.mapReady || (this.topRegion && this.mapRegions && this.mapRegions.length > 0))) {
            this.mustUpdateSelected = false;
            this._setSelected(this.selectedRegionId);
            return this.addRegionsToMap();
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

    protected onAddClicked () {
        if ( this.selectedMapRegion ) {
            let options = {};
            options[this.selectedMapRegion.id] = this.selectedMapRegion.name;
            this.setVariableOptions("?region", options);
            this.settedOptions["?region"] = this.selectedMapRegion.id;
            let event : CustomEvent = new CustomEvent("model-question-added", {
                bubbles: true,
                composed: true,
                detail: this
            });
            this.dispatchEvent(event);
            this.requestUpdate();
        }
    }

    private handleMapClick (ev: any) : void {
        if (ev.detail && ev.detail.id)
            this._setSelected(ev.detail.id);
    }

    private _setSelected (localRegionId:string) : boolean {
        this.selectedMapRegion = (localRegionId === this.topRegionId) ? 
                this.topRegion
                : this.mapRegions.filter(r => r.id === localRegionId)[0];
        if (this.selectedMapRegion) {
            this.selectedRegionId = localRegionId;

            let options : {[key:string]:string;} = {};
            options[this.selectedMapRegion.id] = this.selectedMapRegion.name;
            this.setVariableOptions("?region", options);
            this.settedOptions["?region"] = this.selectedMapRegion.id;

        } else {
            console.log("- ? -");
        }

        if (!!this.selectedMapRegion && !this.textRepresentation) this.addRegionsToMap();

        return !!this.selectedMapRegion;
    }

    public setSelected (localRegionId:string) : boolean {
        if (this.mapReady || (this.topRegion && this.mapRegions && this.mapRegions.length > 0)) {
            return this._setSelected(localRegionId);
        } else {
            this.selectedRegionId = localRegionId;
            this.mustUpdateSelected = true;
            return false;
        }
    }

    public getSelectedRegion () : LocalRegion {
        let regionid : string = this.settedOptions["?region"];
        if (!regionid) return;
        if (regionid === this.topRegionId)
            return this.topRegion;
        return this.mapRegions.filter(r => r.id === regionid)[0];
    }

    public getSelectedRegionId () : string {
        return this.selectedRegionId;
    }

    public updateMap () : void {
        this.addRegionsToMap();
    }

    protected firstUpdated () {
        if (this.topRegion && this.mapRegions && this.mapRegions.length > 0) {
            this.updateMap();
        }
    }

    stateChanged(state: RootState) {
        if (state.ui && state.regions) {
            this.topRegionId = state.ui.selected_top_regionid
            if (this.topRegionId && state.regions.regions && state.regions.regions[this.topRegionId]) {
                this.topRegion = state.regions.regions[this.topRegionId];
                if (this.topRegion.model_catalog_uri != this.topRegionUri)
                    this.topRegionUri = this.topRegion.model_catalog_uri;
            }
            let subRegionIds : IdMap<string[]> = state.regions.sub_region_ids;
            if (this.topRegionId && subRegionIds && subRegionIds[this.topRegionId]) {
                this.mapRegions = subRegionIds[this.topRegionId].map((regionid:string) => state.regions.regions[regionid]);
            }

            this.categories = state.regions.categories;
            if (this.topRegion && this.mapRegions && this.mapRegions.length > 0 && !this.mapReady) {
                this.updateMap();
            }
        }
    }
}