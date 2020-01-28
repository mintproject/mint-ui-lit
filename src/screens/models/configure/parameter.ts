import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { parameterGet, parametersGet, parameterPost, parameterPut, 
         parameterDelete, ALL_PARAMETERS } from 'model-catalog/actions';
import { renderExternalLink, renderParameterType } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/dialog";
import 'components/loading-dots'
import { Parameter } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

let identifierId : number = 1;

@customElement('models-configure-parameter')
export class ModelsConfigureParameter extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _fixed : boolean = false;

    @property({type: String})
    private _selectedParameterUri: string = '';

    /* Depends of _fixed and _selectedParameterUri to determine what this does.
     * If _selectedParameterUri='' we are creating a new parameter. (for new configs)
     * If  _selectedParameterUri!='' and
     *     _fixed=true: we can only edit the fixed value (for new setups and edit setups).
     *     _fixed=false: we are editing the full resource (for edit on configs)
     */
    @property({type: Object})
    private _parameter : Parameter | null = null;

    @property({type: Boolean})
    private _editDefaults : boolean = false;

    @property({type: Boolean})
    private _useRanges : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Boolean})
    private _waiting : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .checkbox {
            display: inline-block;
            cursor: pointer;
        }

        .checkbox > wl-icon {
            margin-right: 8px;
            vertical-align: middle;
        }

        .checkbox > wl-icon:after {
            content: 'check_box_outline_blank';
        }

        .checkbox > span {
            vertical-align: middle;
        }

        .checkbox[active] {
            font-weight: bold;
        }

        .checkbox[active] > wl-icon:after {
            content: 'check_box';
        }

        .min-max-input {
            display: grid;
            grid-template-columns: 25% 50% 25%;
        }

        .min-max-input.no-ranges {
            display: grid;
            grid-template-columns: 0% 100% 0%;
        }
        `];
    }

    protected render() {
        return html`
        <wl-dialog class="larger" id="parameterDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._selectedParameterUri ? 'Editing parameter' : 'Register a new parameter'}
            </h3>
            <div slot="content">
                ${this._selectedParameterUri ? (this._fixed ? this._renderEditFixedParameter() : this._renderEditParameter()) : this._renderNewParameter()}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button @click="${this._save}" ?disabled="${this._waiting}">
                    Set ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`;
    }

    _renderEditFixedParameter () {
        if (!this._parameter) {
            return html `<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        } else {
            let inputType : string = 'text';
            if (this._parameter.hasDataType && this._parameter.hasDataType.length > 0) {
                switch (this._parameter.hasDataType[0]) {
                    case 'float':
                    case 'int':
                        inputType = 'number';
                        break;
                    case 'boolean':
                        inputType = 'boolean';
                        break;
                    default:
                        inputType = 'text';
                }
            }
            return html`
            ${renderParameterType(this._parameter)}
            <form>
                <wl-textfield label="Description" id="edit-parameter-description" value="${this._parameter.description}"></wl-textfield>
                ${inputType === 'boolean' ? html`
                <wl-select id="edit-parameter-fixed-value" label="${this._parameter.label}" 
                 value="${this._parameter.hasFixedValue? this._parameter.hasFixedValue : ''}">
                    <option disabled selected>Select something</option>
                    <option value="TRUE">TRUE</option>
                    <option value="FALSE">FALSE</option>
                </wl-select>
                ` : html`
                <wl-textfield 
                    type="${inputType}"
                    min="${ this._parameter.hasMinimumAcceptedValue ? this._parameter.hasMinimumAcceptedValue[0] : ''}"
                    max="${ this._parameter.hasMaximumAcceptedValue ? this._parameter.hasMaximumAcceptedValue[0] : ''}"
                    id="edit-parameter-fixed-value" label="${this._parameter.label}"
                    value="${this._parameter.hasFixedValue? this._parameter.hasFixedValue: ''}"
                    placeholder="${this._parameter.hasDefaultValue}" required>
                    <span slot="after">${this._parameter.usesUnit ?(this._parameter.usesUnit[0] as any).label : ''}</span>
                </wl-textfield>

                <div class="checkbox" ?active="${this._editDefaults}" @click="${this._toggleEditDefaults}"
                     style="margin-top: 10px;">
                    <wl-icon></wl-icon>
                    <span>Edit configuration defauls</span>
                </div>

                <div class="min-max-input" style="display: ${this._editDefaults ? '' : 'none'}">
                    <wl-textfield
                        type="number"
                        id="edit-parameter-min-value" label="Minumum"
                        value="${ this._parameter.hasMinimumAcceptedValue ? this._parameter.hasMinimumAcceptedValue[0] : '' }">
                    </wl-textfield>
                    <wl-textfield 
                        type="number"
                        id="edit-parameter-default-value" label="Default value"
                        value="${this._parameter.hasDefaultValue}">
                    </wl-textfield>
                    <wl-textfield 
                        type="number"
                        id="edit-parameter-max-value" label="Maximum"
                        value="${ this._parameter.hasMaximumAcceptedValue ? this._parameter.hasMaximumAcceptedValue[0] : ''}">
                    </wl-textfield>
                </div>

                `}
            </form>`
        }
    }

    _renderEditParameter () {
        if (!this._parameter) {
            return html `<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
        } else {
            let inputType : string, min, max;
            if (this._parameter.hasDataType && this._parameter.hasDataType.length > 0) {
                switch (this._parameter.hasDataType[0]) {
                    case 'float':
                    case 'int':
                        inputType = 'number';
                        min = this._parameter.hasMinimumAcceptedValue ? this._parameter.hasMinimumAcceptedValue[0] : null;
                        max = this._parameter.hasMaximumAcceptedValue ? this._parameter.hasMaximumAcceptedValue[0] : null;
                        break;
                    case 'boolean':
                        inputType = 'boolean';
                        break;
                    default:
                        inputType = 'text';
                }
            }

            return html`
            <wl-title level="4">${this._parameter.description}</wl-title>
            <div style="margin-bottom: 5px;">
                <span class="monospaced">${this._parameter.label}</span>
                ${this._parameter.usesUnit ? ' (' + (this._parameter.usesUnit[0] as any).label + ')': ''}
            </div>
            <form>
                ${inputType === 'boolean' ? html`
                <wl-select id="edit-parameter-fixed-value" label="Default value" 
                 value="${this._parameter.hasDefaultValue}">
                    <option value disabled selected>Select something</option>
                    <option value="TRUE">TRUE</option>
                    <option value="FALSE">FALSE</option>
                </wl-select>
                ` : (inputType === 'number' ? 
                html`
                <div class="checkbox" ?active="${this._useRanges}" @click="${this._toggleUseRanges}">
                    <wl-icon></wl-icon>
                    <span>Use ranges</span>
                </div>

                <div class="min-max-input ${this._useRanges ? '' : 'no-ranges'}">
                    <wl-textfield
                        type="number"
                        id="edit-parameter-min-value" label="Minumum"
                        value="${min}" ?required="${this._useRanges}">
                    </wl-textfield>
                    <wl-textfield 
                        type="number" min="${min}" max="${max}"
                        id="edit-parameter-default-value" label="Default value"
                        value="${this._parameter.hasDefaultValue}" required>
                    </wl-textfield>
                    <wl-textfield 
                        type="number"
                        id="edit-parameter-max-value" label="Maximum"
                        value="${max}" ?required="${this._useRanges}">
                    </wl-textfield>
                </div>`
                : html`
                <wl-textfield 
                    type="text"
                    id="edit-parameter-fixed-value" label="Default value"
                    value="${this._parameter.hasDefaultValue}" required>
                </wl-textfield>`)}
            </form>`
        }
    }

    _renderNewParameter () {
        return html`TODO _renderNewParameter`;
    }

    _toggleUseRanges () {
        this._useRanges = !this._useRanges;
    }

    _toggleEditDefaults () {
        this._editDefaults = !this._editDefaults;
    }

    /* parameterID is the URI of the parameter to edit,
     * if fixed is true we are editing ONLY the fixedValue of this parameter.
     */
    edit (parameterID, fixed=true) {
        if (this.active) {
            this._selectedParameterUri = parameterID;
            this._fixed = fixed;
            this._editDefaults = false;

            let state: any = store.getState();
            if (state && state.modelCatalog && state.modelCatalog.parameters && state.modelCatalog.parameters[parameterID]) {
                this._parameter = { ...state.modelCatalog.parameters[parameterID] };
                this._useRanges = ((this._parameter.hasMinimumAcceptedValue &&
                                    this._parameter.hasMinimumAcceptedValue.length === 1) || (
                                    this._parameter.hasMaximumAcceptedValue &&
                                    this._parameter.hasMaximumAcceptedValue.length === 1));
                this._loading = false;
            } else {
                store.dispatch(parameterGet(parameterID));
                this._parameter = null;
                this._loading = true;
            }

            showDialog("parameterDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.edit(parameterID, fixed)}, 300);
        }
    }

    _cancel () {
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        hideDialog("parameterDialog", this.shadowRoot);
        if (this._selectedParameterUri) {
            this._selectedParameterUri = '';
            this._fixed = false;
        }
    }

    _save () {
        if (this._selectedParameterUri) {
            if (this._fixed) this._onEditFixedParameter();
            else this._onEditParameter();
        } else {
            this._onCreateParameter();
        }
    }

    _onCreateParameter () {
        console.log('trying to create a new parameter: not implemented yet.')
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }

    _onEditFixedParameter () {
        let fixedValEl = this.shadowRoot.getElementById('edit-parameter-fixed-value') as Textfield;
        let descriptionEl = this.shadowRoot.getElementById('edit-parameter-description') as Textfield;
        if (fixedValEl) {
            let fixedVal = fixedValEl.value;
            let description = descriptionEl.value;
            let min : number, max : number, def : number;
            if (this._editDefaults) {
                let defaultEl = this.shadowRoot.getElementById('edit-parameter-default-value') as Textfield;
                let minEl = this.shadowRoot.getElementById('edit-parameter-min-value') as Textfield;
                let maxEl = this.shadowRoot.getElementById('edit-parameter-max-value') as Textfield;
                if (minEl.value) min = minEl.value;
                if (maxEl.value) max = maxEl.value;
                if (defaultEl.value) def = defaultEl.value;
            } else {
                if (this._parameter.hasMinimumAcceptedValue && this._parameter.hasMinimumAcceptedValue.length > 0) {
                    min = Number(this._parameter.hasMinimumAcceptedValue[0]);
                }
                if (this._parameter.hasMaximumAcceptedValue && this._parameter.hasMaximumAcceptedValue.length > 0) {
                    max = Number(this._parameter.hasMaximumAcceptedValue[0]);
                }
            }

            if ((!fixedVal && !this._editDefaults) || (min!=undefined && Number(fixedVal)<min) || (max!=undefined && Number(fixedVal)>max)) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>fixedValEl).refreshAttributes();
                return;
            }

            let editedParameter : Parameter = Object.assign({}, this._parameter);
            editedParameter.description = [description];
            if (fixedVal) editedParameter.hasFixedValue = [fixedVal as any];
            if (this._editDefaults) {
                if (def) editedParameter.hasDefaultValue = [def as any];
                if (min) editedParameter.hasMinimumAcceptedValue = [min as any]
                if (max) editedParameter.hasMaximumAcceptedValue = [max as any]
            }
            this.dispatchEvent(new CustomEvent('parameterEdited', {composed: true, detail: editedParameter }));
            this._cancel();
        }
    }

    _onEditParameter () {
        let defaultEl = this.shadowRoot.getElementById('edit-parameter-default-value') as Textfield;
        let minEl = this.shadowRoot.getElementById('edit-parameter-min-value') as Textfield;
        let maxEl = this.shadowRoot.getElementById('edit-parameter-max-value') as Textfield;

        if (defaultEl) {
            let def = defaultEl.value;
            let editedParameter : Parameter = Object.assign({}, this._parameter);
            editedParameter.hasDefaultValue = [def as any];
            if (this._useRanges) {
                let min = minEl.value;
                let max = maxEl.value;
                if (!def || !min || !max || min > def || max < def) {
                    showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                    if (!def || min > def || max < def) (<any>defaultEl).refreshAttributes();
                    if (!min) (<any>minEl).refreshAttributes();
                    if (!max) (<any>maxEl).refreshAttributes();
                    return;
                }
                editedParameter.hasMinimumAcceptedValue = [min as any]
                editedParameter.hasMaximumAcceptedValue = [max as any]
            } else {
                if (!def) {
                    showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                    (<any>defaultEl).refreshAttributes();
                    return;
                }
            }
            this.dispatchEvent(new CustomEvent('parameterEdited', {composed: true, detail: editedParameter }));
            this._cancel();
        }
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            if (!this._parameter && db.parameters && db.parameters[this._selectedParameterUri]) {
                this._parameter = { ...db.parameters[this._selectedParameterUri] };
                this._loading = false;
            }
        }
    }
}
