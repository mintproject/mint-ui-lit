import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { IdMap } from 'app/reducers';
import { goToPage } from 'app/actions';

import { dataTransformationsGet, dataTransformationGet, dataTransformationSetupsGet, dataTransformationPut,
         dataTransformationPost, dataTransformationDelete } from 'model-catalog/actions';
import { DataTransformation, DataTransformationFromJSON } from '@mintproject/modelcatalog_client';
import { getId, getLabel } from 'model-catalog/util';
import { PREFIX_URI } from 'model-catalog/actions';
import { renderExternalLink } from 'util/ui_renders';

import "components/loading-dots";
import "weightless/title";
import "weightless/icon";
import "weightless/select";
import "weightless/textfield";

import { Textarea } from 'weightless/textarea';

import { ModelCatalogSoftwareImage } from 'screens/models/configure/resources/software-image';
import { ModelCatalogParameter } from 'screens/models/configure/resources/parameter';
import { ModelCatalogDatasetSpecification } from 'screens/models/configure/resources/dataset-specification';
import { ModelCatalogRegion } from 'screens/models/configure/resources/region';

@customElement('data-transformation-list')
export class DataTransformationList extends connect(store)(PageViewElement) {
    static get styles() {
        return [SharedStyles, css`
            .details-table {
                border-collapse: collapse;
                width: 100%;
            }

            .details-table tr td:first-child {
                font-weight: bold;
                padding-right: 6px;
                padding-left: 13px;
            }

            .details-table tr td:last-child {
                padding-right: 13px;
            }

            .details-table tr:nth-child(odd) {
                background-color: rgb(246, 246, 246);
            }

            .details-table > tbody > tr > td > span {
                display: inline-block;
                border-radius: 4px;
                line-height: 20px;
                padding: 1px 4px;
                margin-right: 4px;
                margin-bottom: 2px;
            }

            .details-table > tbody > tr > td > span > wl-icon {
                --icon-size: 16px;
                cursor: pointer;
                vertical-align: middle;
            }

            .details-table > tbody > tr > td > input, textarea {
                background: transparent;
                font-family: Raleway;
                font-size: 14px;
                width: calc(100% - 10px);
                resize: vertical;
            }

            .details-table > tbody > tr > td > span > wl-icon:hover {
                background-color: rgb(224, 224, 224);
            }

            .details-table td {
                padding: 5px 1px;
                vertical-align: top;
            }

            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                border-right: 1px solid #F0F0F0;
                overflow: auto;
                height: 100%;
                padding: 10px;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }
        `];
    }
    private _rendered : boolean = false;

    @property({type: Boolean})
    private _hideLateral : boolean = false;

    @property({type: Boolean})
    private _loadingAll : boolean = false;

    @property({type: Boolean})
    private _editing : boolean = false;

    @property({type: Object})
    private _loading: IdMap<boolean> = {};

    @property({type: Object})
    private _nloaded: IdMap<boolean> = {};

    @property({type: Object})
    private _dts : IdMap<DataTransformation> = {};

    @property({type: String})
    private _dtid : string = '';

    private _inputSI : ModelCatalogSoftwareImage;
    private _inputParameters : ModelCatalogParameter;
    private _inputRegion : ModelCatalogRegion;
    private _inputOutputs : ModelCatalogDatasetSpecification;

    public constructor () {
        super();
        this._inputSI = new ModelCatalogSoftwareImage();
        this._inputParameters = new ModelCatalogParameter();
        this._inputOutputs = new ModelCatalogDatasetSpecification();
        this._inputRegion = new ModelCatalogRegion();
        this._inputParameters.inline = false;
        this._inputOutputs.inline = false;
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    ${this._loadingAll ? 
                        html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                        : this._renderDTList()}
                </div>
            </div>
            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <div style="height: 24px;">
                        <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                            class="actionIcon bigActionIcon" style="float:right">
                            ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                        </wl-icon>
                    </div>
                    ${this._dtid ? this._renderDTDetails() : html`
                    <div>
                        <wl-title level="3"> Data transformations </wl-title>
                        <p>
                            Select a data transformation from the list to display details.
                        </p>
                    </div>
                    `}
                </div>
            </div>
        </div>
        `
    }

    private _renderDTList () {
        return html`<ul> ${Object.values(this._dts).map((dt:DataTransformation) => html`
            <li>
                <a href="${this._regionid}/datasets/data-transformations/${getId(dt)}">${getLabel(dt)}</a>
            </li>`)}
        </ul>`
    }

    private _renderDTDetails () {
        let dt = this._dts[this._dtid];
        return this._loading[this._dtid] ? 
            html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`    
            : html`
            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-title level="3"> ${dt ? getLabel(dt) : ''} </wl-title>
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        ${this._editing ? html`
                        <textarea id="form-config-desc" name="Description" rows="5">${
                            dt && dt.description ? dt.description[0] : ''
                        }</textarea>`
                        : (dt && dt.description ? dt.description[0] : '')}
                    </td>
                </tr>

                <tr>
                    <td>Region</td>
                    <td>
                        ${this._inputRegion}
                    </td>
                </tr>

                <tr>
                    <td>Software Image:</td>
                    <td>
                        ${this._inputSI}
                    </td>
                </tr>

                <tr>
                    <td>Component Location:</td>
                    <td>
                        ${this._editing ? html`
                        <textarea id="form-config-comp-loc">${dt && dt.hasComponentLocation ? 
                                dt.hasComponentLocation : ''}</textarea>`
                        : (dt && dt.hasComponentLocation ? 
                                renderExternalLink(dt.hasComponentLocation[0]) : '')}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        ${this._editing ? html`
                            <textarea id="form-config-usage-notes" rows="6">${dt && dt.hasUsageNotes ?  dt.hasUsageNotes[0] : ''}</textarea>
                        ` : (dt && dt.hasUsageNotes ? dt.hasUsageNotes[0] : '') }
                    </td>
                </tr>

            </table>

            <wl-title level="4" style="margin-top:1em"> Parameters: </wl-title>
            ${this._inputParameters}

            <wl-title level="4" style="margin-top:1em"> Output files: </wl-title>
            ${this._inputOutputs}

            ${this._editing? html`
            <div style="float:right; margin-top: 1em;">
                <wl-button @click="${this._onCancelButtonClicked}" style="margin-right: 1em;" flat inverted>
                    <wl-icon>cancel</wl-icon>&ensp;Discard changes
                </wl-button>
                <wl-button @click="${this._onSaveButtonClicked}">
                    <wl-icon>save</wl-icon>&ensp;Save
                </wl-button>
            </div>` 
            :html`
            <div style="margin-top: 1em;">
                <wl-button style="float:right;" @click="${this._onEditButtonClicked}">
                    <wl-icon>edit</wl-icon>&ensp;Edit
                </wl-button>
                <wl-button style="float:right;margin-right: 10px;--primary-hue: 100;"
                    @click="${this._onDuplicateButtonClicked}">
                    <wl-icon>content_copy</wl-icon>&ensp;Duplicate
                </wl-button>
                <wl-button style="--primary-hue: 0; --primary-saturation: 75%" @click="${this._onDeleteButtonClicked}">
                    <wl-icon>delete</wl-icon>&ensp;Delete
                </wl-button>
            </div>`}
        `
    }

    private _onSaveButtonClicked () {
        let dt = this._dts[this._dtid];
        let edDT = DataTransformationFromJSON({ ...dt, ...this._getResourceFromForm() });
        console.log('>>', edDT);
        store.dispatch(dataTransformationPut(edDT)).then((ndt) => {
            console.log("done!");
            this._dts[ndt.id] = ndt;
        });
    }

    private _onDeleteButtonClicked () {
        if (confirm('This data transformation and all its associated resources will be deleted. Are you sure?')) {
            let dt = this._dts[this._dtid];
            let lid = this._dtid;
            store.dispatch(dataTransformationDelete(dt)).then(() => {
                delete this._dts[lid];
                goToPage('datasets');
            });
        }
    }

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputDesc : Textarea = this.shadowRoot.getElementById('form-config-desc') as Textarea;
        let inputCompLoc : Textarea = this.shadowRoot.getElementById('form-config-comp-loc') as Textarea;
        let inputNotes : Textarea = this.shadowRoot.getElementById('form-config-usage-notes') as Textarea;

        // VALIDATE
        let desc : string = inputDesc ? inputDesc.value : '';
        let compLoc : string = inputCompLoc ? inputCompLoc.value : '';
        let notes : string = inputNotes ? inputNotes.value : '';

        let jsonRes = {
            type: ["DataTransformation"],
        };
        if (desc) jsonRes["description"] = [desc];
        if (compLoc) jsonRes["hasComponentLocation"] = compLoc;
        if (notes) jsonRes["hasUsageNotes"] = notes;

        return jsonRes;
    }

    private _onDuplicateButtonClicked () {
        let dt = this._dts[this._dtid];
        let name = window.prompt("Enter the name of the new Data Transformation", getLabel(dt) + " copy");
        if (name) {
            let jsonObj = { ...dt };
            jsonObj.id = "";
            jsonObj.label = [name];
            store.dispatch(dataTransformationPost(DataTransformationFromJSON(jsonObj))).then((ndt) => {
                this._dts[ndt.id] = ndt;
                goToPage('datasets/data-transformations/' + getId(ndt));
            })
        }
    }

    private _onEditButtonClicked () {
        //this._scrollUp(c);
        goToPage('datasets/data-transformations/' + getId({id: this._dtid}) + '/edit');
    }

    private _onCancelButtonClicked () {
        //this._scrollUp();
        goToPage('datasets/data-transformations/' + getId({id: this._dtid}));
    }

    protected firstUpdated () {
        this._loadingAll = true;
        this._rendered = true;
        store.dispatch(dataTransformationsGet()).then((dts) => {
            this._loadingAll = false;
            this._dts = { ... dts };
        });
        store.dispatch(dataTransformationSetupsGet()).then((dtss) => {
            //TODO
        });
    }

    private _setEditingInputs () { //TODO types...
        this._inputSI.setActionSelect();
        this._inputParameters.setActionEditOrAdd();
        this._inputOutputs.setActionEditOrAdd();
        this._inputRegion.setActionSelect();
    }

    private _unsetEditingInputs () {
        let inputs = [this._inputSI, this._inputRegion, this._inputParameters, this._inputOutputs];
        inputs.forEach((input) => {
            input.unsetAction();
        });
    }


    stateChanged(state: RootState) {
        super.setRegionId(state);
        if (state.explorerUI) {
            let ui = state.explorerUI;
            let db = state.modelCatalog;
            let newEditState : boolean = (ui.mode === 'edit');
            if (newEditState != this._editing) {
                this._editing = newEditState;
                if (this._rendered) {
                    if (this._editing) this._setEditingInputs();
                    else this._unsetEditingInputs();
                }
            }
        }

        if (state.ui && state.ui.selected_datatransformationid) {
            let pdtid = PREFIX_URI + state.ui.selected_datatransformationid;
            if (this._dtid != pdtid) {
                this._dtid = pdtid;
                if (!this._loading[this._dtid] && !this._nloaded[this._dtid]) {
                    this._loading[this._dtid] = true;
                    store.dispatch(dataTransformationGet(this._dtid)).then((dt:DataTransformation) => {
                        this._loading[this._dtid] = false;
                        this._nloaded[this._dtid] = false;
                        this._dts[this._dtid] = dt;
                        this._inputSI.setResources(dt.hasSoftwareImage);
                        this._inputParameters.setResources(dt.hasParameter);
                        this._inputOutputs.setResources(dt.hasOutput);
                        //this._inputRegion.setResources(dt.hasRegion); FIXME
                        this.requestUpdate();
                    });
                }
            }
        }
    }
}
