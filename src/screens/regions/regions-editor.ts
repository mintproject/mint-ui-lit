import { html, customElement, css, property, LitElement } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { queryRegions, addRegions, listTopRegions } from './actions';
import { GOOGLE_API_KEY } from 'config/google-api-key';
import { RegionList, Region } from './reducers';

import "../../thirdparty/google-map/src/google-map";
import "../../components/google-map-json-layer";

import { showDialog, hideDialog } from 'util/ui_functions';
import { GoogleMap } from '../../thirdparty/google-map/src/google-map';

@customElement('regions-editor')
export class RegionsEditor extends connect(store)(PageViewElement)  {
    @property({type: String})
    public parentRegionId: string;

    @property({type: String})
    public regionType: string;

    @property({type: Object})
    private _regions: RegionList = {};

    @property({type: Array})
    private _newregions: Array<any> = [];

    @property({type: String})
    private _geojson_nameprop : string;

    private _mapStyles = '[{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"lightness":12},{"gamma":2.15}]},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":24},{"visibility":"on"}]},{"featureType":"road.highway","stylers":[{"weight":1}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#206fff"},{"saturation":-35},{"lightness":50},{"visibility":"on"},{"weight":1.5}]}]';
    
    private _dispatched = false;

    static get styles() {
        return [
            SharedStyles,
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            .map {
                height: calc(100% - 45px);
                width: 100%;
            }
            `
        ];
    }

    protected render() {
        return html`
        <div class="cltrow">
            <wl-button flat inverted @click="${()=> goToPage('regions')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">${this.regionType} Regions</wl-title>
            </div>
            <wl-icon @click="${this._showAddRegionsDialog}" 
                class="actionIcon bigActionIcon">note_add</wl-icon>
        </div>
        ${this.regionType ? 
            html`<p>The following shows the current ${this.regionType} areas of ${this.parentRegionId}</p>` : ""}

        <!-- FIXME: Latitude, Longitude, Zoom should be automatically generated from the regions -->
        <google-map class="map" api-key="${GOOGLE_API_KEY}" 
            latitude="8" longitude="40" zoom="5" disable-default-ui="true" draggable="true"
            mapTypeId="terrain" styles="${this._mapStyles}">

            ${Object.keys(this._regions || {}).map((regionid) => {
              let region = this._regions![regionid];
              return html`
                <google-map-json-layer region_id="${region.id}" region_name="${region.name}" 
                    url="${region.geojson}" json="${region.geojson_blob}"></google-map-json-layer>
              `;
            })}
        </google-map>

        ${this._renderAddRegionsDialog()}
        `
    }

    public clearMap() {
        console.log("Clearing Map");
        let mapelement = this.shadowRoot.querySelector("google-map") as GoogleMap;
        if(mapelement && mapelement.map) {
            let map = mapelement.map;
            map.data.forEach((feature) => mapelement.map.data.remove(feature));
        }
    }

    _showAddRegionsDialog() {
        this._geojson_nameprop = null;
        this._newregions = [];
        let input:HTMLInputElement = this.shadowRoot!.querySelector<HTMLInputElement>("#geojson_file")!;
        input.value = null;

        showDialog("addRegionDialog", this.shadowRoot);
    }

    _onAddRegionsCancel() {
        hideDialog("addRegionDialog", this.shadowRoot);
    }

    _onAddRegionsSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#regionsForm")!;
        let checkboxes = form.getElementsByClassName("regionindex");
        let names = form.getElementsByClassName("regionname");
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
                    region_type: this.regionType
                } as Region;
                newregions.push(region);
            }
        }
        if(newregions.length == 0) {
            alert("Please select some/all regions to add");
            return;
        }
        
        addRegions(this.parentRegionId, newregions).then(() => {
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

    _renderAddRegionsDialog() {
        return html`
        <wl-dialog class="larger" id="addRegionDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Add Regions</h3>
            <div slot="content">
                <br />
                <form id="regionsForm">
                    <div>
                        <input type="file" id="geojson_file" name="geojson_file"
                            accept="application/json" @change=${this._onGeoJsonUpload}></input>
                        <label for="geojson_file">LOAD GEOJSON FILE</label>
                    </div>
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
                                                            newregion.properties[this._geojson_nameprop] : ''}">
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
                me._newregions = newregions;
                //console.log(me._newregions);
              };
            })(f);
            reader.readAsText(f);
        }
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        
        if(this._regionid) {
            let qr = state.regions.query_result;
            if(!qr || !qr[this._regionid] || !qr[this._regionid][this.regionType]) {
                if(!this._dispatched) {
                    this._dispatched = true;
                    store.dispatch(queryRegions(this._regionid, this.regionType));
                }
            }
            else {
                this._dispatched = false;
                this.clearMap();
                this._regions = qr[this._regionid][this.regionType];
                console.log(this._regions);
            }
        }
    }
}
