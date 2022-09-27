import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';

import { Action, Status, ModelCatalogResource } from './resource';
import { getLabel, isSubregion, isMainRegion } from 'model-catalog-api/util';
import { Region, RegionFromJSON, GeoShape, GeoShapeFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { Region as LocalRegion, RegionCategory} from "screens/regions/reducers";

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';

import { BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from 'model-catalog-api/default-redux-api';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { IdMap } from 'app/reducers';
import { GoogleMapCustom } from 'components/google-map-custom';
import { MINT_PREFERENCES } from 'config';


@customElement('model-catalog-region')
export class ModelCatalogRegion extends connect(store)(ModelCatalogResource)<Region> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        wl-tab-group {
            --tab-group-bg: #F6F6F6;
        }

        wl-tab {
            --tab-bg: #F6F6F6;
            --tab-bg-disabled: #F6F6F6;
        }`];
    }

    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';

    @property({type: String}) private _selectedCategory: string = '';
    @property({type: Boolean}) private _mapReady: boolean = false;

    @property({type: String}) private _topRegionUri : string = "";
    @property({type: Boolean}) protected _creationEnabled : boolean = false;
    @property({type: Boolean}) protected _editionEnabled : boolean = false;
    @property({type: Boolean}) protected _deleteEnabled : boolean = false;
    @property({type: Boolean}) protected _tabMap : boolean = false;

    @property({type: Object}) private topRegion : LocalRegion;
    @property({type: Array}) private _mapRegions : LocalRegion[] = [];
    @property({type: String}) private topRegionId : string = "";
    @property({type: Object}) private _selectedMapRegion : LocalRegion;
    
    @property({type: Object}) private categories : IdMap<RegionCategory>;

    protected resourceApi : DefaultReduxApi<Region,BaseAPI> = ModelCatalogApi.myCatalog.region;

    protected classes : string = "resource region";
    protected name : string = "region";
    protected pname : string = "regions";

    constructor () {
        super();
        this._filters.push(
            (r:Region) => isMainRegion(r) || (!this._topRegionUri || isSubregion(this._topRegionUri, r))
        );
    }

    public getResources () {
        let rs : Region[] = super.getResources();
        //FIXME: server is failing with GeoShape
        return rs.map((r:Region) => {
            if (r.geo) delete r.geo;
            return r;
        })
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        if (this._tabMap) {
            let selected : LocalRegion = this._selectedMapRegion;
            // Check if this region is already on the model catalog
            let mcRegion : Region[] = Object.values(this._loadedResources).filter((region:Region) =>
                region.label[0] === selected.name
            );
            if (mcRegion.length > 0) {
                this._postSaveUpdate(mcRegion[0]);
                return null;
            }

            let jsonRes = {
                type: ["Region"],
                label: [selected.name],
                partOf: [{id: this._topRegionUri}],
                geo: [
                    GeoShapeFromJSON({
                        label: ["Bounding box for " + selected.name],
                        box: [selected.bounding_box.xmin + ',' + selected.bounding_box.ymin + ' '
                              + selected.bounding_box.xmax + ',' + selected.bounding_box.ymax ],
                        type: ["GeoShape"]
                    })
                ]
            }
            return RegionFromJSON(jsonRes);
        } else {
            let inputLabel : Textfield  = this.shadowRoot.getElementById('region-name') as Textfield;
            let inputDesc  : Textarea   = this.shadowRoot.getElementById('region-desc') as Textarea;
            // VALIDATE
            let label : string = inputLabel ? inputLabel.value : '';
            let desc : string = inputDesc ? inputDesc.value : '';
            if (label && desc) {
                let jsonRes = {
                    type: ["Region"],
                    label: [label],
                    description: [desc],
                };
                return RegionFromJSON(jsonRes);
            } else {
                // Show errors
                if (!label && inputLabel) (<any>inputLabel).refreshAttributes();
                if (!desc && inputDesc) (<any>inputDesc).refreshAttributes();
            }
        }
    }

    protected _clearStatus () {
        this._tabMap = false;
        super._clearStatus();
    }

    protected _renderSelectDialog () {
        return html`
        <h3 slot="header">
            Select ${this._action === Action.SELECT ? this.name : this.pname}
        </h3>
        <div slot="content">
            ${this._renderTabs()}
            ${this._tabMap ? this._renderMapTab() : html`
                ${this._renderSearchOnList()}
                ${this._renderSelectList()}
                ${this._creationEnabled ? html`
                <div>
                    or <a class="clickable" @click=${this._createResource}>create a new ${this.name}</a>
                </div>
                ` : ''}
            `}
        </div>
        <div slot="footer">
            ${this._tabMap ? html`
            <wl-button @click="${this._closeMap}" style="margin-right: 5px;" inverted flat>
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="${this._waiting || !this._selectedMapRegion}" @click="${this._onSaveButtonClicked}">
                Select
                ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
            </wl-button>
            ` : html`
            <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat>
                Cancel
            </wl-button>
            <wl-button class="submit" @click="${this._onSelectButtonClicked}">
                Select
            </wl-button>
            `}
        </div>`;
    }

    private _renderTabs () {
        return html`
            <wl-tab-group align="center">
                <wl-tab ?checked="${!this._tabMap}" @click="${() => {this._tabMap = false;}}">Search Region</wl-tab>
                <wl-tab ?checked="${this._tabMap}" @click="${this._enableMap}">Map</wl-tab>
            </wl-tab-group>
        `;
    }

    private _enableMap () {
        if (!this._tabMap) {
            this._tabMap = true;
            this._status = Status.CUSTOM_CREATE;
        }
    }

    private _renderMapTab () {
        return html`
            <form id="regionForm">
                <div class="input_half">
                    <label>Region category</label>
                    <select name="category-selector" value="" @change="${this._onRegionCategoryChange}">
                        <option value="">None</option>
                        ${Object.values(this.categories).map((cat: RegionCategory) => {
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
                </div>
            </form>

            ${!this._mapReady ? html`
                <span>Please select a region category</span>
            ` : ''}
            <google-map-custom class="map" api-key="${MINT_PREFERENCES.google_maps_key}" 
                .style="height:400px; visibility: ${this._mapReady ? 'visible': 'hidden'}"
                ?disable-default-ui="${true}" draggable="true"
                @click="${this._handleMapClick}"
                mapTypeId="terrain" styles="${this._mapStyles}">
            </google-map-custom>

            ${this._selectedMapRegion ? html`
            <b>Selected region name:</b> ${this._selectedMapRegion.name} <br/>
            <b>Bounding Box:</b>
                ${ this._selectedMapRegion.bounding_box.xmin.toFixed(4) + ',' + this._selectedMapRegion.bounding_box.ymin.toFixed(4) }
                ${ this._selectedMapRegion.bounding_box.xmax.toFixed(4) + ',' + this._selectedMapRegion.bounding_box.ymax.toFixed(4) }
            ` : ''}`
    }

    private _onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionForm")!;
        let category = (form.elements["category-selector"] as HTMLSelectElement).value;
        if (category != this._selectedCategory) {
            this._selectedCategory = category;
            this.addRegionsToMap();
        }
    }

    public addRegionsToMap() {
        let map = this.shadowRoot.querySelector("google-map-custom") as GoogleMapCustom;
        let visibleRegions = this._mapRegions.filter((region:LocalRegion) => region.category_id == this._selectedCategory);
        if (map && visibleRegions) {
            try {
                map.setRegions(visibleRegions, this.topRegionId);
                this._mapReady = true;
            } catch {
                map.addEventListener("google-map-ready", (e) => {
                    map.setRegions(visibleRegions, this.topRegionId);
                    this._mapReady = true;
                })
            }
        }
    }

    private _handleMapClick(ev: any) {
        if(ev.detail && ev.detail.id) {
            this._selectedMapRegion = this._mapRegions.filter(r => r.id === ev.detail.id)[0];
        }
    }

    private _closeMap () {
        this._tabMap = false;
    }

    stateChanged(state: RootState) {
        if (state.ui && state.regions) {
            this.topRegionId = state.ui.selected_top_regionid
            if (this.topRegionId && state.regions.regions && state.regions.regions[this.topRegionId]) {
                this.topRegion = state.regions.regions[this.topRegionId];
                if (this.topRegion.model_catalog_uri != this._topRegionUri)
                    this._topRegionUri = this.topRegion.model_catalog_uri;
            }
            let subRegionIds : IdMap<string[]> = state.regions.sub_region_ids;
            if (this.topRegionId && subRegionIds && subRegionIds[this.topRegionId]) {
                this._mapRegions = subRegionIds[this.topRegionId].map((regionid:string) => state.regions.regions[regionid]);
            }

            this.categories = state.regions.categories;
        }
    }
}
