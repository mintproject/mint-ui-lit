import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { datasetSpecificationGet, datasetSpecificationsGet, datasetSpecificationPost, datasetSpecificationPut, 
         datasetSpecificationDelete } from 'model-catalog/actions';
import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/dialog";
import 'components/loading-dots'
import { DatasetSpecification } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

let identifierId : number = 1;

@customElement('models-configure-dataset-specification')
export class ModelsConfigureDatasetSpecification extends connect(store)(PageViewElement) {
    @property({type: String})
    private _selectedDatasetSpecificationUri: string = '';

    @property({type: Object})
    private _datasetSpecification : DatasetSpecification | null = null;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Boolean})
    private _waiting : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css``];
    }

    protected render() {
        return html`
        <wl-dialog class="larger" id="datasetSpecificationDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._selectedDatasetSpecificationUri ? 'Editing dataset specification' : 'Register a new dataset specification'}
            </h3>
            <div slot="content">
                ${this._selectedDatasetSpecificationUri ? this._renderEditDatasetSpecification() : this._renderNewDatasetSpecification()}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button @click="${this._save}" ?disabled="${this._waiting}">
                    Save ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`;
    }

    _renderEditDatasetSpecification () {
        if (!this._datasetSpecification) {
            return html `<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        } else {
            let ds = this._datasetSpecification;
            console.log(ds);
            return html`
            <span>${ds.id.split('/').pop()}<span>
            <form>
                <wl-textfield id="ds-label" type="text" label="Label" value="${ds.label}"></wl-textfield>
                <wl-textarea id="ds-description" style="font-size: 15px;" label="Description" value="${ds.description}"></wl-textarea>
            </form>`;
        }
    }

    _renderNewDatasetSpecification () {
        return html`TODO _renderNewDatasetSpecification`;
    }

    edit (datasetSpecificationID) {
        if (this.active) {
            this._selectedDatasetSpecificationUri = datasetSpecificationID;

            let state: any = store.getState();
            if (state && state.modelCatalog && state.modelCatalog.datasetSpecifications && state.modelCatalog.datasetSpecifications[datasetSpecificationID]) {
                this._datasetSpecification = { ...state.modelCatalog.datasetSpecifications[datasetSpecificationID] };
                this._loading = false;
            } else {
                store.dispatch(datasetSpecificationGet(datasetSpecificationID));
                this._datasetSpecification = null;
                this._loading = true;
            }

            showDialog("datasetSpecificationDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.edit(datasetSpecificationID)}, 300);
        }
    }

    _cancel () {
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        hideDialog("datasetSpecificationDialog", this.shadowRoot);
        if (this._selectedDatasetSpecificationUri) {
            this._selectedDatasetSpecificationUri = '';
        }
    }

    _save () {
        if (this._selectedDatasetSpecificationUri) {
            this._onEditDatasetSpecification();
        } else {
            this._onCreateDatasetSpecification();
        }
    }

    _onCreateDatasetSpecification () {
        console.log('trying to create a new datasetSpecification: not implemented yet.')
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }

    _onEditDatasetSpecification () {
        let labelEl = this.shadowRoot.getElementById('ds-label') as Textfield;
        let descriptionEl = this.shadowRoot.getElementById('ds-description') as Textfield;

        if (labelEl && descriptionEl) {
            let label = labelEl.value;
            let description = descriptionEl.value;
            let editedDatasetSpecification : DatasetSpecification = Object.assign({}, this._datasetSpecification);
            if (!label || !description) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>labelEl).refreshAttributes();
                (<any>descriptionEl).refreshAttributes();
                return;
            }

            editedDatasetSpecification.label = [label];
            editedDatasetSpecification.description = [description];
            this.dispatchEvent(new CustomEvent('datasetSpecificationEdited', {composed: true, detail: editedDatasetSpecification }));
            this._cancel();
        }
    }

    stateChanged(state: RootState) {
        if (!this._datasetSpecification && this._selectedDatasetSpecificationUri && 
             state.modelCatalog.datasetSpecifications[this._selectedDatasetSpecificationUri]) {
            this._datasetSpecification = { ...state.modelCatalog.datasetSpecifications[this._selectedDatasetSpecificationUri] };
        }
    }
}
