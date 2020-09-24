import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'
import { GOOGLE_API_KEY } from 'config/firebase';
import { GoogleMapCustom } from 'components/google-map-custom';

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { IdMap } from "app/reducers";

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';
import { RegionCategory } from "screens/regions/reducers";

import { regionsGet, regionPost, regionDelete } from 'model-catalog/actions';
import { isSubregion, isMainRegion } from 'model-catalog/util';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'
import { Region } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

@customElement('models-configure-region')
export class ModelsConfigureRegion extends connect(store)(PageViewElement) {
    @property({type: String})
    private _tab: '' | 'map' = '';

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _regions : IdMap<Region> = {} as IdMap<Region>;

    @property({type: Object})
    private _mapRegions : any = [];

    @property({type: Object})
    private _selectedMapRegion : any = '';

    @property({type: String})
    private _filter : string = '';

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: Object})
    private _selected : IdMap<boolean> = {} as IdMap<boolean>;

    @property({type: String})
    private _selectedCategory: string = '';

    @property({type: Boolean})
    private _mapReady: boolean = false;

    private _searchPromise : ReturnType<typeof setTimeout> | null = null;

    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        wl-tab-group {
            --tab-group-bg: #F6F6F6;
        }

        wl-tab {
            --tab-bg: #F6F6F6;
            --tab-bg-disabled: #F6F6F6;
        }

        wl-button.small {
            border: 1px solid gray;
            margin-right: 5px;
            --button-padding: 4px;
        }

        .author-container {
            display: grid;
            grid-template-columns: auto 28px 28px;
            border: 2px solid cadetblue;
            border-radius: 4px;
            line-height: 28px;
            padding: 1px 4px;
            margin-bottom: 5px;
        }

        .custom-checkbox {
            vertical-align: middle;
            margin-right: 10px;
        }

        wl-icon.warning:hover {
            color: darkred;
        }

        span.bold {
            font-weight: bold;
        }
        
        .author-container > wl-button {
            --button-padding: 5px;
            width: 28px;
        }

        .results {
            height: 400px;
            overflow-y: scroll;
        }

        #regionForm {
            padding: 5px 0px;
        }`];
    }

    open (selectedRegions : Region[]) {
        if (this.active) {
            showDialog("authorDialog", this.shadowRoot);
            this._filter = '';
            this._selected = {};
            selectedRegions.forEach((r:Region) => {
                this._selected[r.id] = true;
            });
        } else {
            setTimeout(() => {this.open(selectedRegions)}, 300);
        }
    }

    setSelected (regions) {
        this._selected = {...regions};
    }

    _onSearchChange () {
        let searchEl = this.shadowRoot.getElementById('search-input') as Textfield;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._filter = searchEl.value;
            this._searchPromise = null;
        }, 300);
    }

    _changeTab (tab: ''|'map') {
        if (this._tab != tab) {
            if (this._tab !== 'map') {
                this._selectedCategory = '';
            }
            this._tab = tab;
        }
    }

    protected render() {
        return html`
        <wl-dialog class="larger" id="authorDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                Selecting regions
            </h3>
            <div slot="content">
                <wl-tab-group align="center" value="${this._tab}">
                    <wl-tab ?checked="${this._tab === ''}" @click="${() => {this._changeTab('')}}">Search Region</wl-tab>
                    <wl-tab ?checked="${this._tab === 'map'}" @click="${() => {this._changeTab('map')}}">Map</wl-tab>
                </wl-tab-group>
                ${this._tab === '' ? this._renderSelectTab() : ''}
                ${this._tab === 'map' ? this._renderMapTab() : ''}
            </div>
            <div slot="footer">
                ${this._tab === '' ? html`
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button @click="${this._onSubmitRegions}" class="submit">Add selected regions</wl-button>
                `: ''}
                ${this._tab === 'map' ? html`
                <wl-button @click="${() => {this._changeTab('')}}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button @click="${this._onSelectRegionFromMap}" class="submit"
                    ?disabled="${this._waiting || !this._selectedMapRegion}">Add selected region</wl-button>
                `: ''}
            </div>
        </wl-dialog>
        ${renderNotifications()}`
    }

    _renderSelectTab () {
        let subregions : Region[] = Object.values(this._regions || {}).filter((region:Region) => 
            isMainRegion(region) || isSubregion(this._region.model_catalog_uri, region)
        );

        return html`
            <wl-textfield label="Search regions" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
            <div class="results" style="margin-top: 5px;">
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                ${subregions.map((region:Region) => html`
                <div class="author-container">
                    <label @click="${() => {this._toggleSelection(region)}}">
                        <wl-icon class="custom-checkbox">${this._selected[region.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                        <span class="${this._selected[region.id] ? 'bold' : ''}">${region.label ? region.label : region.id}</span>
                    </label>
                    <wl-button flat inverted disabled><wl-icon>edit</wl-icon></wl-button>
                    <wl-button @click="${() => this._delete(region)}" flat inverted><wl-icon class="warning">delete</wl-icon></wl-button>
                </div>
                `)}
            </div>`
    }

    _renderMapTab () {
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

    _onRegionCategoryChange () {
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

    _onSelectRegionFromMap () {
        this._waiting = true;
        let selected = this._selectedMapRegion;
        let newRegion : Region = {
            label: [selected.name],
            type: ["Region"],
            partOf: [{id: this._region.model_catalog_uri}],
            //TODO: description: [""],
            geo: [{
                label: ["Bounding box for " + selected.name],
                box: [selected.bounding_box.xmin + ',' + selected.bounding_box.ymin + ' '
                    + selected.bounding_box.xmax + ',' + selected.bounding_box.ymax ],
                type: ["GeoShape"]
            }]
        }
        let postProm = store.dispatch(regionPost(newRegion));
        
        postProm.then((region) => {
            this._waiting = false;
            this._selected[region.id] = true;
            this._changeTab('');
        });
        postProm.catch((error) => {
            this._waiting = false;
        })
    }

    _toggleSelection (region:Region) {
        this._selected[region.id] = !this._selected[region.id];
        this.requestUpdate();
    }

    _onEditRegions () {
        //TODO
    }

    _onSubmitRegions () {
        let selectedRegions : Region[] = Object.values(this._regions).filter((region:Region) => this._selected[region.id])

        this.dispatchEvent(new CustomEvent('regionsSelected', {composed: true, detail: selectedRegions}));
        hideDialog("authorDialog", this.shadowRoot);
    }

    _cancel () {
        this._filter = '';
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        hideDialog("authorDialog", this.shadowRoot);
    }

    _delete (region: Region) {
        if (confirm('This Region will be deleted on all related resources')) {
            store.dispatch(regionDelete(region));
            if (this._selected[region.id])
                delete this._selected[region.id];
        }
    }

    firstUpdated () {
        store.dispatch(regionsGet());
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._regions = db.regions;
            super.setRegion(state);
            if (this._regionid && this._region) {
                let sr = state.regions.sub_region_ids;
                if (sr && sr[this._regionid]) {
                    this._mapRegions = sr[this._regionid].map((regionid) => state.regions.regions[regionid]);
                }
            }
        }
    }
}
