import { property, html, customElement, css } from 'lit-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { IdMap } from "app/reducers";

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { timeIntervalGet, timeIntervalsGet, timeIntervalPost, timeIntervalPut, timeIntervalDelete } from 'model-catalog/actions';

import { renderExternalLink } from '../util';

import { TimeInterval, Unit } from '@mintproject/modelcatalog_client';
import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/button";
import 'components/loading-dots'

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

/************/
import { LitElement } from 'lit-element';
import { getId, getLabel } from 'model-catalog/util';
interface BaseResources {
    id?: string;
    label?: string[];
    description?: string[];
}

export enum Action {
    NONE, SELECT, MULTISELECT, EDIT_OR_ADD,
}

export enum Status {
    NONE, CREATE, EDIT, CUSTOM_CREATE,
}

@customElement('model-catalog-resource')
export class ModelCatalogResource<T extends BaseResources> extends LitElement {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles()];
    }

    public static getBasicStyles () {
        return css`
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

        wl-button.edit {
            --button-padding: 5px;
            border: 1px solid grey;
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

        .striped tr:nth-child(2n-1) td {
            background-color: #f6f6f6;
        }

        .resources-list {
            height: 400px;
            overflow-y: scroll;
        }`;
    }

    // Resources 
    protected _loadedResources : IdMap<T> = {} as IdMap<T>;
    @property({type: Object}) protected _loading : IdMap<boolean> = {};
    @property({type: Boolean}) protected _allResourcesLoaded : boolean = false;
    @property({type: Boolean}) protected _allResourcesLoading : boolean = false;
    @property({type: String}) protected _selectedResourceId : string = "";
    @property({type: String}) protected _editingResourceId : string = "";
    protected _selectedResources : IdMap<boolean> = {};

    // FLAGS
    @property({type: String}) protected _action : Action = Action.NONE;
    @property({type: String}) protected _status : Status = Status.NONE;
    @property({type: Boolean}) public inline : boolean = true;
    @property({type: Boolean}) private _dialogOpen : boolean = false;
    @property({type: Boolean}) protected _waiting : boolean = false;

    @property({type: Object}) protected _resources : T[] = [] as T[];

    @property({type: String}) protected _textFilter : string = "";
    @property({type: Boolean}) protected _creationEnabled : boolean = true;
    @property({type: Boolean}) protected _editionEnabled : boolean = true;
    @property({type: Boolean}) protected _deleteEnabled : boolean = true;

    protected classes : string = "resource";
    protected name : string = "resource";
    protected pname : string = "resources";
    protected colspan : number = 2;
    protected positionAttr : string = "";
    protected resourcesGet;
    protected resourceGet;
    protected resourcePut;
    protected resourcePost;
    protected resourceDelete;
    protected _filters : ((r:T) => boolean)[] = [
        (r:T) => this._resourceToText(r).toLowerCase().includes( this._textFilter ),
    ];

    public unsetAction () {
        this._action = Action.NONE;
    }

    public setActionSelect () {
        this._action = Action.SELECT;
    }

    public setActionMultiselect () {
        this._action = Action.MULTISELECT;
    }

    public setActionEditOrAdd () {
        this._action = Action.EDIT_OR_ADD;
    }

    protected render () {
        //console.log('Render', this.pname + ':', this._resources);
        return html`
            ${this.inline ? this._renderInline() : this._renderTable()}
            <wl-dialog class="larger" id="resource-dialog" fixed backdrop blockscrolling persistent>
                ${this._dialogOpen ? this._renderDialogContent() : ''}
            </wl-dialog>
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
        let orderedResources : T[] = (this.positionAttr) ?
                this._resources.sort((r1:T, r2:T) => {
                    let lr1 : T = this._loadedResources[r1.id];
                    let lr2 : T = this._loadedResources[r2.id];
                    if (lr1 && lr2) {
                        let p1 = (lr1[this.positionAttr] && lr1[this.positionAttr].length > 0) ? lr1[this.positionAttr][0] : 0;
                        let p2 = (lr2[this.positionAttr] && lr2[this.positionAttr].length > 0) ? lr2[this.positionAttr][0] : 0;
                        return p1 - p2;
                    } 
                    return 0;
                })
                : this._resources;
        let editing : boolean = (this._action === Action.EDIT_OR_ADD);
        return html`
        <table class="pure-table striped" style="width: 100%">
            <thead>
                ${editing && this.positionAttr ? html`<th style="width:10px;"></th>` : ''}
                ${this._renderTableHeader()}
                ${editing ? html`<th style="width:10px;"></th>` : ''}
            </thead>
            ${this._resources.length > 0 ? orderedResources.map((r:T) => this._renderStatus(r)) : ''}
            ${this._action === Action.EDIT_OR_ADD ? html`
            <tr>
                <td colspan="${this.colspan + 1}" align="center">
                    <a class="clickable" @click=${this._createResource}>Add a new ${this.name}</a>
                </td>
            </tr>` : (this._resources.length == 0 ? html`
            <tr>
                <td colspan="${this.colspan + 1}" align="center">
                    ${ this._renderEmpty() }
                </td>
            </tr>` : '')}
        </table>
        `;
    }

    protected _renderTableHeader () {
        return html`
            <th><b>Label</b></th>
            <th><b>Description</b></th>
        `;
    }

    private _renderDialogContent () {
        if (this._status === Status.CREATE || this._status === Status.EDIT) {
            return this._renderFormDialog();
        } else if (this._action === Action.SELECT || this._action === Action.MULTISELECT) {
            return this._renderSelectDialog();
        }
    }

    protected _renderSelectDialog () {
        return html`
        <h3 slot="header">
            Select ${this._action === Action.SELECT ? this.name : this.pname}
        </h3>
        <div slot="content">
            ${this._renderSearchOnList()}
            ${this._renderSelectList()}
            ${this._creationEnabled ? html`
            <div>
                or <a class="clickable" @click=${this._createResource}>create a new ${this.name}</a>
            </div>
            ` : ''}
        </div>
        <div slot="footer">
            <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat ?disabled="">
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="" @click="${this._onSelectButtonClicked}">
                Select
            </wl-button>
        </div>`;
    }

    protected _renderEmpty () {
        return 'No ' + this.name;
    }

    private _renderStatus (r:T) {
        if (this.inline)
            return html`<span class="${this.classes}"> 
                ${this._loading[r.id] ? 
                    html`${getId(r)} <loading-dots style="--width: 20px; margin-left: 5px;"></loading-dots>` //TODO: error handling here...
                    : this._renderResource(this._loadedResources[r.id])}
            </span>`;
        else //FIXME: colspan here could be a  b u g
            return html`<tr>
                ${this._loading[r.id] ? 
                    html`<td colspan="${this.colspan}" align="center">
                        ${getId(r)}
                        <loading-dots style="--width: 20px; margin-left: 5px;"></loading-dots>
                    </td>`
                    : html`
                    ${this._renderRow(this._loadedResources[r.id])}
                    ${this._action === Action.EDIT_OR_ADD ? html`<td>
                        <wl-button class="edit" @click="${() => this._editResource(r)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    </td>` : ''}`
                }
            </tr>`;
    }

    protected _renderResource (r:T) {
        return html`${getLabel(r)}`;
    }

    protected _renderRow (r:T) {
        return html`
            <td>${getLabel(r)}</td>
            <td>${r.description ? r.description[0] : ''}</td>
        `;
    }

    protected _renderSearchOnList () {
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
        let resourcesToShow : T[] = [];
        if (!this._allResourcesLoading) {
            resourcesToShow = Object.values(this._loadedResources);
            this._filters.forEach((filter:(r:T)=>boolean) => {
                resourcesToShow = resourcesToShow.filter(filter);
            });
        }

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
                : resourcesToShow.map((r:T) => html`
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
                        <wl-button @click="${() => this._editResource(r)}" flat inverted ?disabled="${!this._editionEnabled}">
                            <wl-icon>edit</wl-icon>
                        </wl-button>
                        <wl-button @click="${() => this._deleteResource(r)}" flat inverted ?disabled="${!this._deleteEnabled}">
                            <wl-icon class="warning">delete</wl-icon>
                        </wl-button>
                    </span>
                </span>`)}
        </div>
        `;
    }

    protected _getEditingResource () {
        if (this._status === Status.EDIT && this._editingResourceId 
            && this._loadedResources[this._editingResourceId]) {
            return this._loadedResources[this._editingResourceId];
        }
        return null;
    }

    private _renderFormDialog () {
        let edResource = this._getEditingResource();
        return html`
        <h3 slot="header">
            ${this._status === Status.CREATE ? 
                'Creating new ' + this.name
                :  'Editing resource ' + (edResource ? getLabel(edResource) : '-')}
        </h3>
        <div slot="content">
            ${this._renderForm()}
        </div>
        <div slot="footer">
            <wl-button @click="${this._clearStatus}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="${this._waiting}" @click="${this._onFormSaveButtonClicked}">
                Save
                ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
            </wl-button>
        </div>`;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        return html`
        <form>
            <wl-textfield id="resource-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="resource-desc" label="Description" required
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
        </form>`;
    }

    protected _closeDialog () {
        hideDialog("resource-dialog", this.shadowRoot);
        this._dialogOpen = false;
    }

    protected _clearStatus () {
        this._status = Status.NONE;
        this._editingResourceId = '';
        if (this._action === Action.EDIT_OR_ADD) {
            this._closeDialog();
        }
    }

    protected _onSelectButtonClicked () {
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

    protected _onFormSaveButtonClicked () {
        let resource = this._getResourceFromForm();
        if (resource && this._status != Status.NONE) {
            this._waiting = true;
            let req : Promise<T>;
            if (this._status === Status.CREATE || this._status === Status.CUSTOM_CREATE) {
                req = store.dispatch(this.resourcePost(resource));
            } else if (this._status === Status.EDIT) {
                resource.id = this._editingResourceId;
                req = store.dispatch(this.resourcePut(resource));
            }
            req.then((r:T) => {
                console.log('Promise resolved', r);
                this._waiting = false;
                this._loadedResources[r.id] = r;
                this._clearStatus();
                // TODO: display notifications
                if (this._action === Action.EDIT_OR_ADD) {
                    this._resources.push(r);
                } else if (this._action === Action.MULTISELECT) {
                    this._selectedResources[r.id] = true;
                } else if (this._action === Action.SELECT) {
                    this._selectedResourceId = r.id;
                }
            });
        }
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield  = this.shadowRoot.getElementById('resource-label') as Textfield;
        let inputDesc  : Textarea   = this.shadowRoot.getElementById('resource-desc') as Textarea;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        if (label && desc) {
            return {
                label: [label],
                description: [desc],
            } as T;
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
        }
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

    private _editResource (r:T) {
        this._editingResourceId = r.id;
        console.log('>', this._loadedResources[r.id]);
        this._status = Status.EDIT;
        if (this._action === Action.EDIT_OR_ADD) {
            this._dialogOpen = true;
            showDialog("resource-dialog", this.shadowRoot);
        }
    }

    private _deleteResource (r:T) {
        if (r && confirm('This ' + this.name + ' will be deleted on all related resources')) {
            if (this._selectedResources[r.id]) this._selectedResources[r.id] = false;
            if (this._selectedResourceId === r.id) this._selectedResourceId = '';
            if (this._loadedResources[r.id]) delete this._loadedResources[r.id];
            let index : number = -1;
            this._resources.forEach((r2:T, i:number) => {
                if (r2.id === r.id) index = i;
            });
            if (index >= 0) {
                this._resources.splice(index,1);
            } else {
                this.requestUpdate();
            }
            store.dispatch(this.resourceDelete(r)).then(() => {
                //TODO: display notification;
            });
        }
    }

    protected _createResource () {
        this._status = Status.CREATE;
        if (this._action === Action.EDIT_OR_ADD) {
            this._dialogOpen = true;
            showDialog("resource-dialog", this.shadowRoot);
        }
    }

    public setResources (r:T[]) {
        if (!r || r.length === 0) {
            this._resources = [];
            return;
        }
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

    public getResources () {
        return this._resources;
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
