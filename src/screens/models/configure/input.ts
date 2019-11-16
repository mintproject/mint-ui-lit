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

import { sampleCollectionGet, sampleResourceGet } from 'model-catalog/actions';
import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
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
                ${this._selectedInputUri ? this._renderEditInput() : this._renderNewInput()}
            </div>
            <div slot="footer">
                <wl-button type="button" @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button type="button" @click="${this._save}" ?disabled="${this._waiting}">
                    Save ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`;
    }

    _renderEditInput () {
        return html`
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
                <wl-textfield id="col-${i}-data-catalog-id" type="text" label="Data catalog identifier"
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].dataCatalogIdentifier : ''}"></wl-textfield>
                <wl-textfield id="col-${i}-url" type="url" label="URL" 
                              value="${this._sampleResources[part.id] ? this._sampleResources[part.id].value : ''}"></wl-textfield>
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <wl-button type="button" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}"
                               @click="${() => {this._toggleCollectionEdit(part.id)}}">Cancel</wl-button>
                    <wl-button type="button" ?disabled="${this._waiting}">
                        Save ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                    </wl-button>
                </div>
                ` : html`
                <div style="display: flex; justify-content: space-between;">
                    <span>
                        ${this._sampleResources[part.id] ? html`${this._sampleResources[part.id].label} <br/>
                        <a target="_blank" href="${this._sampleResources[part.id].id}">${this._sampleResources[part.id].id.split('/').pop()}</a>` : 
                            html`${part.label} <loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>`}
                    </span>
                    <span>
                        <wl-button type="button" flat inverted class="small" @click="${() => {this._toggleCollectionEdit(part.id)}}">
                            <wl-icon>edit</wl-icon>
                        </wl-button>
                    </span>
                </div>
                `}
            </fieldset>
            `) : ''}`
            : html`
            <wl-textfield id="input-data-catalog-id" type="text" label="Data catalog identifier" value="${this._input.dataCatalogIdentifier}"></wl-textfield>
            <wl-textfield id="input-url" type="url" label="URL" value="${this._input.value}"></wl-textfield>
            `}
        </form>`;
    }

    _renderNewInput () {
        return html`
        <form>
            <wl-textfield id="input-label" type="text" label="Label" value=""></wl-textfield>
            <wl-textarea id="input-description" style="font-size: 15px;" label="Description" value=""></wl-textarea>
            ${this._collection ? Array(this._collectionSize).fill(1).map((x, i) => html`
            <fieldset style="padding-top:0; border:2px solid #d9d9d9; --input-font-size: 12px;">
                <legend style="font-weight: 700; font-size: 12px; color: gray;"> File #${i+1} </legend>
                <wl-textfield id="col-${i}-label" type="text" label="Label" value=""></wl-textfield>
                <wl-textarea  id="col-${i}-description" style="font-size: 15px;" label="Description" value=""></wl-textarea>
                <wl-textfield id="col-${i}-data-catalog-id" type="text" label="Data catalog identifier" value=""></wl-textfield>
                <wl-textfield id="col-${i}-url" type="url" label="URL" value=""></wl-textfield>
            </fieldset>`) : html`
            <wl-textfield id="input-data-catalog-id" type="text" label="Data catalog identifier" value=""></wl-textfield>
            <wl-textfield id="input-url" type="url" label="URL" value=""></wl-textfield>
            `}
        </form>`;
    }

    newInput () {
        if (this.active) {
            showDialog("inputDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.newInput()}, 300);
        }
    }

    edit (inputID) {
        if (this.active) {
            this._selectedInputUri = inputID;
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
            setTimeout(() => {this.edit(inputID)}, 300);
        }
    }

    editCollection (inputID) {
        if (this.active) {
            this._selectedInputUri = inputID;
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
            setTimeout(() => {this.editCollection(inputID)}, 300);
        }
    }

    _toggleCollectionEdit (inputID) {
        this._collectionEdit[inputID] = !this._collectionEdit[inputID];
        this.requestUpdate();
    }

    _cancel () {
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        hideDialog("inputDialog", this.shadowRoot);
        if (this._selectedInputUri) {
            this._selectedInputUri = '';
        }
    }

    _save () {
        if (this._selectedInputUri) {
            this._onEditInput();
        } else {
            this._onCreateInput();
        }
    }

    _onCreateInput () {
        console.log('trying to create a new input: not implemented yet.')
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }

    _onEditInput () {
        let labelEl = this.shadowRoot.getElementById('ds-label') as Textfield;
        let descriptionEl = this.shadowRoot.getElementById('ds-description') as Textfield;

        if (labelEl && descriptionEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            let editedInput = Object.assign({}, this._input);
            if (!label || !description) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>descriptionEl).refreshAttributes();
                return;
            }

            editedInput.label = [label];
            editedInput.description = [description];
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
