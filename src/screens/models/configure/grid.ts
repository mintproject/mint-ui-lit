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

import { gridGet, gridsGet, gridPost, gridPut, gridDelete } from 'model-catalog/actions';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import 'components/loading-dots'
import { Grid } from '@mintproject/modelcatalog_client';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('models-configure-grid')
export class ModelsConfigureGrid extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _grids : IdMap<Grid> = {} as IdMap<Grid>;

    @property({type: Object})
    private _selected : Grid | null = null;

    @property({type: String})
    private _filter : string = '';

    /* boolean to check if we are on edit mode, if selected === null we are creating a new grid */
    @property({type: Boolean}) private _editing : boolean = false;
    @property({type: Boolean}) private _loading : boolean = false; // Loading all grids
    @property({type: Boolean}) private _waiting : boolean = false; // Waiting creation of new grid

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .grid-container {
            display: grid;
            grid-template-columns: auto 58px;
            border: 2px solid teal;
            border-radius: 4px;
            padding: 1px 4px;
            margin-bottom: 5px;
        }

        .custom-radio {
            width: 28px;
            line-height: 36px;
        }

        wl-icon.warning:hover {
            color: darkred;
        }

        span.bold {
            font-weight: bold;
        }
        
        .grid-buttons-area {
            display: inline-block;
            line-height: 36px;
        }

        .grid-buttons-area > wl-button {
            --button-padding: 5px;
            line-height: 36px;
            vertical-align: middle;
        }

        .grid-clickable-area {
            overflow: hidden;
            cursor:pointer;
        }

        .grid-data {
            display: inline-block;
            width: calc(100% - 30px);
        }

        .one-line {
            height: 18px;
            line-height: 18px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .results {
            height: 400px;
            overflow-y: scroll;
        }
        `,
        ];
    }

    public open () {
        if (this.active) {
            showDialog("gridDialog", this.shadowRoot);
            this._filter = '';
        } else {
            setTimeout(() => {this.open()}, 300);
        }
    }

    public cancel () {
        this._filter = '';
        if (this._editing) {
            this._editing = false;
            this._selected = null;
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("gridDialog", this.shadowRoot);
        }
    }

    private _onSubmitGrid () {
        this.dispatchEvent(new CustomEvent('gridSelected', {composed: true, detail: this._selected}));
        hideDialog("gridDialog", this.shadowRoot);
        //FIXME: should do the cancel?
    }

    public setSelected (grid: Grid|null) {
        this._selected = grid;
    }

    public getSelected () {
        return this._selected;
    }

    _searchPromise = null;
    _onSearchChange () {
        let searchEl = this.shadowRoot.getElementById('search-input') as Textfield;
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
        let sGrid = this._selected;
        return html`
        <wl-dialog class="larger" id="gridDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._editing ? (sGrid ? 'Editing grid' : 'Register a new grid') : 'Selecting grids'}
            </h3>
            <div slot="content">
                ${this._editing ? (sGrid ? this._renderEdit() : this._renderNew()) : this._renderSelect()}
            </div>
            <div slot="footer">
                <wl-button @click="${this.cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button class="submit" ?disabled="${this._waiting}"
                        @click="${() => this._editing ? (sGrid ? this._onEditGrid() : this._onCreateGrid()) : this._onSubmitGrid()}">
                    ${this._editing ? 'Save & Select' : 'Set selected grid'}
                    ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>
            </div>
        </wl-dialog>
        ${renderNotifications()}`
    }

    private _renderEdit () {
        return html`
        <form>
            <wl-textfield value="${this._selected.label ? this._selected.label:''}"
                id="edit-grid-name" label="Name" required></wl-textfield>
            <wl-textarea value="${this._selected.description ? this._selected.description:''}"
                id="edit-grid-desc" label="Description" required></wl-textarea>
            <wl-textfield value="${this._selected.hasSpatialResolution ? this._selected.hasSpatialResolution:''}"
                id="edit-grid-spatial-res" label="Spatial resolution"></wl-textfield>
            <wl-select value="${this._selected.hasDimension ? this._selected.hasDimension:''}"
                id="edit-grid-dim" label="Dimension">
                <option value>None</option>
                <option value="0D">0D</option>
                <option value="1D">1D</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
            </wl-select>
            <wl-select value="${this._selected.hasShape ? this._selected.hasShape:''}"
                id="edit-grid-shape" label="Shape">
                <option value>None</option>
                <option value="Point">Point</option>
                <option value="Triangular">Triangular</option>
                <option value="Block structure">Block structure</option>
            </wl-select>
        </form> `
    }

    private _renderNew () {
        return html`
        <form>
            <wl-textfield id="new-grid-name" label="Name" required></wl-textfield>
            <wl-textarea id="new-grid-desc" label="Description" required></wl-textarea>
            <wl-textfield id="new-grid-spatial-res" label="Spatial resolution"></wl-textfield>
            <wl-select id="new-grid-dim" label="Dimension">
                <option value selected>None</option>
                <option value="0D">0D</option>
                <option value="1D">1D</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
            </wl-select>
            <wl-select id="new-grid-shape" label="Shape">
                <option value selected>None</option>
                <option value="Point">Point</option>
                <option value="Triangular">Triangular</option>
                <option value="Block structure">Block structure</option>
            </wl-select>
        </form>`
    }

    private _renderSelect () {
        return html`
        <wl-textfield label="Search grids" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
        <div class="results" style="margin-top: 5px;">
            <div class="grid-container">
                <span class="grid-clickable-area" @click="${() => {this.setSelected(null)}}">
                    <span style="display: inline-block; vertical-align: top;">
                        <wl-icon class="custom-radio">
                            ${this._selected === null ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </wl-icon>
                    </span>
                    <span class="grid-data ${this._selected === null ? 'bold' : ''}" style="line-height: 36px;">
                        <div style="color:black;"> No grid </div>
                    </span>
                </span>
            </div>
            ${Object.values(this._grids)
                .filter(grid => (grid.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                .map((grid) => html`
            <div class="grid-container">
                <span class="grid-clickable-area" @click="${() => {this.setSelected(grid)}}">
                    <span style="display: inline-block; vertical-align: top;">
                        <wl-icon class="custom-radio">
                            ${this._selected && this._selected.id === grid.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </wl-icon>
                    </span>
                    <span class="grid-data ${this._selected && this._selected.id === grid.id ? 'bold' : ''}">
                        <div class="one-line" style="text-decoration:underline; color:black;">
                            ${grid.label ? grid.label : grid.id}
                        </div>
                        <div class="one-line" style="display: flex; justify-content: space-between;">
                            <span style="margin-right: 10px;">
                                <span style="font-size:12px">Spatial res:</span>
                                <span class="monospaced" style="color:black">
                                    ${grid.hasSpatialResolution && grid.hasSpatialResolution.length > 0 ?  grid.hasSpatialResolution[0] : '-'}
                                </span>
                            </span>
                            <span style="margin-right: 10px;">
                                <span style="font-size:12px">Dimensions:</span>
                                <span class="number" style="color:black">
                                    ${grid.hasDimension && grid.hasDimension.length > 0 ? grid.hasDimension[0] : '-'}
                                </span>
                            </span>
                            <span style="margin-right: 10px;" class="one-line">
                                <span style="font-size:12px">Shape:</span>
                                <span class="monospaced" style="color:black">
                                    ${grid.hasShape && grid.hasShape.length > 0 ? grid.hasShape[0] : '-'}
                                </span>
                            </span>
                        </div>
                    </span>
                </span>
                <span class="grid-buttons-area">
                    <wl-button @click="${() => this._edit(grid)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    <wl-button @click="${() => this._delete(grid)}" flat inverted><wl-icon class="warning">delete</wl-icon></wl-button>
                </span>
            </div>
        `)}
        ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
        </div>
        or <a style="cursor:pointer" @click="${() => {this._selected = null; this._editing = true;}}">create a new Grid</a>
        `
    }

    _onCreateGrid () {
        let nameEl  = this.shadowRoot.getElementById('new-grid-name') as Textfield;
        let descEl  = this.shadowRoot.getElementById('new-grid-desc') as Textarea;
        let spatialEl = this.shadowRoot.getElementById('new-grid-spatial-res') as Textfield;
        let dimEl   = this.shadowRoot.getElementById('new-grid-dim') as Select;
        let shapeEl = this.shadowRoot.getElementById('new-grid-shape') as Select;

        if (nameEl && descEl && spatialEl && dimEl && shapeEl) {
            let name    = nameEl.value;
            let desc    = descEl.value;
            let spatial = spatialEl.value;
            let dim     = dimEl.value;
            let shape   = shapeEl.value;

            if (!name || !desc) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>descEl).refreshAttributes();
                return;
            }

            let newGrid : Grid = {
                label: [name],
                description: [desc],
            }
            if (spatial) newGrid.hasSpatialResolution = [spatial];
            if (dim) newGrid.hasDimension = [dim];
            if (shape) {
                newGrid.hasShape = [shape];
                if (shape === 'Triangular' || shape === 'Block structure')
                    newGrid.type = ["SpatiallyDistributedGrid"]
                else if (shape === 'Point')
                    newGrid.type = ["PointBasedGrid"]
            }

            this._waiting = true;
            store.dispatch(gridPost(newGrid)).then((grid: Grid) => {
                this._waiting = false;
                this._editing = false;
                this._selected = grid;
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditGrid () {
        let nameEl  = this.shadowRoot.getElementById('edit-grid-name') as Textfield;
        let descEl  = this.shadowRoot.getElementById('edit-grid-desc') as Textarea;
        let spatialEl = this.shadowRoot.getElementById('edit-grid-spatial-res') as Textfield;
        let dimEl   = this.shadowRoot.getElementById('edit-grid-dim') as Select;
        let shapeEl = this.shadowRoot.getElementById('edit-grid-shape') as Select;

        if (nameEl && descEl && spatialEl && dimEl && shapeEl) {
            let name    = nameEl.value;
            let desc    = descEl.value;
            let spatial = spatialEl.value;
            let dim     = dimEl.value;
            let shape   = shapeEl.value;

            if (!name || !desc) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>descEl).refreshAttributes();
                return;
            }

            let editedGrid : Grid = Object.assign({}, this._selected);
            editedGrid.label = [name];
            editedGrid.description = [desc];
            editedGrid.type = ['Grid'];
            if (spatial) editedGrid.hasSpatialResolution = [spatial];
            if (dim) editedGrid.hasDimension = [dim];
            if (shape) {
                editedGrid.hasShape = [shape];
                if (shape === 'Triangular' || shape === 'Block structure')
                    editedGrid.type.push("SpatiallyDistributedGrid")
                else if (shape === 'Point')
                    editedGrid.type.push("PointBasedGrid")
            }

            this._waiting = true;
            store.dispatch(gridPut(editedGrid)).then((grid: Grid) => {
                this._waiting = false;
                this._editing = false;
                this._selected = grid;
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _edit (grid: Grid) {
        this._selected = grid;
        this._editing = true;
    }

    _delete (grid: Grid) {
        if (confirm('This Grid will be deleted on all related resources')) {
            if (this._selected && this._selected.id === grid.id)
                this._selected = null;
            store.dispatch(gridDelete(grid));
        }
    }

    firstUpdated () {
        this._loading = true;
        store.dispatch(gridsGet()).then((grids) => {
            this._loading = false;
        });
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._grids = db.grids;
        }
    }
}
