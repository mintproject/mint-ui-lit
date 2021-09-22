import { ModelConfigurationSetup, Region, GeoShape } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { RootState, store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel, isMainRegion } from "model-catalog-api/util";
import { ModelQuestion } from '../model-question';

import { BoundingBox, Region as LocalRegion, RegionCategory} from "screens/regions/reducers";

import { MintPreferences } from 'app/reducers';
import * as mintConfig from 'config/config.json';
import { GoogleMapCustom } from "components/google-map-custom";
import { bboxInRegion, doBoxesIntersect, getBoundingBoxFromGeoShape } from "screens/regions/actions";
let prefs = mintConfig["default"] as MintPreferences;
const GOOGLE_API_KEY = prefs.google_maps_key;   

@customElement("is-in-bounding-box-question")
export class IsInBoundingBoxQuestion extends ModelQuestion {
    private regions : IdMap<Region>;
    private geoshapes : IdMap<GeoShape>;
    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';

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
    @property({type: Array})  private mapRegions : LocalRegion[] = [];
    @property({type: Boolean}) private neverUpdated : boolean = true;

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

        /*if (this.regions && this.geoshapes) {
            let regionOptions : {[key:string] : string} = {};
            matchingSetups.forEach((s:ModelConfigurationSetup) =>
                (s.hasRegion||[]).forEach((r:Region) => {
                    this.countOption(r.id);
                    regionOptions[r.id] = getLabel(this.regions[r.id] ? this.regions[r.id] : getLabel(r));
                })
            );

            this.setVariableOptions("?region", regionOptions);
        }*/
    }

    public createCopy () : IsInBoundingBoxQuestion {
        return new IsInBoundingBoxQuestion(this.id, this.name, this.template, this.pattern);
    }

    public applyFilter (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let regionid : string = this.settedOptions["?region"];
        let selected : LocalRegion = this.mapRegions.filter(r => r.id === regionid)[0];
        let regionsInBoundingBox : Region[] = [];

        Object.values(this.regions).forEach((r:Region) => {
            if (r.geo && r.geo.map((shape:GeoShape) => this.geoshapes[shape.id]).some((shape:GeoShape) => {
                let bb : BoundingBox = getBoundingBoxFromGeoShape(shape);
                return !!bb && !isMainRegion(r) && doBoxesIntersect(bb, selected.bounding_box);
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

    public renderForm () : TemplateResult {
        return html`
            <form id="regionForm">
                <label>Region category</label>
                <select name="category-selector" value="" @change="${this.onRegionCategoryChange}">
                    <option value="">None</option>
                    ${Object.values(this.categories||{}).map((cat: RegionCategory) => {
                        let subCategories : RegionCategory[] = cat.subcategories;
                        return html`
                        <option value="${cat.id}">${cat.name}</option>
                        ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                            return html`<option value="${subcat.id}">&nbsp;&nbsp;&nbsp;&nbsp;${subcat.name}</option>`;
                        }) : html`
                            <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                        `}`
                    })}
                </select>
            </form>
            ${!this.mapReady ? html`
                <span>Please select a region category</span>
            ` : ""}
            <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" 
                .style="height: ${this.mapReady ? '400px' : '0px'}; visibility: ${this.mapReady ? 'visible': 'hidden'}"
                ?disable-default-ui="${true}" draggable="true"
                @click="${this.handleMapClick}"
                mapTypeId="terrain" styles="${this._mapStyles}">
            </google-map-custom>

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
                        <button @click="${this.onAddClicked}">Filter using this region</button>
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
        let visibleRegions = this.mapRegions.filter((region:LocalRegion) => region.category_id == this.selectedCategory);
        if (map && visibleRegions) {
            try {
                map.setRegions(visibleRegions, this.topRegionId);
                this.mapReady = true;
            } catch {
                map.addEventListener("google-map-ready", (e) => {
                    map.setRegions(visibleRegions, this.topRegionId);
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

    private handleMapClick(ev: any) {
        if(ev.detail && ev.detail.id) {
            this.selectedMapRegion = this.mapRegions.filter(r => r.id === ev.detail.id)[0];
        }
    }
    
    protected firstUpdated () {
        this.stateChanged(store.getState() as RootState);
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
            this.neverUpdated = false;
        }
    }
}
