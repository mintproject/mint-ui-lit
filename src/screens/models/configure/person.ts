import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { personGet, personsGet, personPost, personPut, ALL_PERSONS } from 'model-catalog/actions';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'

let identifierId : number = 1;

@customElement('models-configure-person')
export class ModelsConfigurePerson extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _new : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _persons : {[key:string]: Person} = {};

    @property({type: String})
    private _filter : string = '';

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _waitingFor : string = '';

    @property({type: Object})
    private _selected : {[key:string]: Person | undefined} = {};

    @property({type: String})
    private _selectedPersonId: string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .author-container {
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
        
        .author-container > wl-button {
            --button-padding: 5px;
        }

        .results {
            height: 400px;
            overflow-y: scroll;
        }
        `,
        ];
    }

    open () {
        if (this.active) {
            showDialog("authorDialog", this.shadowRoot);
        } else {
            setTimeout(() => {this.open()}, 300);
        }
    }

    setSelected (persons) {
        this._selected = {...persons};
    }

    getSelected () {
        return Object.keys(this._selected).filter(personId => this._selected[personId]).map(personId => this._persons[personId]);
    }

    protected render() {
        let selectedPerson = this._persons[this._selectedPersonId];
        return html`
        <wl-dialog class="larger" id="authorDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._new ? 'Register a new person' : (selectedPerson ? 'Editing person' : 'Selecting authors')}
            </h3>
            <div slot="content">
                ${this._new ? html`
                <form>
                    <wl-textfield id="new-author-name" label="Name" required></wl-textfield>
                    <wl-textfield id="new-author-email" label="E-mail" required></wl-textfield>
                    <wl-textfield id="new-author-web" label="Website"></wl-textfield>
                </form>`
                : (selectedPerson ? html`
                <form>
                    <wl-textfield value="${selectedPerson.label ? selectedPerson.label : ''}"
                        id="edit-author-name" label="Name" required></wl-textfield>
                    <wl-textfield value="${selectedPerson.email ? selectedPerson.email : ''}"
                        id="edit-author-email" label="E-mail" required></wl-textfield>
                    <wl-textfield value="${selectedPerson.website ? selectedPerson.website : ''}"
                        id="edit-author-web" label="Website" ></wl-textfield>
                </form> `
                : html`
                <wl-textfield label="Search persons" .value="${this._filter}"><wl-icon slot="after">search</wl-icon></wl-textfield>
                <div class="results" style="margin-top: 5px;">
                    ${Object.values(this._persons).map((person) => html`
                    <div class="author-container">
                        <label @click="${() => {this._toggleSelection(person.id)}}">
                            <wl-icon class="custom-checkbox">${this._selected[person.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                            <span class="${this._selected[person.id] ? 'bold' : ''}">${person.label ? person.label : person.id}</span>
                        </label>
                        <wl-button @click="${() => this._edit(person.id)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    </div>
                `)}
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                </div>
                or <a @click="${() => {this._new = true;}}">create a new Person</a>
            `)}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                ${this._new ? html`
                <wl-button @click="${this._onCreateAuthor}" class="submit" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : (selectedPerson ? html`
                <wl-button @click="${this._onEditAuthor}" class="submit" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : html`
                <wl-button @click="${this._onSubmitAuthors}" class="submit">Add selected authors</wl-button>`
                )}
            </div>
        </wl-dialog>`
    }

    _toggleSelection (personId) {
        this._selected[personId] = !this._selected[personId];
        this.requestUpdate();
    }

    _onCreateAuthor () {
        let nameEl = this.shadowRoot.getElementById('new-author-name')
        let emailEl = this.shadowRoot.getElementById('new-author-email')
        let webEl = this.shadowRoot.getElementById('new-author-web')
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

            let newPerson : Person = {
                email: [email],
                label: [name],
            }
            if (web) newPerson.website = web;

            this._waitingFor = 'PostPerson' + identifierId;
            identifierId += 1;
            store.dispatch(personPost(newPerson, this._waitingFor));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditAuthor () {
        let nameEl = this.shadowRoot.getElementById('edit-author-name')
        let emailEl = this.shadowRoot.getElementById('edit-author-email')
        let webEl = this.shadowRoot.getElementById('edit-author-web')
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

            let editedPerson : Person = Object.assign({}, this._persons[this._selectedPersonId])
            editedPerson.label = [name];
            editedPerson.email = [email];
            if (web) editedPerson.website = [web];

            this._waitingFor = editedPerson.id;
            store.dispatch(personPut(editedPerson));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onSubmitAuthors () {
        this.dispatchEvent(new CustomEvent('authorsSelected', {composed: true}));
        hideDialog("authorDialog", this.shadowRoot);
    }

    _cancel () {
        if (this._new) {
            this._new = false;
        } else if (this._selectedPersonId) {
            this._selectedPersonId = '';
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("authorDialog", this.shadowRoot);
        }
    }

    _edit (personId) {
        this._selectedPersonId = personId;
    }

    firstUpdated () {
        store.dispatch(personsGet());
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._loading = db.loading[ALL_PERSONS]
            this._persons = db.persons;
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
                        this._selectedPersonId = '';
                        this._waitingFor = '';
                    }
                }
            }
        }
    }
}
