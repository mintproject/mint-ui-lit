import { html, customElement, css, property, LitElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { addRegions, addSubcategory, removeSubcategory } from './actions';
import { GOOGLE_API_KEY } from 'config/google-api-key';
import { IdMap } from 'app/reducers';
import { Region } from './reducers';

import 'components/google-map-custom';
import 'weightless/progress-spinner';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog, downloadFile } from 'util/ui_functions';
import { GoogleMapCustom } from 'components/google-map-custom';
import { selectSubRegion } from 'app/ui-actions';

import "./region-models";
import "./region-datasets";
import "./region-tasks";

@customElement('regions-editor')
export class RegionsEditor extends connect(store)(PageViewElement)  {

    @property({type: String})
    public regionType: string;

    @property({type: Object})
    private _regions: Region[];

    @property({type: Object})
    private _allRegions: Region[];

    @property({type: Object})
    private _selectedRegion: Region;

    @property({type: String})
    private _cur_topregionid: string;

    @property({type: Number})
    private _cur_region_length: number;

    @property({type: String})
    private _selectedSubcategory: string = '';

    @property({type: Array})
    private _newregions: Array<any> = [];

    @property({type: Array})
    private _subcategories: Array<string> = [];

    @property({type: String})
    private _geojson_nameprop : string;

    @property({type: Boolean})
    private _mapReady: boolean = false;

    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';

    static get styles() {
        return [
            SharedStyles,
            css `
            :host {
                width: 100%;
            }

            .cltrow wl-button {
                padding: 2px;
            }

            .map {
                height: var(--map-height, calc(100% - 45px));
                width: 100%;
            }

            .desc-grid {
                display: grid;
                grid-template-columns: auto 22px;
            }

            .tab-add-icon {
                display: block;
                color: rgb(136, 142, 145);
                height: 52px;
                cursor: pointer;
            }

            .tab-add-icon > wl-icon {
                --icon-size: 34px;
                margin-bottom: 10px;
                padding: 3px 6px 4px 6px;
            }

            .tab-add-icon > wl-icon:hover {
                color: rgb(48, 74, 145);
                background: #E0E3EF;
                padding: 3px 6px 2px 6px;
                border-bottom: 2px solid rgb(48, 74, 145);
            }

            .bottom-panel {
                height: 18px;
                line-height: 18px;
                display: flex;
                justify-content:space-between;
            }

            .download-map-button > wl-icon {
                --icon-size: 16px;
                vertical-align: top;
                margin-left: 4px;
            }

            .download-map-button {
                cursor: pointer;
                padding: 0px 3px;
                border-left:10px;
            }

            .download-map-button:hover {
                background: #E0E3EF;
                color: rgb(48, 74, 145);
            }
            `
        ];
    }

	// TODO: maybe move the description text outside and move the button to other place.
    protected render() {
        return html`
        <div style="display: flex; margin-bottom: 10px;">
            <wl-tab-group align="center" style="width: 100%;">
                <wl-tab @click="${() => this._selectSubcategory('')}" checked>
                    ${this.regionType ? this.regionType : 'Base regions'}
                </wl-tab>
                ${this._subcategories.map((cat => html`
                <wl-tab @click="${() => this._selectSubcategory(cat)}">${cat}</wl-tab>
                `))}
            </wl-tab-group>
            <div class="tab-add-icon" @click="${this._showAddSubcategoryDialog}">
                <wl-icon>add</wl-icon>
                <wl-divider></wl-divider>
            </div>
        </div>

        <div class="desc-grid">
            <div style="grid-column: 1 / 2;">
            ${this.regionType && this._region ?
                ( this.regionType === 'Administrative' ? html`
                The following map shows the administrative regions in 
                ${this._region.name || this._regionid}.`
                : ( this.regionType === 'Agriculture' && this._regionid === 'ethiopia' ? html`
                The following map shows areas of interest for agriculture modeling in Ethiopia.  These are small river catchments (Level 6 Catchments) which nest smaller sub-catchment suitable for granular analysis of agricultural production.  Colors reflect the fraction of cropland per watershed with darker green reflecting no crops and red representing 80% or more crops.
                ` : html`
                The following map shows the current areas of interest for ${this.regionType ?
                this.regionType.toLowerCase() : ''} modeling in ${this._region.name || this._regionid}
				`)
                )
            : ''}
            </div>
            <div style="grid-column: 2 / 3;">
                <wl-icon @click="${this._showAddRegionsDialog}" style="float:right;"
                    class="actionIcon bigActionIcon">note_add</wl-icon>
            </div>
        </div>

        ${!this._mapReady ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : ""}
        <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" 
            .style="visibility: ${this._mapReady ? 'visible': 'hidden'}"
            disable-default-ui="true" draggable="true"
            @click="${this._handleMapClick}"
            mapTypeId="terrain" styles="${this._mapStyles}">
        </google-map-custom>

        <div class="bottom-panel">
            ${this._selectedRegion ? html`
            <span style="display: inline-block; width: auto;">
                <b>Selected region:</b>
                ${ this._selectedRegion.name }
            </span>
            <span style="display: inline-block;">
                <b>Bounding box:</b>
                ${ this._selectedRegion.bounding_box.xmin.toFixed(4) + ',' + this._selectedRegion.bounding_box.ymin.toFixed(4) }
                ${ this._selectedRegion.bounding_box.xmax.toFixed(4) + ',' + this._selectedRegion.bounding_box.ymax.toFixed(4) }
                <span class="download-map-button" @click="${this._downloadGeoJson}">
                    <b>Download</b>
                    <wl-icon style="--icon-size: 16px;">cloud_download</wl-icon>
                </span>
            </span>
            `
            : ''}
        </div>

        <br />

        <region-models class="page" ?active="${this._mapReady}" regionType="${this.regionType}"></region-models>
        <region-datasets class="page" ?active="${this._mapReady}" regionType="${this.regionType}"></region-datasets>
        <region-tasks class="page" ?active="${this._mapReady}" regionType="${this.regionType}"></region-tasks>

        <br />
        <br />

        ${this._renderAddRegionsDialog()}
        ${this._renderAddSubcategoryDialog()}
        ${renderNotifications()}`
    }

    private _selectSubcategory (category:string) {
        if (this._selectedSubcategory != category) {
            this._selectedSubcategory = category
            this.addRegionsToMap();
            store.dispatch(selectSubRegion(""));
            this._selectedRegion = null;
        }
    }

    private _downloadGeoJson () {
        downloadFile(
            this._selectedRegion.geojson_blob,
            this._selectedRegion.name.replace(/\s/, '_').toLowerCase() + '.json',
            'application/json');
    }

    public addRegionsToMap() {   
        let map = this.shadowRoot.querySelector("google-map-custom") as GoogleMapCustom;
        if(map && this._regions) {
            try {
              //map.setRegions(this._regions, this._regionid);
              if (this._selectedSubcategory == '') {
                map.setRegions(this._regions, this._regionid);
              } else {
                map.setRegions(this._allRegions.filter((region) => region.region_type == this._selectedSubcategory), this._regionid);
              }
              this._mapReady = true;
            }
            catch {
              map.addEventListener("google-map-ready", (e) => {
                map.setRegions(this._regions, this._regionid);
                this._mapReady = true;
              })
            }
        }
    }

    private _handleMapClick(ev: any) {
        if(ev.detail && ev.detail.id) {
            store.dispatch(selectSubRegion(ev.detail.id));
            this._selectedRegion = this._allRegions.filter(r => r.id === ev.detail.id)[0];
        }
    }

    _showAddRegionsDialog() {
        this._geojson_nameprop = null;
        this._newregions = [];
        let input:HTMLInputElement = this.shadowRoot!.querySelector<HTMLInputElement>("#geojson_file")!;
        input.value = null;

        showDialog("addRegionDialog", this.shadowRoot);
    }

    _showAddSubcategoryDialog() {
        let input:HTMLInputElement = this.shadowRoot!.querySelector<HTMLInputElement>("#subcategory-name")!;
        input.value = '';

        showDialog("addSubcategoryDialog", this.shadowRoot);
    }

    _onAddRegionsCancel() {
        hideDialog("addRegionDialog", this.shadowRoot);
    }

    _onAddSubcategoryCancel() {
        hideDialog("addSubcategoryDialog", this.shadowRoot);
    }

    _onAddRegionsSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionsForm")!;
        let checkboxes = form.getElementsByClassName("regionindex");
        let names = form.getElementsByClassName("regionname");
        let subcategory = this.shadowRoot!.getElementById("subcategory-selector") as HTMLInputElement;
        let regionType = subcategory.value === 'base' ? this.regionType : subcategory.value;
        let newregions = [];
        for(let i=0; i<checkboxes.length; i++) {
            let checkbox = checkboxes.item(i) as HTMLInputElement;
            let input = names.item(i) as HTMLInputElement;
            if(checkbox.checked) {
                if(!input.value) {
                    alert("Please enter all region names, or Select the geojson property to automatically fill them");
                    return;
                }
                let index = checkbox.value;
                let nregion = this._newregions[index];
                let region = {
                    geojson_blob: JSON.stringify(nregion),
                    name: input.value,
                    region_type: regionType
                } as Region;
                newregions.push(region);
            }
        }
        if(newregions.length == 0) {
            alert("Please select some/all regions to add");
            return;
        }
        
        addRegions(this._regionid, newregions).then(() => {
            hideDialog("addRegionDialog", this.shadowRoot);
        });
    }

    _selectAllCheckboxes(e: Event) {
        let all = e.target as HTMLInputElement;
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionsForm")!;
        let checkboxes = form.getElementsByClassName("regionindex");
        for(let i=0; i<checkboxes.length; i++) {
            let checkbox = checkboxes.item(i) as HTMLInputElement;
            checkbox.checked = all.checked;
        }
    }

    _onAddSubcategorySubmit() {
        let nameEl = this.shadowRoot!.getElementById('subcategory-name') as HTMLInputElement;
        let name = nameEl.value;
        if (!name) {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
            return;
        }

        let index = this._subcategories.indexOf(name);
        if (index < 0) {
            addSubcategory(this._regionid, this.regionType, name).then((value) => {
                hideDialog("addSubcategoryDialog", this.shadowRoot);
                this._subcategories.push(nameEl.value);
                this.requestUpdate();
            })
        } else {
            /*showNotification("formValuesIncompleteNotification", this.shadowRoot!);
            return;
            /* This remove the region:*/
            removeSubcategory(this._regionid, this.regionType, name).then((value) => {
                hideDialog("addSubcategoryDialog", this.shadowRoot);
                this._subcategories.splice(index, 1);
                Object.values(this._regions).filter(r => r.region_type == name).forEach(r => {
                    delete this._regions[r.id];
                });
                if (this._selectedSubcategory == name) this._selectSubcategory('');
                else this.requestUpdate();
            })
        }
    }

    _renderAddSubcategoryDialog() {
        return html`
        <wl-dialog class="larger" id="addSubcategoryDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Add ${this.regionType.toLowerCase()} category</h3>
            <div slot="content">
                <br />
                <form id="subcategoriesForm">
                    <wl-textfield id="subcategory-name" label="Subcategory name"></wl-textfield>
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onAddSubcategoryCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onAddSubcategorySubmit}" class="submit" id="dialog-submit-button">Add</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _renderAddRegionsDialog() {
        return html`
        <wl-dialog class="larger" id="addRegionDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Add ${this.regionType.toLowerCase()} regions</h3>
            <div slot="content">
                <br />
                <form id="regionsForm">
                    <wl-select label="Subcategory" id="subcategory-selector" style="margin-bottom: 1em;">
                        <option value="base" selected>Base regions</option>
                        ${this._subcategories.map((cat) => html`
                        <option value="${cat}">${cat}</option>
                        `)}
                    </wl-select>
                    <div>
                        <input type="file" id="geojson_file" name="geojson_file"
                            accept="application/json" @change=${this._onGeoJsonUpload}></input>
                        <label for="geojson_file">LOAD GEOJSON FILE</label>
                    </div>
                    ${this._newregions && this._newregions.length > 0 ? html`
                        <div style="padding: 3px;">${this._newregions.length} regions found.</div>
                    ` : ''}
                    <br />
                    ${(this._newregions && this._newregions.length > 0) ? 
                        html`
                        <div style="max-height: 400px; overflow:auto">
                        <table class="pure-table pure-table-bordered">
                            <thead>
                                <th><input type="checkbox" checked @change=${this._selectAllCheckboxes}></input></th>
                                <th>
                                    <div class="input_full">
                                        Region Name
                                        <select @change=${this._selectGeojsonNameProperty}>
                                            <option selected disabled>Select the geojson property that Identifies the Region Name</option>
                                            ${Object.keys(this._newregions[0].properties).map((propid) => {
                                                return html`<option value="${propid}">${propid}</option>`
                                            })}
                                        </select>    
                                    </div>            
                                </th>
                            </thead>
                            <tbody>
                                ${this._newregions.map((newregion, index) => {
                                    return html`
                                        <tr>
                                            <td><input type="checkbox" checked class="regionindex" value="${index}"></td>
                                            <td>
                                                <div class="input_full">
                                                    <input type="text" class="regionname"
                                                        value="${this._geojson_nameprop ? 
                                                            newregion.properties['_mint_name'] : ''}">
                                                    </input>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })}
                            </tbody>
                        </table>
                        </div>
                        ` 
                        : ""
                    }
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onAddRegionsCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onAddRegionsSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _selectGeojsonNameProperty(e: any) {
        this._geojson_nameprop = e.target.value;
        this._setMintNameProperty();
    }

    _setMintNameProperty() {
        let dupesmap = {}
        this._newregions = this._newregions.map((region) => {
            let orig_region_name = region.properties[this._geojson_nameprop];
            let new_region_name = orig_region_name;
            if(!dupesmap[orig_region_name]) {
                dupesmap[orig_region_name] = 1;
            }
            else {
                new_region_name += "_" + dupesmap[orig_region_name];
                dupesmap[orig_region_name] ++ ;
            }
            region.properties["_mint_name"]  = new_region_name;
            return region;
        })
    }    

    _onGeoJsonUpload(e : any) {
        let files = e.target.files;
        let me = this;
        if(files.length > 0) {
            let f = files[0];
            var reader = new FileReader();
            reader.onload = (function(theFile) {
              return function(eread: any) {
                let geojson = JSON.parse(eread.target.result);
                let newregions = [];
                if(geojson.type == "FeatureCollection") {
                    newregions = geojson.features;
                }
                else {
                    newregions = [ geojson ];
                }
                me._newregions = newregions.filter((region) => 
                    region.geometry && region.geometry.coordinates && region.geometry.coordinates.length > 0);
              };
            })(f);
            reader.readAsText(f);
        }
    }

    firstUpdated() {
        this.addRegionsToMap();
    }

    stateChanged(state: RootState) {
        let cur_region = this._regionid;
        super.setRegion(state);
        if (this._regionid != cur_region) {
            this._selectedSubcategory = '';
        }
        if (this._region)
            this._subcategories = this._region[this.regionType.toLowerCase() + '_subcategories'] || [];

        if(this._regionid && this._region) {
            let sr = state.regions.sub_region_ids;
            if (sr && sr[this._regionid] && 
                    (this._cur_topregionid != this._regionid || sr[this._regionid].length != this._cur_region_length)) {
                this._cur_topregionid = this._regionid;
                this._cur_region_length = sr[this._regionid].length;
                console.log("Adding regions to map");
                this._allRegions = sr[this._regionid].map((regionid) => state.regions.regions[regionid]);
                this._regions = this._allRegions.filter((region) => region.region_type == this.regionType);
                this.addRegionsToMap();
            }
        }
    }
}
