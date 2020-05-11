import { property, html, customElement, css } from 'lit-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { IdMap } from "app/reducers";

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { timeIntervalGet, timeIntervalsGet, timeIntervalPost, timeIntervalPut, timeIntervalDelete } from 'model-catalog/actions';

import { renderExternalLink } from '../util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import 'components/loading-dots'
import { TimeInterval, Unit } from '@mintproject/modelcatalog_client';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

/************/
import { LitElement } from 'lit-element';
import { getId, getLabel } from 'model-catalog/util';
interface BaseResources {
    id?: string;
    label?: string[];
}

enum Action {
    NONE, SELECT, MULTISELECT
}

@customElement('model-catalog-resource')
export class ModelCatalogResource<T extends BaseResources> extends LitElement {
    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        #select-button {
            border: 1px solid gray;
            margin-right: 5px;
            --button-padding: 4px;
            float: right;
        }

        .list-item {
            display: grid !important;
            margin: 2px 0px !important;
            grid-template-columns: auto 58px;
            align-items: center;
        }

        .list-item.no-buttons {
            grid-template-columns: auto !important;
        }

        .clickable-area {
            display: grid;
            grid-template-columns: 30px auto;
            align-items: center;
            overflow: hidden;
            cursor:pointer;
        }

        .buttons-area {
            display: inline-block;
        }

        .buttons-area > wl-button {
            --button-padding: 5px;
        }

        .custom-radio {
            width: 28px;
            line-height: 1.5em;
        }

        wl-icon.warning:hover {
            color: darkred;
        }

        span.bold {
            font-weight: bold;
        }

        .resources-list {
            height: 400px;
            overflow-y: scroll;
        }`,
        ];
    }

    // Resources 
    protected _loadedResources : IdMap<T> = {} as IdMap<T>;
    @property({type: Object}) protected _loading : IdMap<boolean> = {};
    @property({type: Boolean}) protected _allResourcesLoaded : boolean = false;
    @property({type: Boolean}) protected _allResourcesLoading : boolean = false;
    @property({type: String}) protected _selectedResourceId : string = "";
    protected _selectedResources : IdMap<boolean> = {};

    // FLAGS
    @property({type: String}) private _action : Action = Action.NONE;
    @property({type: Boolean}) public inline : boolean = true;
    @property({type: Boolean}) private _dialogOpen : boolean = false;

    @property({type: Object}) protected _resources : T[] = [] as T[];

    @property({type: String}) protected _textFilter : string = "";

    protected classes : string = "resource";
    protected name : string = "resource";
    protected pname : string = "resources";
    protected resourcesGet;
    protected resourceGet;

    public unsetAction () {
        this._action = Action.NONE;
    }

    public setActionSelect () {
        this._action = Action.SELECT;
    }

    public setActionMultiselect () {
        this._action = Action.MULTISELECT;
    }

    protected render() {
        //console.log('Render', this.pname + ':', this._resources);
        return html`
            ${this.inline ? this._renderInline() : this._renderTable()}
            ${this._renderDialog()}
        `;
    }

    private _renderInline () {
        return html`
        <div style="position: relative">
            ${(this._action === Action.SELECT || this._action === Action.MULTISELECT) ? html`
                <wl-button @click="${this._showEditSelectionDialog}" id="select-button" flat inverted>
                    <wl-icon>edit</wl-icon>
                </wl-button>`
                : ''
            }
            ${this._resources.length == 0 ?
                this._renderEmpty()
                : this._resources.map((r:T) => this._renderStatus(r))
            }
        </div>`;
    }

    private _renderTable () {
    }

    private _renderDialog () {
        return html`
        <wl-dialog class="larger" id="resource-dialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                Select ${this.pname}
            </h3>
            ${this._dialogOpen ? html `
                <div slot="content">
                    ${this._renderSearchOnList()}
                    ${(this._action === Action.SELECT || this._action === Action.MULTISELECT) ?
                            this._renderSelectList() : '' }
                </div>
                <div slot="footer">
                    <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat ?disabled="">
                        Cancel
                    </wl-button>
                    <wl-button class="submit" ?disabled="" @click="${this._onSelectButtonClicked}">
                        Select
                        <loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>
                    </wl-button>
                </div>` 
            : ''}
        </wl-dialog>`
    }

    protected _renderEmpty () {
        return 'No ' + this.name;
    }

    private _renderStatus (r:T) {
        return html`<span class="${this.classes}"> 
            ${this._loading[r.id] ? 
                html`${getId(r)} <loading-dots style="--width: 20px"></loading-dots>` //TODO: error handling here...
                : this._renderResource(this._loadedResources[r.id])}
        </span>`
    }

    protected _renderResource (r:T) {
        return html`${getLabel(r)}`;
    }

    private _renderSearchOnList () {
        return html`
            <wl-textfield label="Search ${this.pname}" @input="${this._onSearchChange}" id="search-input">
                <wl-icon slot="after">search</wl-icon>
            </wl-textfield>
        `;
    }

    _searchPromise = null;
    private _onSearchChange () {
        let searchInput = this.shadowRoot.getElementById('search-input') as Textfield;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._textFilter = searchInput.value.toLowerCase();
            this._searchPromise = null;
        }, 300);
    }

    private _filterByText (r:T) {
        return this._resourceToText(r).toLowerCase().includes( this._textFilter );
    }

    protected _resourceToText (r:T) {
        return getLabel(r);
    }

    protected _renderSelectList () {
        if (!this._allResourcesLoaded && !this._allResourcesLoading) this._loadAllResources();
        // Diff between SELECT and MULTISELECT
        let checked : string = (this._action === Action.SELECT) ?
                'radio_button_checked' : 'check_box';
        let unchecked : string = (this._action === Action.SELECT) ?
                'radio_button_unchecked' : 'check_box_outline_blank';
        let isSelected : (id:string) => boolean = (this._action === Action.SELECT) ?
                (id:string) => (this._selectedResourceId === id)
                : (id:string) => (!!this._selectedResources[id]);
        let setSelected : (id:string) => void = (this._action === Action.SELECT) ?
                (id:string) => {this._selectedResourceId = id}
                : (id:string) => {
                    this._selectedResources[id] = !this._selectedResources[id];
                    this.requestUpdate();
                };

        return html`
        <div class="resources-list" style="margin-top: 5px;">
            ${(this._action === Action.SELECT) ? html`
                <span class="${this.classes} list-item no-buttons">
                    <span class="clickable-area" @click=${() => {this._selectedResourceId = '';}}>
                        <span style="display: inline-block; vertical-align: top;">
                            <wl-icon class="custom-radio">
                                ${!this._selectedResourceId ? checked : unchecked}
                            </wl-icon>
                        </span>
                        <span class="${!this._selectedResourceId ? 'bold' : ''}" style="display: inline-block;">
                            No ${this.name}
                        </span>
                    </span>
                </span>`
                :'' }
            ${this._allResourcesLoading ?
                html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                : Object.values(this._loadedResources)
                        .filter((r:T) => this._filterByText(r))
                        .map((r:T) => html`
                <span class="${this.classes} list-item">
                    <span class="clickable-area" @click="${() => setSelected(r.id)}">
                        <span style="display: inline-block; vertical-align: top;">
                            <wl-icon class="custom-radio">
                                ${isSelected(r.id) ? checked : unchecked}
                            </wl-icon>
                        </span>
                        <span class="${isSelected(r.id) ? 'bold' : ''}" style="display: inline-block;">
                            ${this._renderResource(r)}
                        </span>
                    </span>
                    <span class="buttons-area">
                        <wl-button @click="" flat inverted><wl-icon>edit</wl-icon></wl-button>
                        <wl-button @click="" flat inverted><wl-icon class="warning">delete</wl-icon></wl-button>
                    </span>
                </span>`)}
        </div>
        `;
    }

    private _closeDialog () {
        hideDialog("resource-dialog", this.shadowRoot);
        this._dialogOpen = false;
    }

    private _onSelectButtonClicked () {
        if (this._action === Action.MULTISELECT) {
            this._resources = Object.keys(this._selectedResources)
                    .filter((id:string) => this._selectedResources[id])
                    .map((id:string) => this._loadedResources[id]);
        } else if (this._action === Action.SELECT) {
            if (this._selectedResourceId) {
                this._resources = [ this._loadedResources[this._selectedResourceId] ]
            } else {
                this._resources = [];
            }
        }
        this._closeDialog();
    }

    private _showEditSelectionDialog () {
        // Set 'selected' variables and open dialog
        if (this._action === Action.MULTISELECT) {
            let selected : IdMap<boolean> = {};
            this._resources.forEach((r:T) => selected[r.id] = true);
            this._selectedResources = selected;
        } else if (this._resources.length > 0) { //ON SELECT
            this._selectedResourceId = this._resources[0].id;
        }
        this._dialogOpen = true;
        showDialog("resource-dialog", this.shadowRoot);
    }

    public setResources (r:T[]) {
        let resources : T[] = [...r];
        let shouldLoad : string[] = resources
                .map((r:T) => r.id)
                .filter((id:string) => !this._loading[id] || !this._loadedResources[id]);

        if (shouldLoad.length > 0) {
            let dbResources : IdMap<T> = this._getDBResources();
            shouldLoad.forEach((id:string) => {
                if (dbResources[id])  {
                    this._loadedResources[id] = dbResources[id];
                } else {
                    this._loading[id] = true;
                    let req = store.dispatch(this.resourceGet(id));
                    req.then((r:T) => {
                        this._loading[id] = false;
                        this._loadedResources[id] = r;
                        this.requestUpdate();
                    });
                }
            })
        }

        this._resources = resources;
    }

    protected _getDBResources () : IdMap<T> {
        return {} as IdMap<T>;
    }

    protected _loadAllResources () {
        this._allResourcesLoading = true;
        store.dispatch(this.resourcesGet()).then((resources:IdMap<T>) => {
            this._allResourcesLoading = false;
            this._loadedResources = resources;
            this._allResourcesLoaded = true;
        });
    }
}
