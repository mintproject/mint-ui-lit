import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { processGet, processesGet, processPost, processPut, processDelete } from 'model-catalog/actions';
import { Process, ProcessFromJSON } from '@mintproject/modelcatalog_client';
import { IdMap } from "app/reducers";

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-process')
export class ModelCatalogProcess extends connect(store)(ModelCatalogResource)<Process> {

    protected classes : string = "resource process";
    protected name : string = "process";
    protected pname : string = "processs";
    protected resourcesGet = processesGet;
    protected resourceGet = processGet;
    protected resourcePost = processPost;
    protected resourcePut = processPut;
    protected resourceDelete = processDelete;

    private _selectedInfluencers : IdMap<boolean> = {};
    private _lastId : string = '';

    protected _renderForm () {
        let edResource = this._getEditingResource();
        if (edResource && edResource.id != this._lastId) {
            this._textFilter = "";
            this._selectedInfluencers = {};
            (edResource.influences || []).forEach((r:Process) => this._selectedInfluencers[r.id] = true);
            this._lastId = edResource.id;
        }
        let resourcesToShow : Process[] = [];
        if (!this._allResourcesLoading) {
            resourcesToShow = Object.values(this._loadedResources);
            this._filters.forEach((filter:(r:Process)=>boolean) => {
                resourcesToShow = resourcesToShow.filter(filter);
            });
        }
        // FIXME: this could work but influencers can be Variable Presentation. :-/
        return html`
        <form>
            <wl-textfield id="process-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="process-desc" label="Description"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <fieldset style="border-radius: 5px; border: 2px solid #D9D9D9">
                <legend style="font-weight: bold; font-size: 12px; color: gray;">
                    Process influencers
                </legend>
                ${this._renderSearchOnList()}
                ${this._allResourcesLoading ?
                    html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                    : html`<div style="max-height: 300px; overflow-y: scroll">${
                        resourcesToShow.map((r:Process) => html`
                        <span class="${this.classes} list-item">
                            <span class="clickable-area" @click="${() => {
                                        this._selectedInfluencers[r.id] = !this._selectedInfluencers[r.id];
                                        this.requestUpdate();
                                }}">
                                <span style="display: inline-block; vertical-align: top;">
                                    <wl-icon class="custom-radio">
                                        ${this._selectedInfluencers[r.id] ? 'check_box' : 'check_box_outline_blank'}
                                    </wl-icon>
                                </span>
                                <span class="${this._selectedInfluencers[r.id] ? 'bold' : ''}" style="display: inline-block;">
                                    ${this._renderResource(r)}
                                </span>
                            </span>
                        </span>`
                    )}</div>`
                }
            </fieldset>
        </form>`;
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('process-label') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById('process-desc') as Textarea;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        if (label) {
            let jsonRes = {
                type: ["Process"],
                label: [label],
            };
            if (desc) jsonRes['description'] = [desc];
            let influencers : Process[] = Object.keys(this._selectedInfluencers)
                    .filter((id:string) => this._selectedInfluencers)
                    .map((id:string) => this._loadedResources[id]);
            if (influencers.length > 0)
                jsonRes['influences'] = influencers
            return ProcessFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.processes;
    }
}
