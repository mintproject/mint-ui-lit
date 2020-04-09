import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { IdMap } from 'app/reducers';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { sampleCollectionGet, sampleResourceGet, sampleResourcePut } from 'model-catalog/actions';
import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/textarea";
import "weightless/dialog";
import "weightless/tab";
import "weightless/tab-group";
import 'components/loading-dots'
import { DatasetSpecification, SampleResource, SampleCollection } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

let identifierId : number = 1;

@customElement('models-configure-input')
export class ModelsConfigureInput extends connect(store)(PageViewElement) {
    @property({type: String})
    private _selectedInputUri: string = '';

    @property({type: String})
    private _selectedDatasetSpecificationUri: string = '';

    @property({type: Object})
    private _input : SampleResource | SampleCollection | null = null;

    @property({type: Boolean})
    private _collection : boolean = false;

    @property({type: Boolean})
    private _collectionSize : number = 1;

    @property({type: Object})
    private _collectionEdit : IdMap<boolean> = {} as IdMap<boolean>;

    @property({type: Object})
    private _sampleResources : IdMap<SampleResource> = {} as IdMap<SampleResource>;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _waitingFor : string = '';

    private _sampleResourcesLoading : Set<string> = new Set();

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
        }`];
    }

    protected render() {
        return html`
        <wl-dialog class="larger" id="inputDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header" style="margin-bottom: 6px;">
                ${this._selectedInputUri ? 'Editing input file' : 'Adding new input file'}
            </h3>
            <div slot="content">
                <wl-tab-group align="center" value="${this._collection}">
                    <wl-tab ?checked="${!this._collection}" @click="${() => {this._collection = false}}" ?disabled="${this._selectedInputUri}">Single file</wl-tab>
                    <wl-tab ?checked="${this._collection}" @click="${() => {this._collection = true}}" ?disabled="${this._selectedInputUri}">Collection</wl-tab>
                </wl-tab-group>

        ${this._input ? html`
        <form>
            <wl-textfield id="input-label" type="text" label="Label" value="${this._input.label}"></wl-textfield>
            <wl-textarea id="input-description" style="font-size: 15px;" label="Description" value="${this._input.description}"></wl-textarea>
            ${this._collection ? html`
            ${(this._input as SampleCollection).hasPart && (this._input as SampleCollection).hasPart.length > 0 ?
            (this._input as SampleCollection).hasPart.map((part, i) => html`
            <fieldset style="padding-top:0; border:2px solid #d9d9d9; --input-font-size: 12px;">
                <legend style="font-weight: 700; font-size: 12px; color: gray;"> File #${i+1} </legend>
                ${this._collectionEdit[part.id] ? html`
                <wl-textfield id="col-${i}-label" type="text" label="Label" 
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].label : ''}"></wl-textfield>
                <wl-textarea  id="col-${i}-description" style="font-size: 15px;" label="Description" 
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].description : ''}"></wl-textarea>
                <wl-textfield id="col-${i}-data-catalog-id" type="text" label="Data catalog identifier (optional)"
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].dataCatalogIdentifier : ''}"></wl-textfield>
                <wl-textfield id="col-${i}-url" type="url" label="URL" 
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].value : ''}"></wl-textfield>
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <wl-button type="button" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}"
                               @click="${() => {this._toggleCollectionEdit(part.id)}}">Cancel</wl-button>
                    <wl-button type="button" ?disabled="${this._waiting}" 
                               @click="${() => {this._editSampleResourceInCollection(this._sampleResources[part.id], i);}}">
                        Set ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                    </wl-button>
                </div>
                ` : html`
                <div style="display: flex; justify-content: space-between;">
                    <span>
                        ${this._sampleResources[part.id] ? html`
                        ${this._sampleResources[part.id].label}
                        ${this._sampleResources[part.id].value && this._sampleResources[part.id].value.length > 0 ? 
                        html`
                        <br/>
                        <a target="_blank" href="${this._sampleResources[part.id].value[0]}">
                            ${(<unknown>this._sampleResources[part.id].value[0] as string).split('/').pop()}
                        </a>` : ''}
                        ` : 
                            html`${part.id} <loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>`}
                    </span>
                    <span>
                        <wl-button type="button" flat inverted class="small" @click="${() => {this._toggleCollectionEdit(part.id)}}">
                            <wl-icon>edit</wl-icon>
                        </wl-button>
                    </span>
                </div>
                `}
            </fieldset>
            `): ''}
            ${this._selectedInputUri ? '' :  html`
            <fieldset style="padding-top:0; border:2px solid #d9d9d9; --input-font-size: 12px;">
                <legend style="font-weight: 700; font-size: 12px; color: gray;"> New file </legend>
                <wl-textfield id="col-new-label" type="text" label="Label" value=""></wl-textfield>
                <wl-textarea  id="col-new-description" style="font-size: 15px;" label="Description" value=""></wl-textarea>
                <wl-textfield id="col-new-data-catalog-id" type="text" label="Data catalog identifier (optional)" value=""></wl-textfield>
                <wl-textfield id="col-new-url" type="url" label="URL" value=""></wl-textfield>
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <wl-button type="button" @click="${this._addValueToCollection}" ?disabled="${this._waiting}"> 
                        Add ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                    </wl-button>
                </div>
            </fieldset>`}` 
            : ''}
            <wl-textfield id="input-data-catalog-id" type="text" label="Data catalog identifier (optional)" value="${this._input.dataCatalogIdentifier}"
                          style="${this._collection ? 'display: none;' : ''}"></wl-textfield>
            <wl-textfield id="input-url" type="url" label="URL" value="${this._input.value}"
                          style="${this._collection ? 'display: none;' : ''}"></wl-textfield>
        </form>`
        : html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        }

            </div>
            <div slot="footer">
                <wl-button type="button" @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button type="button" @click="${this._save}" ?disabled="${this._waiting}">
                    Set ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`;
    }

    newInput (datasetSpecificationUri: string) {
        if (this.active) {
            this._collection = false;
            this._input = {
                label: [''] as Array<string>,
                description: [''] as Array<string>,
                dataCatalogIdentifier: [''] as Array<string>,
                value: ['' as any], // value could be string, boolean, date, number, etc...
                hasPart: []
            } as SampleResource;
            this._selectedInputUri = '';
            this._selectedDatasetSpecificationUri = datasetSpecificationUri;
            showDialog("inputDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.newInput(datasetSpecificationUri)}, 300);
        }
    }

    edit (inputID: string, datasetSpecificationUri: string) {
        if (this.active) {
            this._selectedInputUri = inputID;
            this._selectedDatasetSpecificationUri = datasetSpecificationUri;
            this._collection = false;

            let state: any = store.getState();
            if (state && state.modelCatalog && state.modelCatalog.sampleResources && state.modelCatalog.sampleResources[inputID]) {
                this._input = { ...state.modelCatalog.sampleResources[inputID] };
                this._loading = false;
            } else {
                store.dispatch(sampleResourceGet(inputID));
                this._input = null;
                this._loading = true;
            }
            showDialog("inputDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.edit(inputID, datasetSpecificationUri)}, 300);
        }
    }

    editCollection (inputID: string, datasetSpecificationUri: string) {
        if (this.active) {
            this._selectedInputUri = inputID;
            this._selectedDatasetSpecificationUri = datasetSpecificationUri;
            this._collection = true;

            let state: any = store.getState();
            if (state && state.modelCatalog && state.modelCatalog.sampleCollections && state.modelCatalog.sampleCollections[inputID]) {
                let input : SampleCollection = { ...state.modelCatalog.sampleCollections[inputID] } as SampleCollection;
                if (input.hasPart && input.hasPart.length > 0) {
                    input.hasPart.forEach(sample => {
                        this._collectionEdit[sample.id] = false;
                        if (state.modelCatalog.sampleResources && state.modelCatalog.sampleResources[sample.id]) {
                            this._sampleResources[sample.id] = state.modelCatalog.sampleResources[sample.id];
                        } else {
                            this._sampleResourcesLoading.add(sample.id);
                            store.dispatch(sampleResourceGet(sample.id));
                        }
                    });
                this._input = input;
                } else {
                    this._collectionEdit = {} as IdMap<boolean>;
                }
                this._loading = false;
            } else {
                store.dispatch(sampleCollectionGet(inputID));
                this._input = null;
                this._loading = true;
            }

            showDialog("inputDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.editCollection(inputID, datasetSpecificationUri)}, 300);
        }
    }

    _editSampleResourceInCollection (sample, i:number) {
        let labelEl = this.shadowRoot.getElementById("col-" + i.toString() + "-label") as Textfield;
        let descriptionEl = this.shadowRoot.getElementById("col-" + i.toString() + "-description") as Textfield;
        let dataCatalogIdEl = this.shadowRoot.getElementById("col-" + i.toString() + "-data-catalog-id") as Textfield;
        let urlEl = this.shadowRoot.getElementById("col-" + i.toString() + "-url") as Textfield;

        if (labelEl && descriptionEl && dataCatalogIdEl && urlEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            let dataCatalogId = dataCatalogIdEl.value;
            let url = urlEl.value;
            let editedSample = { ...sample };
            if (!label || !url) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>urlEl).refreshAttributes();
                return;
            }
            editedSample.label = [label];
            editedSample.description = [description];
            editedSample.dataCatalogIdentifier = [dataCatalogId];
            editedSample.value = [url];
            this._sampleResources[editedSample.id] = editedSample;
            this._collectionEdit[editedSample.id] = false;
            this.requestUpdate();
        }
    }

    _addValueToCollection () {
        let labelEl = this.shadowRoot.getElementById("col-new-label") as Textfield;
        let descriptionEl = this.shadowRoot.getElementById("col-new-description") as Textfield;
        let dataCatalogIdEl = this.shadowRoot.getElementById("col-new-data-catalog-id") as Textfield;
        let urlEl = this.shadowRoot.getElementById("col-new-url") as Textfield;
        if (labelEl && descriptionEl && dataCatalogIdEl && urlEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            let dataCatalogId = dataCatalogIdEl.value;
            let url = urlEl.value;
            if (!label || !url) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>urlEl).refreshAttributes();
                return;
            }

            let newSample : SampleResource = {
                id: (this._input as SampleCollection).hasPart.length.toString(),
                label: [label],
                description: [description],
                value: [url as any],
                dataCatalogIdentifier: [dataCatalogId],
            };
            (this._input as SampleCollection).hasPart.push(newSample);
            this._sampleResources[newSample.id] = newSample;
            this._collectionEdit[newSample.id] = false;
            this.requestUpdate();
            labelEl.value = '';
            descriptionEl.value = '';
            dataCatalogIdEl.value = '';
            urlEl.value = '';
        }
    }

    _toggleCollectionEdit (inputID) {
        this._collectionEdit[inputID] = !this._collectionEdit[inputID];
        this.requestUpdate();
    }

    _cancel () {
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        this.shadowRoot.querySelectorAll('wl-textfield').forEach(x => x.value = '');
        this.shadowRoot.querySelectorAll('wl-textarea').forEach(x => x.value = '');
        hideDialog("inputDialog", this.shadowRoot);
        if (this._selectedInputUri) {
            this._selectedInputUri = '';
        }
    }

    _save () {
        let labelEl = this.shadowRoot.getElementById('input-label') as Textfield;
        let descriptionEl = this.shadowRoot.getElementById('input-description') as Textfield;

        if (labelEl && descriptionEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            if (!label || (this._collection && (this._input as SampleCollection).hasPart.length == 0)) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                return;
            }

            let editedInput = Object.assign({}, this._input);
            editedInput.label = [label];
            editedInput.description = [description];
            editedInput.type = ["SampleResource"];
            if (this._collection) {
                (editedInput as SampleCollection).hasPart = (this._input as SampleCollection).hasPart.map((sample) => this._sampleResources[sample.id]);
                editedInput.type.push("SampleCollection");
            } else {
                let dataCatalogIdEl = this.shadowRoot.getElementById('input-data-catalog-id') as Textfield;
                let urlEl = this.shadowRoot.getElementById('input-url') as Textfield;
                if (!urlEl.value) {
                    showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                    (<any>urlEl).refreshAttributes();
                    return;
                }
                editedInput.value = [urlEl.value as any];
                editedInput.dataCatalogIdentifier = [dataCatalogIdEl.value];
            }

            if (this._selectedInputUri) {
                this.dispatchEvent(new CustomEvent('inputEdited', {
                    composed: true,
                    detail: {input: editedInput, datasetSpecificationUri: this._selectedDatasetSpecificationUri}
                }));
            } else {
                this.dispatchEvent(new CustomEvent('inputCreated', {
                    composed: true,
                    detail: {input: editedInput, datasetSpecificationUri: this._selectedDatasetSpecificationUri}
                }));
            }
            this._cancel();
        }
    }

    _onCreateInput () {
        let labelEl = this.shadowRoot.getElementById("col-new-label") as Textfield;
        let descriptionEl = this.shadowRoot.getElementById("col-new-description") as Textfield;
        let dataCatalogIdEl = this.shadowRoot.getElementById("col-new-data-catalog-id") as Textfield;
        let urlEl = this.shadowRoot.getElementById("col-new-url") as Textfield;
        if (labelEl && descriptionEl && dataCatalogIdEl && urlEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            let dataCatalogId = dataCatalogIdEl.value;
            let url = urlEl.value;
            if (!label || !url) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>urlEl).refreshAttributes();
                return;
            }

            let newSample : SampleResource = {
                id : '',
                label: [label],
                description: [description],
                value: [url as any],
                dataCatalogIdentifier: [dataCatalogId],
            } as SampleResource;
            newSample.id  = (this._input as SampleCollection).hasPart.length.toString();
            (this._input as SampleCollection).hasPart.push(newSample);
            this._sampleResources[newSample.id] = newSample;
            this._collectionEdit[newSample.id] = false;
            this.requestUpdate();
        }
    }

    _onEditInput () {
        let labelEl = this.shadowRoot.getElementById('input-label') as Textfield;
        let descriptionEl = this.shadowRoot.getElementById('input-description') as Textfield;

        if (labelEl && descriptionEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            if (!label || (this._collection && (this._input as SampleCollection).hasPart.length > 0)) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                return;
            }

            let editedInput = Object.assign({}, this._input);
            editedInput.label = [label];
            editedInput.description = [description];
            if (this._collection) {
                (editedInput as SampleCollection).hasPart = (this._input as SampleCollection).hasPart.map((sample) => this._sampleResources[sample.id]);
            } else {
                let dataCatalogIdEl = this.shadowRoot.getElementById('input-data-catalog-id') as Textfield;
                let urlEl = this.shadowRoot.getElementById('input-url') as Textfield;
                if (!urlEl.value) {
                    showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                    (<any>urlEl).refreshAttributes();
                    return;
                }
                editedInput.value = [urlEl.value as any];
                editedInput.dataCatalogIdentifier = [dataCatalogIdEl.value];
            }

            this.dispatchEvent(new CustomEvent('inputEdited', {composed: true, detail: editedInput }));
            this._cancel();
        }
    }

    stateChanged(state: RootState) {
        if (!this._input && this._selectedInputUri) {
            if (state.modelCatalog.sampleCollections[this._selectedInputUri]) {
                let input : SampleCollection = { ...state.modelCatalog.sampleCollections[this._selectedInputUri] } as SampleCollection;
                if (input.hasPart && input.hasPart.length > 0) {
                    input.hasPart.forEach(sample => this._collectionEdit[sample.id] = false)
                } else {
                    this._collectionEdit = {} as IdMap<boolean>;
                }
                this._input = input;
                this._loading = false;
            } else if (state.modelCatalog.sampleResources[this._selectedInputUri]) {
                this._input = { ...state.modelCatalog.sampleResources[this._selectedInputUri] };
                this._loading = false;
            }  
        } else if (this._sampleResourcesLoading.size > 0) {
            this._sampleResourcesLoading.forEach((uri:string) => {
                if (state.modelCatalog.sampleResources[uri]) {
                    let tmp : IdMap<SampleResource> = { ...this._sampleResources };
                    tmp[uri] = state.modelCatalog.sampleResources[uri];
                    this._sampleResources = tmp;
                    this._sampleResourcesLoading.delete(uri);
                }
            });
        }
    }
}
