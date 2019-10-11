import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification } from 'util/ui_functions';

import { personGet, personsGet, personPost, personPut, ALL_PERSONS } from 'model-catalog/actions';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import 'components/loading-dots'

@customElement('models-configure-person')
export class ModelsConfigurePerson extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private new : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _persons : {[key:string]: Person} = {};

    @property({type: String})
    private _filter : string = '';

    @property({type: Object})
    selected : {[key:string]: Person | undefined} = {};

    @property({type: String})
    personToEdit : string = '';

    @property({type: Object})
    private _personToEditData : Person | null = null;

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
        
        :checked + span {
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

    protected render() {
        if (this.personToEdit) return html`
        <wl-title level="3">Editing person:</wl-title>
        <form>
            <wl-textfield id="edit-author-name" label="Name" value="${this._personToEditData.label}" required></wl-textfield>
            <wl-textfield id="edit-author-email" label="E-mail" value="${this._personToEditData.email}" required></wl-textfield>
            <wl-textfield id="edit-author-web" label="Website" value="${this._personToEditData.website}"></wl-textfield>
        </form> `

        if (this.new) return html`
        <wl-title level="3">Register a new person:</wl-title>
        <form>
            <wl-textfield id="new-author-name" label="Name" required></wl-textfield>
            <wl-textfield id="new-author-email" label="E-mail" required></wl-textfield>
            <wl-textfield id="new-author-web" label="Website"></wl-textfield>
        </form>
        or <a @click="${() => {this.new = false;}}">search and select persons</a>
        `;

        return html`
        <wl-textfield label="Search persons" .value="${this._filter}"><wl-icon slot="after">search</wl-icon></wl-textfield>
        <div class="results" style="margin-top: 5px;">
            ${Object.values(this._persons).map((person) => html`
            <div class="author-container">
                <label>
                    <input type="checkbox" .checked="${!!this.selected[person.id]}" @click="${() => {this._toggleSelection(person.id)}}">
                    <span>${person.label ? person.label : person.id}</span>
                </label>
                <wl-button flat inverted><wl-icon>edit</wl-icon></wl-button>
            </div>
            `)}
            ${this._loading ? html`
            <div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
        </div>
        <br/>
        or <a @click="${() => {this.new = true;}}">create a new Person</a>
        `
    }

    _toggleSelection (personId) {
        if (this.selected[personId]) {
            this.selected[personId] = undefined;
        } else {
            this.selected[personId] = this._persons[personId];
        }
    }

    saveNewPerson () {
        console.log('SHOULD SAVE PERSON')
    }

    /*_onNewAuthorSubmit () {
        console.log('submit')
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
                website: [web]
            }

            store.dispatch(personPost(newPerson));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }*/

    //updated () { }

    firstUpdated() {
        store.dispatch(personsGet());
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._loading = db.loading[ALL_PERSONS]
            this._persons = db.persons;
            if (this.personToEdit) {
                this._personToEditData = db.persons[this.personToEdit];
            } else {
                this._personToEditData = null;
            }
        }
    }
}
