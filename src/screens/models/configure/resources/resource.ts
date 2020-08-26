import { property, html, customElement, css } from 'lit-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { CustomNotification } from 'components/notification';
import { IdMap } from "app/reducers";
import { showDialog, hideDialog } from 'util/ui_functions';

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
            margin-top: 5px;
            height: var(--list-height, 400px);
            overflow-y: scroll;
        }
        .grab { cursor: grab; }
        .grabCursor, .grabCursor * { cursor: grabbing !important; }
        .grabbed { border: 2px solid grey; }

        #resource-dialog {
            --dialog-height: var(--dialog-height, unset);
        }

        #retry-button {
            display: inline-block;
            height: 1em;
            width: 20px;
            cursor: pointer;
        }

        .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0px 0px;
        }

        .pagination > wl-button {
            padding: 8px;
            border-radius: 4px;
        }
        `;
    }

    // Resources 
    protected _loadedResources : IdMap<T> = {} as IdMap<T>;
    protected _resourcesToEdit : IdMap<T> = {} as IdMap<T>;
    protected _resourcesToCreate : IdMap<T> = {} as IdMap<T>;
    @property({type: Object}) protected _loading : IdMap<boolean> = {};
    @property({type: Object}) protected _error : IdMap<boolean> = {};
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
    @property({type: Boolean}) protected _singleMode : boolean = false;

    @property({type: Object}) protected _resources : T[] = [] as T[];
    @property({type: Object}) protected _orderedResources : T[] = [] as T[];

    @property({type: String}) protected _textFilter : string = "";
    @property({type: Boolean}) protected _creationEnabled : boolean = true;
    @property({type: Boolean}) protected _editionEnabled : boolean = true;
    @property({type: Boolean}) protected _deleteEnabled : boolean = true;

    @property({type: Number}) protected _page : number = 0;
    public pageMax : number = -1;

    private _order : IdMap<T> = {} as IdMap<T>;
    private _notification : CustomNotification;

    public lazy : boolean = false;

    protected classes : string = "resource";
    protected name : string = "resource";
    protected pname : string = "resources";
    public colspan : number = 2;
    protected positionAttr : string = "";
    protected resourcesGet;
    protected resourceGet;
    protected resourcePut;
    protected resourcePost;
    protected resourceDelete;
    protected _filters : ((r:T) => boolean)[] = [
        (r:T) => this._resourceToText(r).toLowerCase().includes( this._textFilter ),
    ];

    public creationEnable () {
        this._creationEnabled = true;
    }

    public creationDisable () {
        this._creationEnabled = false;
    }
    
    private _singleModeInitialized : boolean = false;

    /* Must be defined */
    protected _initializeSingleMode () {
    }

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

    public setName (newName : string) {
        this.name = newName;
    }

    public constructor () {
        super();
        this._notification = new CustomNotification();
    }

    protected render () {
        //console.log('Render', this.pname + ':', this._resources, this._loadedResources);
        return html`
            ${this._singleMode ? 
                this._renderFullView() 
                : (this.inline ? 
                    this._renderInline() 
                    : this._renderTable())}
            <wl-dialog class="larger" id="resource-dialog" fixed backdrop blockscrolling persistent>
                ${this._dialogOpen ? this._renderDialogContent() : ''}
            </wl-dialog>
            ${this._notification}
        `;
    }

    private _renderFullView () {
        if (this._resources.length > 0) {
            let r : T = this._resources[0];
            if (this._loading[r.id])
                return html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
            if (this._error[r.id])
                return html`<p>
                    An error has ocurred trying to load this resource. 
                    <span @click="${() => this._forceLoad(r)}" id="retry-button">
                        <wl-icon style="position:fixed;">cached</wl-icon>
                    </span>
                </p>`;
            return html`
                ${(this._status === Status.CREATE || this._status === Status.EDIT) ? 
                    this._renderFullForm()
                    : this._renderFullResource(this._loadedResources[r.id])}
                ${this._renderActionButtons()}
            `;
        } else {
            return this._renderEmpty();
        }
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
        let displayedResources : T[] = (this.positionAttr && this._orderedResources.length > 0) ?
                this._orderedResources : this._resources;
        let editing : boolean = (this._action === Action.EDIT_OR_ADD);
        return html`
        <table class="pure-table striped" style="width: 100%">
            <thead>
                ${editing && this.positionAttr ? html`<th style="width:10px;"></th>` : ''}
                ${this._renderTableHeader()}
                ${editing ? html`<th style="width:10px;"></th>` : ''}
            </thead>
            ${this._resources.length > 0 ? displayedResources.map((r:T) => this._renderStatus(r)) : ''}
            ${this._action === Action.EDIT_OR_ADD && this._creationEnabled ? html`
            <tr class="ignore-grab">
                <td colspan="${this.positionAttr ? this.colspan +2 : this.colspan + 1}" align="center">
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
            <th><b>Name</b></th>
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
        </div>
        <div slot="footer" style="justify-content: space-between; padding: 0px 20px 20px;">
            <div>
                ${this._creationEnabled ? html`
                <wl-button @click="${this._createResource}" style="--primary-hue: 124; --button-border-radius: 3px;">
                    Create a new ${this.name}
                </wl-button>` : ''}
            </div>
            <div>
                <wl-button @click="${this._closeDialog}" style="margin-right: 5px;" inverted flat ?disabled="">
                    Cancel
                </wl-button>
                <wl-button class="submit" ?disabled="" @click="${this._onSelectButtonClicked}">
                    Select
                </wl-button>
            </div>
        </div>`;
    }

    protected _renderEmpty () {
        return 'None specified';
    }

    private _renderStatus (r:T) {
        let lr : T = this._loadedResources[r.id];
        if (this.inline)
            return html`<span class="${this.classes}"> 
                ${this._loading[r.id] ? 
                    html`${getId(r)} <loading-dots style="--width: 20px; margin-left: 5px;"></loading-dots>`
                    : (this._error[r.id] ?
                        html`
                        <span style="color:red;">${getId(r)}</span>
                        <span @click="${() => this._forceLoad(r)}" id="retry-button">
                            <wl-icon style="position:fixed;">cached</wl-icon>
                        </span>`
                        : this._renderResource(lr))
                    }
            </span>`;
        else
            return html`<tr>
                ${this._loading[r.id] ? 
                    html`<td colspan="${this.positionAttr ? this.colspan + 1 : this.colspan}" align="center">
                        ${getId(r)}
                        <loading-dots style="--width: 20px; margin-left: 5px;"></loading-dots>
                    </td>`
                    : html`
                    ${this._action === Action.EDIT_OR_ADD && this.positionAttr ? html`
                    <td class="grab" @mousedown=${this._grabPosition}>
                        ${this._getResourcePosition(lr) > 0 ? this._getResourcePosition(lr) : '-'}
                    </td>` : ''}
                    ${this._renderRow(lr)}
                    ${this._action === Action.EDIT_OR_ADD ? html`
                    <td>
                        <wl-button class="edit" @click="${() => this._editResource(r)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    </td>` : ''}`
                }
            </tr>`;
    }

    protected _renderResource (r:T) {
        return html`${getLabel(r)}`;
    }

    protected _renderFullResource (r:T) {
        return this._renderResource(r);
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

    protected _renderActionButtons () {
        if (this._status === Status.CREATE || this._status === Status.EDIT) {
            return html`
                <div style="float:right; margin-top: 1em;">
                    <wl-button @click="${() => this._clearStatus()}" style="margin-right: 1em;" flat inverted>
                        <wl-icon>cancel</wl-icon>&ensp;Discard changes
                    </wl-button>
                    <wl-button @click="${this._onSaveButtonClicked}">
                        <wl-icon>save</wl-icon>&ensp;Save
                    </wl-button>
                </div>` 
        } else {
            return html`
                <div style="margin-top: 1em;">
                    <wl-button style="float:right;" @click="${() => this._editResource(this._resources[0])}">
                        <wl-icon>edit</wl-icon>&ensp;Edit
                    </wl-button>
                        <wl-button style="--primary-hue: 0; --primary-saturation: 75%" ?disabled="${!this._deleteEnabled}"
                                   @click="${() => this._deleteResource(this._resources[0])}">
                        <wl-icon>delete</wl-icon>&ensp;Delete
                    </wl-button>
                </div>`
        }
    }

    _searchPromise = null;
    private _onSearchChange () {
        let searchInput = this.shadowRoot.getElementById('search-input') as Textfield;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._textFilter = searchInput.value.toLowerCase();
            this._page = 0;
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
        let pages : number = -1;
        if (!this._allResourcesLoading) {
            resourcesToShow = Object.values(this._loadedResources);
            this._filters.forEach((filter:(r:T)=>boolean) => {
                resourcesToShow = resourcesToShow.filter(filter);
            });
            if (this.pageMax > 0 && this.pageMax < resourcesToShow.length) {
                pages = Math.ceil(resourcesToShow.length / this.pageMax);
                resourcesToShow = resourcesToShow.filter((r,i) => {
                    let a : boolean = (i > this._page * this.pageMax);
                    let b : boolean = (i < (this._page+1) * this.pageMax);
                    return a && b;
                });
            }
        }

        return html`
        <div class="resources-list">
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
        ${(pages > 0) ? html`
        <div class="pagination">
            <wl-button 
                @click="${() => {this._page = this._page-1}}"
                .disabled="${this._page == 0}">
                Prev
            </wl-button>
            <span> Page ${this._page+1} of ${pages} </span>
            <wl-button 
                @click="${() => {this._page = this._page+1}}"
                .disabled="${this._page == pages-1}">
                Next
            </wl-button>
        </div>
        ` : ''}
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
                :  'Editing ' + this.name + ' ' + (edResource ? getLabel(edResource) : '-')}
        </h3>
        <div slot="content">
            ${this._renderForm()}
        </div>
        <div slot="footer">
            <wl-button @click="${this._clearStatus}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">
                Cancel
            </wl-button>
            <wl-button class="submit" ?disabled="${this._waiting}" @click="${this._onSaveButtonClicked}">
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

    protected _renderFullForm () {
        return this._renderForm();
    }

    private _grabPosition (e) {
        let tr = e.target.closest("TR");
        let trRect = tr.getBoundingClientRect();
        let trMax = trRect.top + trRect.height;
        let oldIndex = tr.rowIndex;
        let table = tr.parentElement;
        let drag;
        let thisElement = this;

        table.classList.add("grabCursor");
        table.style.userSelect = "none";
        tr.classList.add("grabbed");
        
        function move (e) {
            if (!drag && (e.pageY > trRect.top && e.pageY < trMax)) {
                return;
            }
            drag = true;
            let sibling = tr.parentNode.firstChild; //This can be improved as we know where can be the element.
            while (sibling) {
                if (sibling.nodeType === 1 && sibling !== tr && !sibling.classList.contains('ignore-grab')) {
                    let tRect = sibling.getBoundingClientRect();
                    let tMax = tRect.top + tRect.height;
                    if (e.pageY > tRect.top && e.pageY < tMax) {
                        if (sibling.rowIndex < tr.rowIndex)
                            tr.parentNode.insertBefore(tr, sibling);
                        else
                            tr.parentNode.insertBefore(tr, sibling.nextSibling);
                        return false;
                    }
                }
                sibling = sibling.nextSibling;
            }
        }

        function up (e) {
            if (drag && oldIndex != tr.rowIndex) {
                drag = false;
                if (confirm('Are you sure you want to move this ' + thisElement.name)) {
                    thisElement._changeOrder(oldIndex + 1, tr.rowIndex + 1);
                }
                let sibling = tr.parentNode.firstChild;
                while (sibling) {
                    if (sibling.nodeType === 1 && sibling !== tr && sibling.rowIndex === oldIndex) {
                        if (tr.rowIndex > oldIndex)
                            tr.parentNode.insertBefore(tr, sibling);
                        else 
                            tr.parentNode.insertBefore(tr, sibling.nextSibling);
                        break;
                    }
                    sibling = sibling.nextSibling;
                }
            }
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            table.classList.remove("grabCursor")
            table.style.userSelect = "none";
            tr.classList.remove("grabbed");

        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    }

    private _changeOrder (oldIndex:number, newIndex:number) {
        let min: number = oldIndex > newIndex ? newIndex : oldIndex;
        let max: number = oldIndex > newIndex ? oldIndex : newIndex;
        let mov: number = oldIndex > newIndex ? +1 : -1;
        for (let i = min; i < max + 1; i ++) {
            let index : number = i === oldIndex ? newIndex : i + mov;
            //console.log(i, '->', index, this._orderedResources[i-1]);
            this._setResourcePosition(this._orderedResources[i-1], index);
        }
        this._refreshOrder();
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

    protected _onSaveButtonClicked () {
        let resource = this._singleMode ? this._getResourceFromFullForm() : this._getResourceFromForm();
        if (resource && this._status != Status.NONE) {
            if (this.lazy) this._addToSaveQueue(resource);
            else this._saveResource(resource);
        }
    }

    private _saveResource (resource:T) {
        this._waiting = true;
        let req : Promise<T>;
        if (this._status === Status.CREATE || this._status === Status.CUSTOM_CREATE) {
            req = store.dispatch(this.resourcePost(resource));
        } else if (this._status === Status.EDIT) {
            resource.id = this._editingResourceId;
            req = store.dispatch(this.resourcePut(resource));
        }
        req.then((r:T) => {
            console.log('SAVED: ', r);
            this._waiting = false;
            this._loadedResources[r.id] = r;
            this._clearStatus();
            this._notification.save(this.name + " saved");
            if (this._action === Action.EDIT_OR_ADD && this._resources.filter((s:T) => s.id===r.id).length === 0) {
                this._resources.push(r);
                if (this.positionAttr) this._orderedResources.push(r);
            } else if (this._action === Action.MULTISELECT) {
                this._selectedResources[r.id] = true;
            } else if (this._action === Action.SELECT) {
                this._selectedResourceId = r.id;
            }
        });
        return req;
    }

    private _addToSaveQueue (resource:T) {
        if (this._status === Status.CREATE || this._status === Status.CUSTOM_CREATE) {
            // Create a temp id , max len 15
            let id : string = (new Date()).getTime() + '';
            resource['id'] = id;
            this._resourcesToCreate[id] = resource;
            if (this._action === Action.EDIT_OR_ADD) {
                this._resources.push(resource);
                if (this.positionAttr) this._orderedResources.push(resource);
            }
        } else if (this._status === Status.EDIT) {
            resource.id = this._editingResourceId;
            this._resourcesToEdit[this._editingResourceId] = resource;
        }
        this._loadedResources[resource.id] = resource;
        this._clearStatus();
        if (this._action === Action.MULTISELECT) {
            this._selectedResources[resource.id] = true;
        } else if (this._action === Action.SELECT) {
            this._selectedResourceId = resource.id;
        }
    }

    //When lazy is on, this function must be used to perform the save
    public save () {
        let creation = Object.values(this._resourcesToCreate).map((r:T) => {
            let tempId : string = r.id;
            let index : number = -1;
            this._resources.forEach((r2:T, i:number) => {
                if (r2.id === r.id) index = i;
            });

            r["id"] = "";
            let req = store.dispatch(this.resourcePost(r));
            req.then((resource : T) => {
                this._resources.splice(index,1);
                this._resources.push(resource);
            });
            return req;
        });
        let edition = Object.values(this._resourcesToEdit).map((r:T) => {
            let req = store.dispatch(this.resourcePut(r));
            return req;
        });
        let allp = Promise.all([ ...creation, ...edition ]);
        allp.then((rs: T[]) => {
            rs.forEach((lr:T) => {
                this._loadedResources[lr.id] = lr;
            });
            this._resourcesToEdit = {};
            this._resourcesToCreate  = {};
            if (this.positionAttr) this._refreshOrder();
        })
        return allp;
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

    protected _getResourceFromFullForm () {
        return this._getResourceFromForm();
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
        this._textFilter = "";
        showDialog("resource-dialog", this.shadowRoot);
    }

    protected _editResource (r:T) {
        this._editingResourceId = r.id;
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
                this._notification.save(this.name + " deleted")
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

    private _getResourcePosition (r:T) {
        let p = r[this.positionAttr];
        if (p && p.length > 0)
            return p[0];
        return -1;
    }

    private _setResourcePosition (r:T, position:number) {
        let lr = this._loadedResources[r.id];
        if (position > 0 && lr) {
            let newR : T = { ... lr };
            newR[this.positionAttr] = [position];
            this._loadedResources[r.id] = newR;
            if (this.lazy) {
                this._resourcesToEdit[r.id] = newR;
            } else {
                //TODO: do an update here;
            }
        }
    }

    /* Check position attribute and compute order array */
    protected _refreshOrder () {
        if (this.positionAttr) {
            // Check resources with position
            let done : Set<string> = new Set();
            let ordered : T[] = this._resources
                    .map((r:T) => {
                        let lr : T = this._loadedResources[r.id]
                        done.add(lr.id);
                        return lr;
                    })
                    .filter((r:T) => r ? (this._getResourcePosition(r) > 0) : false)
                    .sort((r1:T, r2:T) => this._getResourcePosition(r1) - this._getResourcePosition(r2));

            let unordered = this._resources.filter((r:T) => !done.has(r.id))
            this._orderedResources = [ ...ordered, ...unordered ];
            //console.log('New order:', this._orderedResources.map(r => r.label[0]));
            this.requestUpdate();
        }
    }

    protected _forceLoad (r:T) {
        this._loading[r.id] = true;
        let req = store.dispatch(this.resourceGet(r.id));
        this.requestUpdate();
        req.then((r2:T) => {
            this._loading[r.id] = false;
            this._loadedResources[r.id] = r2;
            this.requestUpdate();
        });
        req.catch(() => {
            this._error[r.id] = true;
            this._loading[r.id] = false;
            this.requestUpdate();
        });
    }

    /* This is the way to set a list of resources */
    public setResources (r:T[]) {
        this._singleMode = false;
        if (!r || r.length === 0) {
            this._resources = [];
            this._order = {};
            return;
        }
        this._resources = [...r];
        let shouldLoad : string[] = this._resources
                .map((r:T) => r.id)
                .filter((id:string) => !this._loading[id] || !this._loadedResources[id]);

        if (shouldLoad.length > 0) {
            let dbResources : IdMap<T> = this._getDBResources();
            Promise.all(
                shouldLoad.map((id:string) => {
                    if (dbResources[id])  {
                        this._loadedResources[id] = dbResources[id];
                        return Promise.resolve(this._loadedResources[id]);
                    } else {
                        this._loading[id] = true;
                        let req = store.dispatch(this.resourceGet(id));
                        req.then((r:T) => {
                            this._loading[id] = false;
                            this._loadedResources[id] = r;
                            this.requestUpdate();
                        });
                        req.catch(() => {
                            this._error[id] = true;
                            this._loading[id] = false;
                        });
                        return req;
                    }
                })
            ).then((resources:T[]) => {
                if (this.positionAttr) this._refreshOrder();
            }).catch(() => {
                if (this.positionAttr) this._refreshOrder();
            })
        } else if (this.positionAttr) {
            this._refreshOrder();
        }
    }

    /* Set a single resource */
    public setResource (r:T) {
        return new Promise((resolve, reject) => {
            if (!this._singleModeInitialized) {
                this._initializeSingleMode();
                this._singleModeInitialized = true;
            }
            this._singleMode = true;
            if (r && r.id) {
                let id : string = r.id;
                this._resources = [r];
                if (!this._loading[id] && !this._loadedResources[id]) {
                    let dbResources : IdMap<T> = this._getDBResources();
                    if (dbResources[id]) {
                        this._loadedResources[id] = dbResources[id];
                        resolve(dbResources[id]);
                    } else {
                        this._loading[id] = true;
                        let req = store.dispatch(this.resourceGet(id));
                        req.then((r:T) => {
                            this._loading[id] = false;
                            this._loadedResources[id] = r;
                            this.requestUpdate();
                            resolve(r);
                        });
                        req.catch(() => {
                            this._error[id] = true;
                            this._loading[id] = false;
                            reject();
                        });
                    }
                } else if (this._loadedResources[id]) {
                    resolve(this._loadedResources[id]);
                }
            } else {
                this._resources = [];
                resolve();
            }
        });
    }

    public getResources () {
        return this._resources.map((r:T) => {
            let lr = this._loadedResources[r.id];
            if (lr.id.length < 15) return { ...lr, id: "" };
            else return lr;
        })
    }

    public isSaved () {
        return !this.lazy || (Object.keys(this._resourcesToEdit).length === 0 && Object.keys(this._resourcesToCreate).length === 0);
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
