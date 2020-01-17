import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { IdMap } from "app/reducers";

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { regionGet, regionsGet, regionPost, regionPut, regionDelete, ALL_REGIONS } from 'model-catalog/actions';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'
import { Region } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

@customElement('models-configure-region')
export class ModelsConfigureRegion extends connect(store)(PageViewElement) {
    @property({type: String})
    private _tab: '' | 'map' = '';

    @property({type: Boolean})
    private _new : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _regions : IdMap<Region> = {} as IdMap<Region>;

    @property({type: String})
    private _filter : string = '';

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _waitingFor : string = '';

    @property({type: Object})
    private _selected : IdMap<boolean> = {} as IdMap<boolean>;

    private _postId : number = 1;
    private _searchPromise : ReturnType<typeof setTimeout> | null = null;

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
        }

        .author-container {
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
        
        .author-container > wl-button {
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

    open () {
        if (this.active) {
            showDialog("authorDialog", this.shadowRoot);
            this._filter = '';
        } else {
            setTimeout(() => {this.open()}, 300);
        }
    }

    setSelected (regions) {
        this._selected = {...regions};
    }

    _onSearchChange () {
        let searchEl = this.shadowRoot.getElementById('search-input') as Textfield;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._filter = searchEl.value;
            this._searchPromise = null;
        }, 300);
    }

    protected render() {
        return html`
        <wl-dialog class="larger" id="authorDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                Selecting regions
            </h3>
            <div slot="content">
                <wl-tab-group align="center" value="${this._tab}">
                    <wl-tab ?checked="${this._tab === ''}" @click="${() => {this._tab = ''}}">Search Region</wl-tab>
                    <wl-tab ?checked="${this._tab === 'map'}" @click="${() => {this._tab = 'map'}}" disabled>Map</wl-tab>
                </wl-tab-group>
                ${this._tab === '' ? this._renderSelectTab() : ''}
                ${this._tab === 'map' ? this._renderMapTab() : ''}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button @click="${this._onSubmitAuthors}" class="submit">Add selected regions</wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`
    }

    _renderSelectTab () {
        let subregions : Region[] = Object.values(this._regions || {}).filter((region:Region) => 
            region.country &&
            region.country.length > 0 &&
            region.country.some((obj:Region) => obj.id === this._region.model_catalog_uri)
        );

        console.log(subregions);
        return html`
            <wl-textfield label="Search regions" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
            <div class="results" style="margin-top: 5px;">
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                ${subregions.map((region:Region) => html`
                <div class="author-container">
                    <label @click="${() => {this._toggleSelection(region)}}">
                        <wl-icon class="custom-checkbox">${this._selected[region.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                        <span class="${this._selected[region.id] ? 'bold' : ''}">${region.label ? region.label : region.id}</span>
                    </label>
                    <wl-button @click="${() => this._edit(region.id)}" flat inverted disabled><wl-icon>edit</wl-icon></wl-button>
                    <wl-button @click="${() => this._delete(region.id)}" flat inverted disabled><wl-icon class="warning">delete</wl-icon></wl-button>
                </div>
                `)}
            </div>`
    }

    _renderMapTab () {
        return html`
            <form>
                <wl-textfield id="new-author-name" label="Name" required></wl-textfield>
            </form>`
    }

    _toggleSelection (region:Region) {
        this._selected[region.id] = !this._selected[region.id];
        this.requestUpdate();
    }

    _onCreateAuthor () {
        /*let nameEl = this.shadowRoot.getElementById('new-author-name') as Textfield;
        if (nameEl ) {
            let name = nameEl.value;
            if (!name) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                return;
            }

            let newRegion : Region = {
                label: [name],
            }

            this._waitingFor = 'PostRegion' + this._postId;
            this._postId += 1;
            store.dispatch(regionPost(newRegion, this._waitingFor));
            showNotification("saveNotification", this.shadowRoot!);
        }*/
    }

    _onEditAuthor () {
        /*let nameEl = this.shadowRoot.getElementById('edit-author-name') as Textfield;
        if (nameEl) {
            let name = nameEl.value;
            if (!name) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                return;
            }

            let editedRegion : Region = Object.assign({}, this._regions[this._selectedRegionUri])
            editedRegion.label = [name];
            this._waitingFor = editedRegion.id;
            store.dispatch(regionPut(editedRegion));
            showNotification("saveNotification", this.shadowRoot!);
        }*/
    }

    _onSubmitAuthors () {
        let selectedRegions : Region[] = Object.values(this._regions).filter((region:Region) => this._selected[region.id])

        this.dispatchEvent(new CustomEvent('regionsSelected', {composed: true, detail: selectedRegions}));
        hideDialog("authorDialog", this.shadowRoot);
    }

    _cancel () {
        this._filter = '';
        this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
        hideDialog("authorDialog", this.shadowRoot);
    }

    _edit (regionUri) {
        //this._selectedRegionUri = regionUri;
    }

    _delete (regionUri) {
        /*if (confirm('This Region will be deleted on all related resources')) {
            store.dispatch(regionDelete(regionUri));
            if (this._selected[regionUri])
                delete this._selected[regionUri];
        }*/
    }

    firstUpdated () {
        store.dispatch(regionsGet());
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._loading = db.loading[ALL_REGIONS]
            this._regions = db.regions;
            super.setRegionId(state);
            /*if (this._waitingFor) {
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
                        this._selectedRegionUri = '';
                        this._waitingFor = '';
                    }
                }
            }*/
        }
    }
}
