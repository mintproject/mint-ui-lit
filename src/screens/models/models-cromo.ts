import { html, customElement, css, property, LitElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { GOOGLE_API_KEY } from 'config/firebase';
import { CustomNotification } from 'components/notification';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import "weightless/expansion";

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog, downloadFile, hideNotification } from 'util/ui_functions';
import { GoogleMapCustom } from 'components/google-map-custom';
import { selectSubRegion } from 'app/ui-actions';

import { geometriesToGeoJson, geoJsonToGeometries } from 'util/geometry_functions';
import { Region } from 'screens/regions/reducers';
import { getResource, postJSONResource } from 'util/mint-requests';
import { IdNameObject, UserPreferences } from 'app/reducers';

interface CromoConfig extends IdNameObject {
    waiting?: boolean
    combos?: CromoInputsValidity[]
}
interface CromoInputsValidity {
    inputs: CromoModelInput[],
    validity: CromoValidity
}
interface CromoValidity {
    valid: boolean,
    invalidity_reasons: string[],
    validity_reasons: string[],
    recommended: boolean,
    recommendation_reasons: string[],
    non_recommendation_reasons: string[]    
}
interface CromoModelInput {
    input_id: string,
    dataset: any
}

@customElement('models-cromo')
export class ModelsCromo extends connect(store)(PageViewElement)  {

    @property({type: Object})
    protected prefs: UserPreferences | null = null;
    
    @property({type: Boolean})
    private _waiting: boolean;

    @property({type: String})
    private _scenario: string;

    @property({type: Date})
    private _start_date: Date;

    @property({type: Date})
    private _end_date: Date;

    @property({type: Array})
    private _modelconfigs: CromoConfig[] = [];

    @property({type: Object})
    private _regions: Region[];

    @property({type: String})
    private _selectedSubregionId: string;

    @property({type: Object})
    private _selectedRegion: Region;

    @property({type: String})
    private _cur_topregionid: string;

    @property({type: Number})
    private _cur_region_length: number;

    @property({type: Array})
    private _newregions: Array<any> = [];

    @property({type: Object})
    private _new_geometries: any = {};

    @property({type: Boolean})
    private _mapReady: boolean = false;

    @property({type: Boolean})
    private _mapEmpty: boolean = true;

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
                height: 400px;
                z-index: 10;
                top: -10px;
                position: sticky;
                width: 100%;
            }

            .empty-message {
                height: var(--map-height, calc(100% - 45px));
                background: #DDD;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                flex-direction: column;
                color: dimgrey;
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

            .small-loading {
                --progress-spinner-size: 30px;
                margin-left: 0px !important;
                margin-top: 0px !important;
            }

            .waiting {
                --progress-spinner-color: gray;
            }

            .tab-add-icon > wl-icon:hover {
                color: rgb(48, 74, 145);
                background: #E0E3EF;
                padding: 3px 6px 2px 6px;
                border-bottom: 2px solid rgb(48, 74, 145);
            }`
        ];
    }

    private _notification : CustomNotification;

    public constructor () {
        super();
        this._notification = new CustomNotification();
    }

	// TODO: maybe move the description text outside and move the button to other place.
    protected render() {
        return html`
        ${this._notification}
 
        <br />

        <div style="display:flex">
            <div style="min-width:440px;max-width:440px">
                <form id="cromo_form">
                    <div class="input_full">
                        <label>Scenario</label>
                    </div>
                    <div class="input_full">
                        <input name="scenario"></input>
                    </div>

                    <br /><br />
                    <div class="input_full">
                        <label>Time Period</label>
                    </div>
                    <div class="formRow">
                        <div class="input_half">
                            <input name="cromo_from" type="date"></input>
                        </div>
                        to
                        <div class="input_half">
                            <input name="cromo_to" type="date"></input>
                        </div>
                    </div>

                    <br /><br />
                    <div class="input_full">
                        <label>Region</label>
                    </div>
                    <br />
                </form>

                ${!this._mapReady ?  html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : ""}
                <google-map-custom class="map" api-key="${GOOGLE_API_KEY}" 
                    .style="visibility: ${this._mapReady? 'visible': 'hidden'}; display: ${this._mapEmpty? 'unset' : 'block'}"
                    disable-default-ui="true" draggable="true"
                    @click="${this._handleMapClick}"
                    mapTypeId="terrain" styles="${this._mapStyles}">
                </google-map-custom>

                ${this._mapReady && this._mapEmpty ? html`
                <div class="input_full">
                    Please <a @click="${this._showAddRegionsDialog}">Load a geojson</a> to specify the region.
                </div>
                ` : ''}

                <br />

                <wl-button @click="${this._onSubmitToCromo}" class="submit" id="dialog-submit-button">Search Models</wl-button>
            </div>        
            
            <div style="padding-left:20px">
                ${this._waiting ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : ""}
                ${(this._modelconfigs || []).sort((c1,c2)=>this.sortConfig(c1,c2)).map(this.renderConfigurationResult)}

                <br /><br />
                <b>Note:</b>
                CROMO queries the Model Catalog, Data Catalog and Metadata Sensing APIs 
                to find recommended models based on the scenario, region highlighted in the map, and the time period.
            </div>

        </div>

        <br />
        <br />

        ${this._renderAddRegionsDialog()}
        ${renderNotifications()}`
    }

    private sortConfig(c1, c2) {
        let valid1 : boolean = c1 && c1.combos && c1.combos.length > 0 && 
            c1.combos.some((cb) => cb.validity.valid);
        let valid2 : boolean = c2 && c2.combos && c2.combos.length > 0 && 
            c2.combos.some((cb) => cb.validity.valid);
        let recommended1 : boolean = c1 && c1.combos && c1.combos.length > 0 && 
            c1.combos.some((cb) => cb.validity.recommended);
        let recommended2 : boolean = c2 && c2.combos && c2.combos.length > 0 && 
            c2.combos.some((cb) => cb.validity.recommended);
        let empty1 = c1 && (!c1.combos || c1.combos.length == 0);
        let empty2 = c2 && (!c2.combos || c2.combos.length == 0);
        if(empty1 && !empty2) return 1
        if(empty2 && !empty1) return -1;
        if(valid1 && !valid2) return -1;
        if(valid2 && !valid1) return 1;
        if(recommended1 && !recommended2) return -1;
        if(recommended2 && !recommended1) return 1;        
        return 0;
    }

    private renderConfigurationResult(config) {
        let valid : boolean = config && config.combos && config.combos.length > 0 && 
            config.combos.some((cb) => cb.validity.valid);
        let invalid : boolean = config && config.combos && config.combos.length > 0 && 
            !config.combos.some((cb) => cb.validity.valid);
        let recommended : boolean = config && config.combos && config.combos.length > 0 && 
            config.combos.some((cb) => cb.validity.recommended);
        let non_recommended : boolean = config && config.combos && config.combos.length > 0 && 
            !config.combos.some((cb) => cb.validity.recommended);

        return html`
            <wl-expansion name="${config.combos?.length > 0 ? 'ok' : 'notok'}" style="overflow-y: hidden;">
                <span slot="title">
                    ${config.name}
                </span>
                <span slot="description" style="position: absolute; right: 60px;">
                    ${config.waiting ? 
                        html`<wl-progress-spinner class="loading small-loading"></wl-progress-spinner>` :
                        (config.combos === undefined ? 
                            html`<wl-progress-spinner class="waiting small-loading"></wl-progress-spinner>`
                            : (config.combos.length == 0 ?
                                html`<wl-icon>close</wl-icon>`
                                : (invalid ? 
                                    html`<wl-icon style="color:red">close</wl-icon>`
                                    : (valid && !recommended ? 
                                        html`<wl-icon style="color:green">close</wl-icon>`
                                        : (recommended ? html`<wl-icon style="color:green">done_all</wl-icon>`: "")
                                        )
                                )
                            )
                        )
                    }
                </span>
                ${config.combos && config.combos.length == 0 ? html`
                    <p>
                        No datasets match this configuration with the current parameters.
                    </p>
                ` : ''}
                ${(config.combos || []).map((combo) => html`
                    <p>Datasets: </p>
                    <ul>
                    ${combo.inputs.map((input) => html`
                        <li>
                            <b>${input.input_id}</b> = ${input.dataset.dataset_name}
                            <ul>
                            ${input.dataset.derived_variables.map((dv) => {
                                return html`
                                    <li style='color:grey'><i>${dv.variable_id}</i> = ${dv.value}</li>`
                            })}
                            </ul>
                            <br />
                        </li>`
                    )}
                    </ul>
                    <div>
                        <h4 .style="${combo.validity.recommended ? "color:green": (combo.validity.valid ? "color:grey": "color:red")}">
                            ${combo.validity.recommended ? "RECOMMENDED" : (combo.validity.valid ? "VALID, NOT RECOMMENDED": "INVALID")}
                        </h4>
                        <ul style="list-style-type: none">
                            ${combo.validity?.recommendation_reasons?.length > 0 ? html`
                                ${combo.validity.recommendation_reasons.map((reason) => 
                                    html`
                                        <li style='color:green'>
                                            <wl-icon style="--icon-size: 14px;color:green">done_all</wl-icon>
                                            &nbsp;
                                            ${reason}
                                        </li>
                                    `)}`
                                : ''
                            }
                            ${combo.validity?.non_recommendation_reasons?.length > 0 ? html`
                                ${combo.validity.non_recommendation_reasons.map((reason) => 
                                    html`
                                        <li style='color:grey'>
                                            <wl-icon style="--icon-size: 14px;color:gray">close</wl-icon>
                                            &nbsp;
                                            ${reason}
                                        </li>
                                    `)}`
                                :''
                            }
                            ${combo.validity?.validity_reasons?.length > 0 ? html`
                                ${combo.validity.validity_reasons.map((reason) => 
                                    html`
                                        <li style='color:grey'>
                                            <wl-icon style="--icon-size: 14px;color:green">check</wl-icon>
                                            &nbsp;
                                            ${reason}
                                        </li>
                                    `)}`
                                : ''
                            }
                            ${combo.validity?.invalidity_reasons?.length > 0 ? html`
                                ${combo.validity.invalidity_reasons.map((reason) => 
                                    html`
                                        <li style='color:red'>
                                            <wl-icon style="--icon-size: 14px;color:red">close</wl-icon>
                                            &nbsp;
                                            ${reason}
                                        </li>
                                    `)}`
                                :''
                            }
                        </ul>
                    </div>`
                )}
            </wl-expansion>
        `;
    }

    public addRegionsToMap() {   
        let map = this.shadowRoot.querySelector("google-map-custom") as GoogleMapCustom;
        if (map && this._regions) {
            if (this._regions.length > 0) {
                this._mapEmpty = false;
                try {
                    map.setRegions(this._regions, "region_0"); //FIXME: This maybe changes
                    this._mapReady = true;
                }
                catch {
                  map.addEventListener("google-map-ready", (e) => {
                    map.setRegions(this._regions, "region_0");
                    this._mapReady = true;
                  })
                }
            } else {
                this._mapEmpty = true;
            }
        }
    }

    private _handleMapClick(ev: any) {
        if(ev.detail && ev.detail.id) {
            store.dispatch(selectSubRegion(ev.detail.id));
        }
    }

    async _onSubmitToCromo() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#cromo_form");
        let scenario = (form.elements["scenario"] as HTMLInputElement).value;
        let from = (form.elements["cromo_from"] as HTMLInputElement).value;
        let to = (form.elements["cromo_to"] as HTMLInputElement).value;
        if(!this._regions || this._regions.length == 0) {
            alert("Please load a region");
            return;
        }
        if(!scenario || !from || !to) {
            alert("Please fill in all information");
            return;
        }

        let geometry = this._regions[0].geometries[0];
        let data = {
            spatial: {
                type: "Feature",
                geometry: geometry
            },
            temporal: {
                start_date: from,
                end_date: to
            }
        }

        this._waiting = true;
        let response = await fetch(this.prefs.mint.cromo_api + "/searchModels/" + scenario, { method: "post" })
        this._modelconfigs = await response.json();
        this._waiting = false;

        for(let i=0; i<this._modelconfigs.length; i++) {
            let config = this._modelconfigs[i];
            config.waiting = true;
            this.requestUpdate();
            let cname = config.id.replace(/.*\//, '')
            let response = await fetch(this.prefs.mint.cromo_api + "/validity/" + cname, 
                { method: "post", body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
            config.waiting = false;
            if(response.status == 200) {
                config.combos = await response.json();
            } else /*if (response.status == 204) TODO: some request fails, assuming empty */
                config.combos = []
            this.requestUpdate();
        }
    }

    _showAddRegionsDialog() {
        let input:HTMLInputElement = this.shadowRoot!.querySelector<HTMLInputElement>("#geojson_file")!;
        let subcategory = this.shadowRoot!.getElementById("subcategory-selector") as HTMLInputElement;
        input.value = null;
        showDialog("addRegionDialog", this.shadowRoot);
    }

    _onAddRegionsCancel() {
        hideDialog("addRegionDialog", this.shadowRoot);
    }

    _onAddRegionsSubmit() {
        let newregions = [];
        for(let i=0; i<this._newregions.length; i++) {
            let _newregion = this._newregions[i];
            let region = {
                geometries: [_newregion.geometry],
                name: "region_" + i
            } as Region;
            newregions.push(region);
        }
        if(newregions.length == 0) {
            alert("Please select some/all regions to add");
            return;
        }
        this._regions = newregions;
        this.addRegionsToMap();
        
        hideDialog("addRegionDialog", this.shadowRoot);
    }

    _renderAddRegionsDialog() {
        return html`
        <wl-dialog class="larger" id="addRegionDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Add regions</h3>
            <div slot="content">
                <br />
                <form id="regionsForm">
                    <div>
                        <input type="file" id="geojson_file" name="geojson_file"
                            accept="application/json" @change=${this._onGeoJsonUpload}></input>
                        <label for="geojson_file">LOAD GEOJSON FILE</label>
                    </div>
                    ${this._newregions && this._newregions.length > 0 ? html`
                        <div style="padding: 3px;">${this._newregions.length} regions found.</div>
                    ` : ''}
                    <br />
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onAddRegionsCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onAddRegionsSubmit}" class="submit" id="dialog-submit-button">Load Region</wl-button>
            </div>
        </wl-dialog>
        `;
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
                if (geojson.type == "FeatureCollection") {
                    newregions = geojson.features;
                } else {
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

    public clear () {
        this._selectedRegion = null;
        store.dispatch(selectSubRegion(""));
    }

    stateChanged(state: RootState) {
        let lastRegion = this._regionid;
        let lastSubregion = this._selectedSubregionId;
        let shouldUpdateRegions = false;
        super.setRegion(state);

        this.prefs = state.app.prefs!;

        if ((lastRegion && this._regionid != lastRegion) ||
            (state.app && state.app.subpage === 'home' && this._selectedRegion)) {
            this.clear();
            shouldUpdateRegions = true;
        }

        if (state.ui && state.ui.selected_sub_regionid != this._selectedSubregionId) {
            this._selectedSubregionId = state.ui.selected_sub_regionid;
            if (this._regions) {
                let rcand = this._regions.filter(r => r.id === this._selectedSubregionId)
                if (rcand.length > 0)
                    this._selectedRegion = rcand[0];
            }
        }

        if (this._regionid && this._region) {
            this._mapReady = true;
            this._regions = [];
            shouldUpdateRegions = true;
        }

        if (shouldUpdateRegions) {
            this.addRegionsToMap();
        }
    }
}
