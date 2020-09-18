import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';
import { CustomNotification } from 'components/notification';

import './configure/resources/person';
import './configure/resources/grid';
import './configure/resources/numerical-index';

import { ModelCatalogPerson } from './configure/resources/person';
import { ModelCatalogGrid } from './configure/resources/grid';
import { ModelCatalogFundingInformation } from './configure/resources/funding-information';
import { ModelCatalogVisualization } from './configure/resources/visualization';
import { ModelCatalogNumericalIndex } from './configure/resources/numerical-index';
import { ModelCatalogModel } from './configure/resources/model';

import { renderNotifications } from "util/ui_renders";
import { showNotification } from 'util/ui_functions';

import { modelGet, modelPost, modelPut, versionPost } from 'model-catalog/actions';
import { Model, Person, ModelFromJSON, SoftwareVersion, SoftwareVersionFromJSON } from '@mintproject/modelcatalog_client';
import { getId, getLabel } from 'model-catalog/util';

import 'components/loading-dots'
import "weightless/title";
import "weightless/icon";
import "weightless/select";
import "weightless/textfield";

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('models-register')
export class ModelsRegister extends connect(store)(PageViewElement) {
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

            .step {
                border: 2px solid darkgray;
                border-radius: 5px;
                padding: 5px 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 5px 0px;
            }

            .step[active] {
                background: rgba(127, 191, 63, 0.2);
            }

            .step[active]:hover {
                background: rgba(127, 191, 63, 0.3);
            }

            .step[disabled] {
                background: rgba(62, 62, 62, 0.3);
                cursor: not-allowed;
            }
        `];
    }

    @property({type: Boolean})
    private _hideLateral : boolean = true;

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _modelid : string = "";

    @property({type: Number})
    private _step : number = 0;

    @property({type: Object})
    private _model : Model;

    private _iModel : ModelCatalogModel;

    private _inputAuthor : ModelCatalogPerson;
    private _inputContributor : ModelCatalogPerson;
    private _inputContactPerson : ModelCatalogPerson;
    private _inputGrid : ModelCatalogGrid;
    private _inputFunding : ModelCatalogFundingInformation;
    private _inputVisualization : ModelCatalogVisualization;
    private _inputIndex : ModelCatalogNumericalIndex;
    private _notifications : CustomNotification;

    public constructor () {
        super();
        this._iModel = new ModelCatalogModel();
        this._iModel.enableSingleResourceCreation();

        this._inputAuthor = new ModelCatalogPerson();
        this._inputContributor = new ModelCatalogPerson();
        this._inputContactPerson = new ModelCatalogPerson();
        this._inputGrid = new ModelCatalogGrid();
        this._inputFunding = new ModelCatalogFundingInformation();
        this._inputVisualization = new ModelCatalogVisualization();
        this._inputIndex = new ModelCatalogNumericalIndex();
        this._notifications = new CustomNotification();

        [this._inputAuthor, this._inputContributor, this._inputContactPerson, this._inputVisualization, this._inputIndex]
                .forEach((input) => input.setActionMultiselect());
        [this._inputGrid, this._inputFunding]
                .forEach((input) => input.setActionSelect());
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    ${this._renderSteps()}
                </div>
            </div>
            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <div style="height: 24px;" id="page-top">
                        <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                            class="actionIcon bigActionIcon" style="float:right">
                            ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                        </wl-icon>
                    </div>
                    <wl-title level="4">
                        To register a new model, please fill the following form:
                    </wl-title>
                    ${this._iModel}
                    <!--
                    {this._renderStepForm()}
                    <div class="footer">
                        <wl-button @click="{this._onContinueButtonClicked}" .disabled="{this._waiting}">
                            continue 
                            {this._waiting ? html<loading-dots style="--width: 20px; margin-left: 5px;"></loading-dots> : ''}
                        </wl-button>
                    </div-->
                </div>
            </div>
        </div>
        ${this._notifications}
        `
    }

    private _scrollUp () {
        let head = this.shadowRoot.getElementById('page-top');
        if (head) head.scrollIntoView({behavior: "smooth", block: "start"})
    }

    private _renderSteps () {
        return html`
            <wl-title level="4">
                Steps for creating a new model:
            </wl-title>
            <div class="step" ?active="${this._step <= 1}" ?disabled="${this._step > 1}">
                <div>
                    <wl-title level="3"> Step 1: </wl-title>
                    <div>Describe your model</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" ?active="${this._step == 2}" ?disabled="${this._step < 2}">
                <div>
                    <wl-title level="3"> Step 2: </wl-title>
                    <div>Make your model discoverable</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>

            <div class="step" ?active="${this._step == 3}" ?disabled="${this._step < 3}">
                <div>
                    <wl-title level="3"> Step 3: </wl-title>
                    <div>Register a initial version</div>
                </div>
                <div>
                    <wl-icon>library_books</wl-icon>
                </div>
            </div>
        `;
    }

    private _renderStepForm () {
        if (this._step <= 1) {
            return this._renderStepOne();
        } else if (this._step == 2) {
            return this._renderStepTwo();
        } else if (this._step == 3) {
            return this._renderStepThree();
        }
    }

    private _renderStepOne () {
        let m = this._model;
        return html`
            <wl-title level="2">Describe your model</wl-title>

            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="m-name" label="Model name" required
                            value="${m ? getLabel(m) : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Category:</td>
                    <td>
                        <wl-select id="m-category" name="Category" required
                            value="${m && m.hasModelCategory && m.hasModelCategory.length > 0 ? m.hasModelCategory[0] : ''}">
                            <option value="">None</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Hydrology">Hydrology</option>
                            <option value="Economy">Economy</option>
                            <option value="Weather">Weather</option>
                            <option value="Land Use">Land Use</option>
                        </wl-select>
                    </td>
                </tr>

                <tr>
                    <td>Short description:</td>
                    <td>
                        <textarea id="m-short-desc" name="Short description" rows="3">${m && m.shortDescription ? m.shortDescription[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Full description:</td>
                    <td>
                        <textarea id="m-desc" name="Description" rows="5">${m && m.description ? m.description[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Example:</td>
                    <td>
                        <textarea id="m-example" name="Example" rows="4">${m && m.hasExample ? m.hasExample[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Keywords:</td>
                    <td>
                        <wl-textfield id="m-keywords" name="Keywords" value="${m && m.keywords ? m.keywords[0] : ''}"/>
                    </td>
                </tr>

                <tr>
                    <td>License:</td>
                    <td>
                        <textarea id="m-license" name="License" rows="2">${m && m.license ? m.license[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Citation:</td>
                    <td>
                        <textarea id="m-citation" name="Citation" rows="2">${m && m.citation ? m.citation[0] : ''}</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Website:</td>
                    <td>
                        <wl-textfield id="m-website" name="Website" value="${m && m.website ? m.website[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Documentation page:</td>
                    <td>
                        <wl-textfield id="m-documentation" name="Documentation" value="${m && m.hasDocumentation ? m.hasDocumentation[0] : ''}"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Model creator:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Contributors:</td>
                    <td>
                        ${this._inputContributor}
                    </td>
                </tr>

                <tr>
                    <td>Contact person:</td>
                    <td>
                        ${this._inputContactPerson}
                    </td>
                </tr>

                <tr>
                    <td>Grid:</td>
                    <td>
                        ${this._inputGrid}
                    </td>
                </tr>

                <tr>
                    <td>Funding:</td>
                    <td>
                        ${this._inputFunding}
                    </td>
                </tr>

                <tr>
                    <td>Visualizations:</td>
                    <td>
                        ${this._inputVisualization}
                    </td>
                </tr>
            </table>
        `;
    }

    private _renderStepTwo () {
        return html`
            <wl-title level="2">Make your model discoverable</wl-title>
            ${this._model ? html`<wl-title level="3">${getLabel(this._model)}</wl-title>` : ''}

            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td>Purpose:</td>
                    <td>
                        <textarea id="m-purpose" name="Purpose" rows="3"></textarea>
                    </td>
                </tr>
                <tr>
                    <td>Useful for calculating index:</td>
                    <td>
                        ${this._inputIndex}
                    </td>
                </tr>
            </table>
            `
    }

    private _renderStepThree () {
        return html`
            <wl-title level="2">Register an initial version for your model</wl-title>
            ${this._model ? html`<wl-title level="3">${getLabel(this._model)}</wl-title>` : ''}
            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="v-name" label="Version name" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        <textarea id="v-desc" name="Description" rows="5"></textarea>
                    </td>
                </tr>

                <tr>
                    <td>Version creator:</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <td>Tag</td>
                <td>
                    <wl-select id="v-tag" name="Tag" value="latest">
                        <option value="">None</option>
                        <option value="latest">Latest</option>
                        <option value="deprecated">Deprecated</option>
                    </wl-select>
                </td>
            </table>
        `
    }

    private _getVersionFromForm () {
        let inputLabel : Textfield = this.shadowRoot.getElementById('v-name') as Textfield;
        let inputDesc : Textarea = this.shadowRoot.getElementById("v-desc") as Textarea;
        let inputTag : Select = this.shadowRoot.getElementById("v-tag") as Select;

        let label : string = inputLabel ? inputLabel.value : '';
        let desc  : string = inputDesc ? inputDesc.value : '';
        let tag : string = inputTag ? inputTag.value : '';

        if (label && desc && tag) {
            let jsonRes = {
                type: ["SoftwareVersion"],
                label: [label],
                description: [desc],
                author: this._inputAuthor.getResources()
            };
            return SoftwareVersionFromJSON(jsonRes);
        } else {
            this._scrollUp();
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            if (!tag) (<any>inputTag).onBlur();
            this._notifications.error("You must specify a name, description and tag for your initial version.");
        }
    }

    private _getResourceFromForm () {
        let inputLabel : Textfield = this.shadowRoot.getElementById('m-name') as Textfield;
        let inputCategory : Select = this.shadowRoot.getElementById('m-category') as Select;
        let inputShortDesc : Textarea = this.shadowRoot.getElementById("m-short-desc") as Textarea;
        let inputDesc : Textarea = this.shadowRoot.getElementById("m-desc") as Textarea;
        let inputExample : Textarea = this.shadowRoot.getElementById("m-example") as Textarea;
        let inputKeywords : Textfield = this.shadowRoot.getElementById("m-keywords") as Textfield;
        let inputLicense : Textarea = this.shadowRoot.getElementById("m-license") as Textarea;
        let inputCitation : Textarea = this.shadowRoot.getElementById("m-citation") as Textarea;
        let inputWebsite : Textfield = this.shadowRoot.getElementById("m-website") as Textfield;
        let inputDocumentation : Textfield = this.shadowRoot.getElementById("m-documentation") as Textfield;

        let label : string = inputLabel ? inputLabel.value : '';
        let category  : string =       inputCategory?     inputCategory.value : '';
        let shortDesc  : string =      inputShortDesc?    inputShortDesc.value : '';
        let desc  : string =           inputDesc?         inputDesc.value : '';
        let example  : string =        inputExample?      inputExample.value : '';
        let keywords  : string =       inputKeywords?     inputKeywords.value : '';
        let license  : string =        inputLicense?      inputLicense .value : '';
        let citation  : string =       inputCitation?     inputCitation.value : '';
        let website  : string =        inputWebsite?      inputWebsite.value : '';
        let documentation  : string =  inputDocumentation? inputDocumentation.value : '';

        if (label && desc && category) {
            let jsonRes = {
                type: ["Model"],
                label: [label],
                hasModelCategory: [category],
                description: [desc],
                contributor: this._inputContributor.getResources(),
                hasContactPerson: this._inputContactPerson.getResources(),
                author: this._inputAuthor.getResources(),
                hasGrid: this._inputGrid.getResources(),
                hasFunding: this._inputFunding.getResources(),
                hasSampleVisualization: this._inputVisualization.getResources(),
            };
            if (shortDesc) jsonRes["shortDescription"] = [shortDesc];
            if (example) jsonRes["hasExample"] = [example];
            if (keywords) jsonRes["keywords"] = [keywords];
            if (license) jsonRes["license"] = [license];
            if (citation) jsonRes["citation"] = [citation];
            if (website) jsonRes["website"] = [website];
            if (documentation) jsonRes["hasDocumentation"] = [documentation];
            //TODO:DATE

            return ModelFromJSON(jsonRes);
        } else {
            this._scrollUp();
            if (!label) (<any>inputLabel).onBlur();
            if (!category) (<any>inputCategory).onBlur();
            this._notifications.error("You must specify a name and category for your model.");
        }
    }

    private _getStep2FromForm () {
        let inputPurpose : Textarea = this.shadowRoot.getElementById("m-purpose") as Textarea;
        let purpose  : string = inputPurpose ? inputPurpose.value : '';

        if (purpose) {
            let jsonRes = { ...this._model };
            jsonRes['hasPurpose'] = [purpose];
            jsonRes['usefulForCalculatingIndex'] = this._inputIndex.getResources()
            return ModelFromJSON(jsonRes);
        } else {
            this._scrollUp();
            this._notifications.error("You must specify a purpose for your model.");
        }
    }

    private _onContinueButtonClicked () {
        if (this._step <= 1) {
            let newModel = this._getResourceFromForm();
            if (newModel) {
                this._waiting = true;
                let req = store.dispatch(modelPost(newModel));
                req.then((model:Model) => {
                    this._waiting = false;
                    this._notifications.save("Model saved");
                    let url = 'models/register/' + getId(model) + '/2';
                    goToPage(url);
                });
                req.catch((error) => {
                    this._waiting = false;
                    this._notifications.error("An error has ocurred trying to save the model.");
                });
            }
        } else if (this._step == 2) {
            let step2Model = this._getStep2FromForm();
            if (step2Model) {
                this._waiting = true;
                let req = store.dispatch(modelPut(step2Model));
                req.then((model:Model) => {
                    this._waiting = false;
                    this._notifications.save("Model updated");
                    let url = 'models/register/' + getId(model) + '/3';
                    goToPage(url);
                });
            }
        } else if (this._step == 3) {
            let newVer = this._getVersionFromForm();
            if (newVer) {
                this._waiting = true;
                let req = store.dispatch(versionPost(newVer));
                req.then((ver: SoftwareVersion) => {
                    this._notifications.save("Version saved");
                    let newModel = { ...this._model, hasVersion: [ver]};
                    let req2 = store.dispatch(modelPut(newModel)).then((model:Model) => {
                        this._waiting = false;
                        this._notifications.save("Model updated");
                        let url = 'models/explore/' + getId(model);
                        goToPage(url);
                    });
                });
            }
        }
    }

    private _setModelStepOne () {
        let m = this._model;
        if (m) {
            if (m.contributor && m.contributor.length > 0)                          this._inputContributor.setResources(m.contributor);
            if (m.hasContactPerson && m.hasContactPerson.length > 0)                this._inputContactPerson.setResources(m.hasContactPerson);
            if (m.author && m.author.length > 0)                                    this._inputAuthor.setResources(m.author);
            if (m.hasGrid && m.hasGrid.length > 0)                                  this._inputGrid.setResources(m.hasGrid);
            if (m.hasFunding && m.hasFunding.length > 0)                            this._inputFunding.setResources(m.hasFunding);
            if (m.hasSampleVisualization && m.hasSampleVisualization.length > 0)    this._inputVisualization.setResources(m.hasSampleVisualization);
        }
    }

    private _clearForms () {
        [this._inputAuthor, this._inputContributor, this._inputContactPerson,
         this._inputGrid, this._inputFunding, this._inputVisualization]
            .forEach((input) => input.setResources(null));

        let inputLabel : Textfield = this.shadowRoot.getElementById('m-name') as Textfield;
        let inputCategory : Select = this.shadowRoot.getElementById('m-category') as Select;
        let inputShortDesc : Textarea = this.shadowRoot.getElementById("m-short-desc") as Textarea;
        let inputDesc : Textarea = this.shadowRoot.getElementById("m-desc") as Textarea;
        let inputExample : Textarea = this.shadowRoot.getElementById("m-example") as Textarea;
        let inputKeywords : Textfield = this.shadowRoot.getElementById("m-keywords") as Textfield;
        let inputLicense : Textarea = this.shadowRoot.getElementById("m-license") as Textarea;
        let inputCitation : Textarea = this.shadowRoot.getElementById("m-citation") as Textarea;
        let inputWebsite : Textfield = this.shadowRoot.getElementById("m-website") as Textfield;
        let inputDocumentation : Textfield = this.shadowRoot.getElementById("m-documentation") as Textfield;

        if (inputLabel) inputLabel.value = "";
        if (inputCategory) inputCategory.value = "";
        if (inputShortDesc) inputShortDesc.value = "";
        if (inputDesc) inputDesc.value = "";
        if (inputExample) inputExample.value = "";
        if (inputKeywords) inputKeywords.value = "";
        if (inputLicense) inputLicense.value = "";
        if (inputCitation) inputCitation.value = "";
        if (inputWebsite) inputWebsite.value = "";
        if (inputDocumentation) inputDocumentation.value = "";
    }

    private _shouldClear : boolean = false;
    stateChanged(state: RootState) {
        if (state.app) {
            if (state.app.subpage === 'register') {
                if (this._shouldClear) {
                    this._iModel.enableSingleResourceCreation();
                    //this._clearForms();
                }
            } else {
                this._shouldClear = true;
            }
        } 

        /*if (state.explorerUI) {
            let ui = state.explorerUI;
            let db = state.modelCatalog;
            this._modelid = ui.selectedModel;
            this._step = ui.step;
            if (!this._model && this._modelid) {
                if (db && db.models && db.models[this._modelid]) {
                    console.log('model loaded!');
                    this._model = db.models[this._modelid];
                    if (this._step <= 1) this._setModelStepOne();
                    this._inputAuthor.setResources(
                        (this._model.author||[]).filter((a:Person) => a.type.includes('Person'))
                    );
                } else {
                    /*store.dispatch(modelGet(this._modelid)).then((model:Model) => {
                        this._model = model;
                        console.log('loading');
                    });
                }
            }
        }*/

    }
}
