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

import { timeIntervalGet, timeIntervalsGet, timeIntervalPost, timeIntervalPut, timeIntervalDelete } from 'model-catalog/actions';

import { renderExternalLink } from './util';

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

@customElement('models-configure-time-interval')
export class ModelsConfigureTimeInterval extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _timeIntervals : IdMap<TimeInterval> = {} as IdMap<TimeInterval>;

    @property({type: Object})
    private _units : IdMap<Unit> = {
        'https://w3id.org/okn/i/mint/dayT':
            { id: 'https://w3id.org/okn/i/mint/dayT', label: ['day']},
        'https://w3id.org/okn/i/mint/hourT':
            { id: 'https://w3id.org/okn/i/mint/hourT', label: ['hour']},
        'https://w3id.org/okn/i/mint/yearT':
            { id: 'https://w3id.org/okn/i/mint/yearT', label: ['year']},
        'https://w3id.org/okn/i/mint/minT':
            { id: 'https://w3id.org/okn/i/mint/minT', label: ['min']},
        'https://w3id.org/okn/i/mint/variable':
            { id: 'https://w3id.org/okn/i/mint/variable', label: ['variable']}
    } as IdMap<Unit>;

    @property({type: Object})
    private _selected : TimeInterval | null = null;

    @property({type: String})
    private _filter : string = '';

    /* boolean to check if we are on edit mode, if selected === null we are creating a new timeInterval */
    @property({type: Boolean}) private _editing : boolean = false;
    @property({type: Boolean}) private _loading : boolean = false; // Loading all timeIntervals
    @property({type: Boolean}) private _waiting : boolean = false; // Waiting creation of new timeInterval

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .time-interval-container {
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
        
        .time-interval-buttons-area {
            display: inline-block;
            line-height: 36px;
        }

        .time-interval-buttons-area > wl-button {
            --button-padding: 5px;
            line-height: 36px;
            vertical-align: middle;
        }

        .time-interval-clickable-area {
            overflow: hidden;
            cursor:pointer;
        }

        .time-interval-data {
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

        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
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
            showDialog("timeIntervalDialog", this.shadowRoot);
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
            hideDialog("timeIntervalDialog", this.shadowRoot);
        }
    }

    private _onSubmitTimeInterval () {
        this.dispatchEvent(new CustomEvent('timeIntervalSelected', {composed: true, detail: this._selected}));
        hideDialog("timeIntervalDialog", this.shadowRoot);
        //FIXME: should do the cancel?
    }

    public setSelected (timeInterval: TimeInterval|null) {
        this._selected = timeInterval;
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
        let sTimeInterval = this._selected;
        return html`
        <wl-dialog class="larger" id="timeIntervalDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._editing ? (sTimeInterval ? 'Editing time interval' : 'Register a new time interval') : 'Selecting time intervals'}
            </h3>
            <div slot="content">
                ${this._editing ? (sTimeInterval ? this._renderEdit() : this._renderNew()) : this._renderSelect()}
            </div>
            <div slot="footer">
                <wl-button @click="${this.cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                <wl-button class="submit" ?disabled="${this._waiting}"
                        @click="${() => this._editing ? (sTimeInterval ? this._onEditTimeInterval() : this._onCreateTimeInterval()) : this._onSubmitTimeInterval()}">
                    ${this._editing ? 'Save & Select' : 'Set selected time interval'}
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
                id="edit-time-interval-name" label="Name" required></wl-textfield>
            <wl-textarea value="${this._selected.description ? this._selected.description:''}"
                id="edit-time-interval-desc" label="Description" required></wl-textarea>
            <div class="two-inputs">
                <wl-textfield value="${this._selected.intervalValue ? this._selected.intervalValue:''}"
                    id="edit-time-interval-value" label="Interval value"></wl-textfield>
                <wl-select value="${this._selected.intervalUnit ? this._selected.intervalUnit[0].id:''}"
                    id="edit-time-interval-unit" label="Interval unit" required>
                    <option value disabled>None</option>
                    ${Object.values(this._units).map((unit:Unit) => html`
                        <option value="${unit.id}">${unit.label}</option>
                    `)}
                </wl-select>
            </div>
        </form> `
    }

    private _renderNew () {
        return html`
        <form>
            <wl-textfield id="new-time-interval-name" label="Name" required></wl-textfield>
            <wl-textarea id="new-time-interval-desc" label="Description" required></wl-textarea>
            <div class="two-inputs">
                <wl-textfield id="new-time-interval-value" label="Interval unit"></wl-textfield>
                <wl-select id="new-time-interval-unit" label="Interval unit" required>
                    <option value selected disabled>None</option>
                    ${Object.values(this._units).map((unit:Unit) => html`
                        <option value="${unit.id}">${unit.label}</option>
                    `)}
                </wl-select>
            </div>
        </form>`
    }

    private _renderSelect () {
        return html`
        <wl-textfield label="Search time intervals" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
        <div class="results" style="margin-top: 5px;">
            <div class="time-interval-container">
                <span class="time-interval-clickable-area" @click="${() => {this.setSelected(null)}}">
                    <span style="display: inline-block; vertical-align: top;">
                        <wl-icon class="custom-radio">
                            ${this._selected === null ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </wl-icon>
                    </span>
                    <span class="time-interval-data ${this._selected === null ? 'bold' : ''}" style="line-height: 36px;">
                        <div style="color:black;"> No time interval </div>
                    </span>
                </span>
            </div>
            ${Object.values(this._timeIntervals)
                .filter(timeInterval => (timeInterval.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                .map((timeInterval) => html`
            <div class="time-interval-container">
                <span class="time-interval-clickable-area" @click="${() => {this.setSelected(timeInterval)}}">
                    <span style="display: inline-block; vertical-align: top;">
                        <wl-icon class="custom-radio">
                            ${this._selected && this._selected.id === timeInterval.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </wl-icon>
                    </span>
                    <span class="time-interval-data ${this._selected && this._selected.id === timeInterval.id ? 'bold' : ''}">
                        <div class="one-line" style="display: flex; justify-content: space-between;">
                            <span>
                                ${timeInterval.label ? timeInterval.label : timeInterval.id}
                            </span>
                            <span class="monospaced">
                                ${timeInterval.intervalValue ? timeInterval.intervalValue : '-'}
                                ${timeInterval.intervalUnit && timeInterval.intervalUnit.length > 0 ?
                                    this._units[timeInterval.intervalUnit[0].id].label
                                    : '-'}
                            </span>
                        </div>
                        <div class="one-line" style="font-style: oblique;">
                            ${timeInterval.description ? timeInterval.description : '' }
                        </div>
                    </span>
                </span>
                <span class="time-interval-buttons-area">
                    <wl-button @click="${() => this._edit(timeInterval)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    <wl-button @click="${() => this._delete(timeInterval)}" flat inverted><wl-icon class="warning">delete</wl-icon></wl-button>
                </span>
            </div>
        `)}
        ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
        </div>
        or <a style="cursor:pointer" @click="${() => {this._selected = null; this._editing = true;}}">create a new time interval</a>
        `
    }

    _onCreateTimeInterval () {
        let nameEl : Textfield  = this.shadowRoot.getElementById('new-time-interval-name') as Textfield;
        let descEl : Textarea   = this.shadowRoot.getElementById('new-time-interval-desc') as Textarea;
        let valueEl : Textfield = this.shadowRoot.getElementById('new-time-interval-value') as Textfield;
        let unitEl : Select     = this.shadowRoot.getElementById('new-time-interval-unit') as Select;

        if (nameEl && descEl && valueEl && unitEl) {
            let name : string = nameEl.value;
            let desc : string = descEl.value;
            let value: string = valueEl.value;
            let unitId: string = unitEl.value;

            if (!name || !desc || !unitId) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>descEl).refreshAttributes();
                (<any>unitEl).refreshAttributes();
                return;
            }

            let newTimeInterval : TimeInterval = {
                label: [name],
                description: [desc],
                intervalUnit: [ { id: unitId } ],
            }
            if (value) newTimeInterval.intervalValue = [value];

            this._waiting = true;
            store.dispatch(timeIntervalPost(newTimeInterval)).then((timeInterval: TimeInterval) => {
                this._waiting = false;
                this._editing = false;
                this._selected = timeInterval;
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditTimeInterval () {
        let nameEl : Textfield  = this.shadowRoot.getElementById('edit-time-interval-name') as Textfield;
        let descEl : Textarea   = this.shadowRoot.getElementById('edit-time-interval-desc') as Textarea;
        let valueEl : Textfield = this.shadowRoot.getElementById('edit-time-interval-value') as Textfield;
        let unitEl : Select     = this.shadowRoot.getElementById('edit-time-interval-unit') as Select;

        if (nameEl && descEl && valueEl && unitEl) {
            let name : string = nameEl.value;
            let desc : string = descEl.value;
            let value: string = valueEl.value;
            let unitId: string = unitEl.value;

            if (!name || !desc || !unitId) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                (<any>descEl).refreshAttributes();
                (<any>unitEl).refreshAttributes();
                return;
            }

            let editedTimeInterval : TimeInterval = Object.assign({}, this._selected);
            editedTimeInterval.label = [name];
            editedTimeInterval.description = [desc];
            editedTimeInterval.intervalUnit = [ {id : unitId} ];
            if (value) editedTimeInterval.intervalValue = [value];

            this._waiting = true;
            store.dispatch(timeIntervalPut(editedTimeInterval)).then((timeInterval: TimeInterval) => {
                this._waiting = false;
                this._editing = false;
                this._selected = timeInterval;
            });
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _edit (timeInterval: TimeInterval) {
        this._selected = timeInterval;
        this._editing = true;
    }

    _delete (timeInterval: TimeInterval) {
        if (confirm('This TimeInterval will be deleted on all related resources')) {
            if (this._selected && this._selected.id === timeInterval.id)
                this._selected = null;
            store.dispatch(timeIntervalDelete(timeInterval));
        }
    }

    firstUpdated () {
        this._loading = true;
        store.dispatch(timeIntervalsGet()).then((timeIntervals) => {
            this._loading = false;
        });
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._timeIntervals = db.timeIntervals;
        }
    }
}
