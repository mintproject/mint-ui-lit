import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { parameterGet, parametersGet, parameterPost, parameterPut, ALL_PARAMETERS } from 'model-catalog/actions';
import { renderExternalLink, renderParameterType } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'

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
    private _selected : {[key:string]: Parameter | undefined} = {};

    @property({type: String})
    private _selectedParameterId: string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .parameter-container {
            display: grid;
            grid-template-columns: auto 28px;
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

        span.bold {
            font-weight: bold;
        }
        
        .parameter-container > wl-button {
            --button-padding: 5px;
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
            this._selectedParameterId = parameterID
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
        let searchEl = this.shadowRoot.getElementById('search-input');
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
        let selectedParameter = this._parameters[this._selectedParameterId];
        return html`
        <wl-dialog class="larger" id="parameterDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._new ? 'Register a new parameter' : (selectedParameter ? 'Editing parameter' : 'Selecting parameters')}
            </h3>
            <div slot="content">
                ${this._new ? html`
                <form>
                    <wl-textfield id="new-parameter-name" label="Name" required></wl-textfield>
                    <wl-textfield id="new-parameter-email" label="E-mail" required></wl-textfield>
                    <wl-textfield id="new-parameter-web" label="Website"></wl-textfield>
                </form>`
                : (selectedParameter ? html`
                <wl-title level="4">${selectedParameter.description}</wl-title>
                ${renderParameterType(selectedParameter)}
                <form>
                    <wl-textfield 
                        id="edit-parameter-fixed-value" label="${selectedParameter.label}"
                        value="${selectedParameter.hasFixedValue? selectedParameter.hasFixedValue: ''}"
                        placeholder="${selectedParameter.hasDefaultValue}" required>
                        <span slot="after">${selectedParameter.usesUnit ?selectedParameter.usesUnit[0].label : ''}</span>
                    </wl-textfield>
                </form> `
                : html`
                <wl-textfield label="Search parameters" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
                <div class="results" style="margin-top: 5px;">
                    ${Object.values(this._parameters)
                        .filter(parameter => (parameter.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                        .map((parameter) => html`
                    <div class="parameter-container">
                        <label @click="${() => {this._toggleSelection(parameter.id)}}">
                            <wl-icon class="custom-checkbox">${this._selected[parameter.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                            <span class="${this._selected[parameter.id] ? 'bold' : ''}">${parameter.label ? parameter.label : parameter.id}</span>
                        </label>
                        <wl-button @click="${() => this._edit(parameter.id)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    </div>
                `)}
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                </div>
                or <a @click="${() => {this._new = true;}}">create a new Parameter</a>
            `)}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                ${this._new ? html`
                <wl-button @click="${this._onCreateParameter}" class="submit" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : (selectedParameter ? html`
                <wl-button @click="${this._onEditParameter}" class="submit" ?disabled="${this._waiting}">
                    Save ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : html`
                <wl-button @click="${this._onSubmitParameters}" class="submit">Add selected parameters</wl-button>`
                )}
            </div>
        </wl-dialog>`
    }

    _toggleSelection (parameterId) {
        this._selected[parameterId] = !this._selected[parameterId];
        this.requestUpdate();
    }

    _onCreateParameter () {
        let nameEl = this.shadowRoot.getElementById('new-parameter-name')
        let emailEl = this.shadowRoot.getElementById('new-parameter-email')
        let webEl = this.shadowRoot.getElementById('new-parameter-web')
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
                email: [email],
                label: [name],
            }
            if (web) newParameter.website = web;

            this._waitingFor = 'PostParameter' + identifierId;
            identifierId += 1;
            store.dispatch(parameterPost(newParameter, this._waitingFor));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditParameter () {
        let fixedValEl = this.shadowRoot.getElementById('edit-parameter-fixed-value')
        if (fixedValEl) {
            let fixedVal = fixedValEl.value;
            if (!fixedVal) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>fixedValEl).refreshAttributes();
                return;
            }

            let editedParameter : Parameter = Object.assign({}, this._parameters[this._selectedParameterId])
            editedParameter.hasFixedValue = [fixedVal];
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
        } else if (this._selectedParameterId) {
            hideDialog("parameterDialog", this.shadowRoot);
            this._selectedParameterId = '';
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("parameterDialog", this.shadowRoot);
        }
    }

    _edit (parameterId) {
        this._selectedParameterId = parameterId;
    }

    firstUpdated () {
        //store.dispatch(parametersGet());
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
                        this._selectedParameterId = '';
                        this._waitingFor = '';
                    }
                }
            }
        }
    }
}
