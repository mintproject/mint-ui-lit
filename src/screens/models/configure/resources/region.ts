import { property, html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';

import { Action, Status, ModelCatalogResource } from './resource';
import { getLabel, isSubregion } from 'model-catalog/util';
import { regionGet, regionsGet, regionPost, regionPut, regionDelete } from 'model-catalog/actions';
import { Region, RegionFromJSON, GeoShape, GeoShapeFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { GOOGLE_API_KEY } from 'config/google-api-key';
import { GoogleMapCustom } from 'components/google-map-custom';
import { RegionCategory } from "screens/regions/reducers";
import { Region as LocalRegion} from "screens/regions/reducers";
import { IdMap } from "app/reducers";

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

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

    @property({type: String})
    private _selectedCategory: string = '';

    @property({type: Boolean})
    private _mapReady: boolean = false;

    @property({type: String}) private _topRegionUri : string = "";
    @property({type: Boolean}) protected _creationEnabled : boolean = false;
    @property({type: Boolean}) protected _editionEnabled : boolean = false;
    @property({type: Boolean}) protected _deleteEnabled : boolean = false;
    @property({type: Boolean}) protected _tabMap : boolean = false;

    @property({type: Object}) private _region : LocalRegion;
    @property({type: Object}) private _mapRegions : LocalRegion[] = [];
    @property({type: String}) private _regionid : string = "";
    @property({type: Object}) private _selectedMapRegion : LocalRegion;

    protected classes : string = "resource region";
    protected name : string = "region";
    protected pname : string = "regions";
    protected resourcesGet = regionsGet;
    protected resourceGet = regionGet;
    protected resourcePut = regionPut;
    protected resourcePost = regionPost;
    protected resourceDelete = regionDelete;

    constructor () {
        super();
        this._filters.push(
            (r:Region) => !this._topRegionUri || isSubregion(this._topRegionUri, r)
        );
    }


    /*protected _renderResource (r:Region) {
        return html`
            <div class="one-line" style="text-decoration:underline; color:black;">
                ${getLabel(r)}
            </div>
            <div class="one-line" style="display: flex; justify-content: space-between;">
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Spatial res:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasSpatialResolution && r.hasSpatialResolution.length > 0 ? r.hasSpatialResolution[0] : '-'}
                    </span>
                </span>
                <span style="margin-right: 10px;">
                    <span style="font-size:12px">Dimensions:</span>
                    <span class="number" style="color:black">
                        ${r.hasDimension && r.hasDimension.length > 0 ? r.hasDimension[0] : '-'}
                    </span>
                </span>
                <span style="margin-right: 10px;" class="one-line">
                    <span style="font-size:12px">Shape:</span>
                    <span class="monospaced" style="color:black">
                        ${r.hasShape && r.hasShape.length > 0 ? r.hasShape[0] : '-'}
                    </span>
                </span>
            </div>
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="region-name" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="region-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="region-spatial-res" label="Spatial resolution"
                value=${edResource && edResource.hasSpatialResolution ? edResource.hasSpatialResolution[0] : ''}>
            </wl-textfield>
            <div class="two-inputs">
                <wl-select id="region-dim" label="Dimension"
                    value=${edResource && edResource.hasDimension ? edResource.hasDimension[0] : ''}>
                    <option value selected>None</option>
                    <option value="0D">0D</option>
                    <option value="1D">1D</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                </wl-select>
                <wl-select id="region-shape" label="Shape"
                    value=${edResource && edResource.hasShape ? edResource.hasShape[0] : ''}>
                    <option value selected>None</option>
                    <option value="Point">Point</option>
                    <option value="Triangular">Triangular</option>
                    <option value="Block structure">Block structure</option>
                </wl-select>
            </div>
        </form>`;
    }*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        if (this._tabMap) {
            let selected = this._selectedMapRegion;
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
            <wl-button @click="${this._closeMap}" style="margin-right: 5px;" inverted flat ?disabled="">
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="${this._waiting || !this._selectedMapRegion}" @click="${this._onFormSaveButtonClicked}">
                Select
                ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
            </wl-button>
            ` : html`
            <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat ?disabled="">
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="" @click="${this._onSelectButtonClicked}">
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
                        ${this._region.categories.map((cat: RegionCategory) => {
                            let subCategories = this._region.subcategories[cat.id] || [];
                            return html`
                            <option value="${cat.id}">${cat.id}</option>
                            ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                                return html`<option value="${subcat.id}">&nbsp;&nbsp;&nbsp;&nbsp;${subcat.id}</option>`;
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
            <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" 
                .style="height:400px; visibility: ${this._mapReady ? 'visible': 'hidden'}"
                disable-default-ui="true" draggable="true"
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
        let visibleRegions = this._mapRegions.filter((region) => region.region_type == this._selectedCategory);
        if(map && visibleRegions) {
            try {
                map.setRegions(visibleRegions, this._regionid);
              this._mapReady = true;
            }
            catch {
              map.addEventListener("google-map-ready", (e) => {
                map.setRegions(visibleRegions, this._regionid);
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

    private _onMapButtonClicked () {
        console.log('MapClicked');
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.regions;
    }

    stateChanged(state: RootState) {
        if (state.ui && state.regions) {
            this._regionid = state.ui.selected_top_regionid;
            if (this._regionid && state.regions.regions && state.regions.regions[this._regionid]) {
                this._region = state.regions.regions[this._regionid];
                if (this._region.model_catalog_uri != this._topRegionUri)
                    this._topRegionUri = this._region.model_catalog_uri;
            }
            let sr = state.regions.sub_region_ids;
            if (this._regionid && sr && sr[this._regionid]) {
                this._mapRegions = sr[this._regionid].map((regionid) => state.regions.regions[regionid]);
            }
        }
    }
}
