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
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'
import { Parameter } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

let identifierId : number = 1;

@customElement('models-configure-parameter')
export class ModelsConfigureParameter extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _new : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _parameters : {[key:string]: Parameter} = {};

    @property({type: String})
    private _filter : string = '';

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _waitingFor : string = '';

    @property({type: Object})
    private _selected : {[key:string]: boolean | undefined} = {};

    @property({type: String})
    private _selectedParameterUri: string = '';

    @property({type: Boolean})
    public onSetup : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .parameter-container {
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
        
        .parameter-container > wl-button {
            --button-padding: 5px;
            width: 28px;
        }

        .results {
            height: 400px;
            overflow-y: scroll;
        }
        `,
        ];
    }

    edit (parameterID) {
        if (this.active) {
            this._selectedParameterUri = parameterID
            showDialog("parameterDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.edit(parameterID)}, 300);
        }
    }

    open () {
        if (this.active) {
            showDialog("parameterDialog", this.shadowRoot);
            this._filter = '';
        } else {
            setTimeout(() => {this.open()}, 300);
        }
    }

    setSelected (parameters) {
        this._selected = {...parameters};
    }

    getSelected () {
        return Object.keys(this._selected).filter(parameterId => this._selected[parameterId]).map(parameterId => this._parameters[parameterId]);
    }

    _searchPromise = null;
    _onSearchChange () {
        let searchEl = this.shadowRoot.getElementById('search-input') as Textfield;;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._filter = searchEl.value;
            console.log(searchEl.value);
            this._searchPromise = null;
        }, 300);
    }

    protected render() {
        let selectedParameter = this._parameters && this._selectedParameterUri ? this._parameters[this._selectedParameterUri] : null;
        let inputType : string = 'text';
        if (selectedParameter && selectedParameter.hasDataType && selectedParameter.hasDataType.length > 0) {
            switch (selectedParameter.hasDataType[0]) {
                case 'float':
                case 'int':
                    inputType = 'number';
                    break;
                default:
                    inputType = 'text';
            }
        }
        return html`
        <wl-dialog class="larger" id="parameterDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${selectedParameter ? 'Editing parameter' : 'Register a new parameter'}
            </h3>
            <div slot="content">
                ${selectedParameter ? html`
                <wl-title level="4">${selectedParameter.description}</wl-title>
                ${renderParameterType(selectedParameter)}
                <form>
                    <wl-textfield 
                        type="${inputType}"
                        min="${ selectedParameter.hasMinimumAcceptedValue ? selectedParameter.hasMinimumAcceptedValue[0] : ''}"
                        max="${ selectedParameter.hasMaximumAcceptedValue ? selectedParameter.hasMaximumAcceptedValue[0] : ''}"
                        id="edit-parameter-fixed-value" label="${selectedParameter.label}"
                        value="${selectedParameter.hasFixedValue? selectedParameter.hasFixedValue: ''}"
                        placeholder="${selectedParameter.hasDefaultValue}" required>
                        <span slot="after">${selectedParameter.usesUnit ?(selectedParameter.usesUnit[0] as any).label : ''}</span>
                    </wl-textfield>
                </form> ` : html`
                <form>
                    <wl-textfield id="new-parameter-name" label="Name" required></wl-textfield>
                </form>`
                }
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                ${this._new ? html`
                <wl-button @click="${this._onCreateParameter}" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : (selectedParameter ? html`
                <wl-button @click="${this._onEditParameter}" ?disabled="${this._waiting}">
                    Save ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : html`
                <wl-button @click="${this._onSubmitParameters}">Add selected parameters</wl-button>`
                )}
            </div>
        </wl-dialog>
        ${renderNotifications()}`
    }

    _toggleSelection (parameterId) {
        this._selected[parameterId] = !this._selected[parameterId];
        this.requestUpdate();
    }

    _onCreateParameter () {
        let nameEl = this.shadowRoot.getElementById('new-parameter-name') as Textfield;
        let emailEl = this.shadowRoot.getElementById('new-parameter-email') as Textfield;
        let webEl = this.shadowRoot.getElementById('new-parameter-web') as Textfield;
        if (nameEl && emailEl && webEl) {
            let name = nameEl.value;
            let email = emailEl.value;
            let web = webEl.value;
            if (!name || !email) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>emailEl).refreshAttributes();
                return;
            }

            let newParameter : Parameter = {
                //email: [email],
                label: [name],
            }
            //if (web) newParameter.website = web;

            this._waitingFor = 'PostParameter' + identifierId;
            identifierId += 1;
            store.dispatch(parameterPost(newParameter, this._waitingFor));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditParameter () {
        let fixedValEl = this.shadowRoot.getElementById('edit-parameter-fixed-value') as Textfield;
        if (fixedValEl) {
            let originalParameter : Parameter = this._parameters[this._selectedParameterUri];
            let min : number, max : number;
            if (originalParameter.hasMinimumAcceptedValue && originalParameter.hasMinimumAcceptedValue.length > 0) {
                min = Number(originalParameter.hasMinimumAcceptedValue[0]);
            }
            if (originalParameter.hasMaximumAcceptedValue && originalParameter.hasMaximumAcceptedValue.length > 0) {
                max = Number(originalParameter.hasMaximumAcceptedValue[0]);
            }
            let fixedVal = fixedValEl.value;
            if (!fixedVal || (min!=undefined && Number(fixedVal)<min) || (max!=undefined && Number(fixedVal)>max)) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>fixedValEl).refreshAttributes();
                return;
            }

            let editedParameter : Parameter = Object.assign({}, originalParameter);
            editedParameter.hasFixedValue = [fixedVal as any];
            //console.log(editedParameter)
            this.dispatchEvent(new CustomEvent('parameterEdited', {composed: true, detail: editedParameter }));
            this._cancel();
        }
    }

    _onSubmitParameters () {
        this.dispatchEvent(new CustomEvent('parametersSelected', {composed: true}));
        hideDialog("parameterDialog", this.shadowRoot);
    }

    _cancel () {
        this._filter = '';
        if (this._new) {
            this._new = false;
        } else if (this._selectedParameterUri) {
            hideDialog("parameterDialog", this.shadowRoot);
            this._selectedParameterUri = '';
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("parameterDialog", this.shadowRoot);
        }
    }

    _edit (parameterUri) {
        this._selectedParameterUri = parameterUri;
    }

    _delete (parameterUri) {
        if (confirm('This Parameter will be deleted on all related resources')) {
            store.dispatch(parameterDelete(parameterUri));
            if (this._selected[parameterUri])
                delete this._selected[parameterUri];
        }
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._loading = db.loading[ALL_PARAMETERS]
            this._parameters = db.parameters;
            if (this._waitingFor) {
                if (this._new) {
                    if (db.created[this._waitingFor]) {
                        this._waiting = false;
                        this._selected[db.created[this._waitingFor]] = true;
                        this._new = false;
                        this._waitingFor = '';
                    } else {
                        this._waiting = true;
                    }
                } else {
                    this._waiting = db.loading[this._waitingFor];
                    if (this._waiting === false) {
                        this._selected[this._waitingFor] = true;
                        this._selectedParameterUri = '';
                        this._waitingFor = '';
                    }
                }
            }
        }
    }
}
