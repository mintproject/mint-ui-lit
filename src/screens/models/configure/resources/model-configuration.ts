import { ModelCatalogResource } from "./resource";
import { html, customElement, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import {
  Parameter,
  DatasetSpecification,
  SoftwareVersion,
  ModelConfiguration,
  ModelConfigurationFromJSON,
} from "@mintproject/modelcatalog_client";
import { renderExternalLink } from "util/ui_renders";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";

import { ModelCatalogPerson } from "./person";
import { ModelCatalogGrid } from "./grid";
import { ModelCatalogNumericalIndex } from "./numerical-index";
import { ModelCatalogCategory } from "./model-category";
import { ModelCatalogSoftwareImage } from "./software-image";
import { ModelCatalogTimeInterval } from "./time-interval";
import { ModelCatalogRegion } from "./region";
import { ModelCatalogProcess } from "./process";
import { ModelCatalogParameter } from "./parameter";
import { ModelCatalogDatasetSpecification } from "./dataset-specification";
import { ModelCatalogSourceCode } from "./source-code";
import { ModelCatalogConstraint } from "./constraint";

import { Textfield } from "weightless/textfield";
import { Textarea } from "weightless/textarea";
import { Select } from "weightless/select";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";
import { ModelCatalogTapisApp } from "./tapis-app";
import { MINT_PREFERENCES } from "config";

@customElement("model-catalog-model-configuration")
export class ModelCatalogModelConfiguration extends connect(store)(
  ModelCatalogResource
)<ModelConfiguration> {
  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      this.getBasicStyles(),
      css`
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

        .details-table > tbody > tr > td > input,
        textarea {
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
      `,
    ];
  }

  protected classes: string = "resource configuration";
  protected name: string = "configuration";
  protected pname: string = "configurations";

  protected resourceApi: DefaultReduxApi<ModelConfiguration, BaseAPI> =
    ModelCatalogApi.myCatalog.modelConfiguration;

  protected resourcePost = (r: ModelConfiguration) => {
    return this.resourceApi.post(r, this._parentVersion?.id);
  };

  public pageMax: number = 10;
  private _loadingTapisApp: boolean;

  private _parentVersion: SoftwareVersion;

  private _inputAuthor: ModelCatalogPerson;
  private _inputGrid: ModelCatalogGrid;
  private _inputTimeInterval: ModelCatalogTimeInterval;
  private _inputIndex: ModelCatalogNumericalIndex;
  private _inputCategory: ModelCatalogCategory;
  private _inputRegion: ModelCatalogRegion;
  private _inputProcesses: ModelCatalogProcess;
  private _inputSoftwareImage: ModelCatalogSoftwareImage;
  private _inputTapisApp: ModelCatalogTapisApp;

  private _inputParameter: ModelCatalogParameter;
  private _inputDSInput: ModelCatalogDatasetSpecification;
  private _inputDSOutput: ModelCatalogDatasetSpecification;
  private _inputSourceCode: ModelCatalogSourceCode;
  private _inputConstraint: ModelCatalogConstraint;

  constructor() {
    super();
  }

  protected _initializeSingleMode() {
    this._loadingTapisApp = MINT_PREFERENCES.execution_component_from_tapis && MINT_PREFERENCES.execution_component_from_tapis_tenant !== undefined;
    this._inputAuthor = new ModelCatalogPerson();
    this._inputGrid = new ModelCatalogGrid();
    this._inputTimeInterval = new ModelCatalogTimeInterval();
    this._inputIndex = new ModelCatalogNumericalIndex();
    this._inputCategory = new ModelCatalogCategory();
    this._inputRegion = new ModelCatalogRegion();
    this._inputProcesses = new ModelCatalogProcess();
    this._inputSoftwareImage = new ModelCatalogSoftwareImage();
    this._inputTapisApp = new ModelCatalogTapisApp();
    this._inputSourceCode = new ModelCatalogSourceCode();
    this._inputConstraint = new ModelCatalogConstraint();

    this._inputParameter = new ModelCatalogParameter();
    this._inputParameter.inline = false;
    this._inputParameter.lazy = true;

    this._inputDSInput = new ModelCatalogDatasetSpecification();
    this._inputDSInput.inline = false;
    this._inputDSInput.lazy = true;

    this._inputDSOutput = new ModelCatalogDatasetSpecification();
    this._inputDSOutput.inline = false;
    this._inputDSOutput.lazy = true;

    this._inputTapisApp.disableEdition();
    this._inputTapisApp.disableCreation();
    this._inputTapisApp.disableDeletion();
  }

  protected _setSubResources(r: ModelConfiguration) {
    this._inputAuthor.setResources(r.author);
    this._inputGrid.setResources(r.hasGrid);
    this._inputTimeInterval.setResources(r.hasOutputTimeInterval);
    this._inputIndex.setResources(r.usefulForCalculatingIndex);
    this._inputCategory.setResources(r.hasModelCategory);
    this._inputRegion.setResources(r.hasRegion);
    this._inputProcesses.setResources(r.hasProcess);
    this._inputSoftwareImage.setResources(r.hasSoftwareImage);
    if (this._loadingTapisApp && r.hasComponentLocation?.[0]) {
      const tapisApp = this._inputTapisApp._fromUri(r.hasComponentLocation?.[0]);
      this._inputTapisApp.setResources([tapisApp]);
      this._inputParameter._addTapisApp(tapisApp);
    } else {
      this._inputTapisApp.setResources(null);
    }

    this._inputParameter.setResources(r.hasParameter);
    this._inputDSInput.setResources(r.hasInput);
    this._inputDSOutput.setResources(r.hasOutput);
    this._inputSourceCode.setResources(r.hasSourceCode);
    this._inputConstraint.setResources(r.hasConstraint);
  }

  protected _unsetSubResources() {
    if (this._singleModeInitialized) {
      this._inputAuthor.setResources(null);
      this._inputGrid.setResources(null);
      this._inputTimeInterval.setResources(null);
      this._inputIndex.setResources(null);
      this._inputCategory.setResources(null);
      this._inputRegion.setResources(null);
      this._inputProcesses.setResources(null);
      this._inputSoftwareImage.setResources(null);
      this._inputTapisApp.setResources(null);
      this._inputParameter.setResources(null);
      this._inputDSInput.setResources(null);
      this._inputDSOutput.setResources(null);
      this._inputSourceCode.setResources(null);
      this._inputConstraint.setResources(null);
    }
  }

  protected _setSubActions() {
    this._inputAuthor.setActionMultiselect();
    this._inputGrid.setActionSelect();
    this._inputIndex.setActionMultiselect();
    this._inputCategory.setActionMultiselect();
    this._inputTimeInterval.setActionSelect();
    this._inputRegion.setActionMultiselect();
    this._inputProcesses.setActionMultiselect();
    this._inputSoftwareImage.setActionSelect();
    this._inputTapisApp.setActionSelect();
    this._inputParameter.setActionEditOrAdd();
    this._inputDSInput.setActionEditOrAdd();
    this._inputDSOutput.setActionEditOrAdd();
    this._inputSourceCode.setActionSelect();
    this._inputConstraint.setActionMultiselect();
  }

  protected _unsetSubActions() {
    if (this._inputAuthor) this._inputAuthor.unsetAction();
    if (this._inputGrid) this._inputGrid.unsetAction();
    if (this._inputIndex) this._inputIndex.unsetAction();
    if (this._inputCategory) this._inputCategory.unsetAction();
    if (this._inputTimeInterval) this._inputTimeInterval.unsetAction();
    if (this._inputRegion) this._inputRegion.unsetAction();
    if (this._inputProcesses) this._inputProcesses.unsetAction();
    if (this._inputSoftwareImage) this._inputSoftwareImage.unsetAction();
    if (this._inputTapisApp) this._inputTapisApp.unsetAction();
    if (this._inputParameter) this._inputParameter.unsetAction();
    if (this._inputDSInput) this._inputDSInput.unsetAction();
    if (this._inputDSOutput) this._inputDSOutput.unsetAction();
    if (this._inputSourceCode) this._inputSourceCode.unsetAction();
    if (this._inputConstraint) this._inputConstraint.unsetAction();
  }

  private _parentInnerResourcesSet: boolean = false;
  public enableSingleResourceCreation(parentVersion: SoftwareVersion) {
    super.enableSingleResourceCreation();
    this._parentVersion = parentVersion;

    if (!this._parentInnerResourcesSet) {
      this._parentInnerResourcesSet = true;
      this._unsetSubResources();
      this._inputAuthor.setResources(this._parentVersion.author);
    }
  }

  public disableSingleResourceCreation() {
    super.disableSingleResourceCreation();
    this._parentInnerResourcesSet = false;
  }

  public enableDuplication(parentVersion: SoftwareVersion) {
    super.enableDuplication();
    this._parentVersion = parentVersion;
  }

  protected _duplicateInnerResources(
    r: ModelConfiguration
  ): Promise<ModelConfiguration> {
    return new Promise((resolve, reject) => {
      r.label = [r.label[0] + " (copy)"];
      r.hasSetup = undefined;
      let newParams: Promise<Parameter[]> =
        this._inputParameter.duplicateAllResources();
      let newIn: Promise<DatasetSpecification[]> =
        this._inputDSInput.duplicateAllResources();
      let newOut: Promise<DatasetSpecification[]> =
        this._inputDSOutput.duplicateAllResources();

      newParams.then((params: Parameter[]) => (r.hasParameter = params));
      newIn.then((inputs: DatasetSpecification[]) => (r.hasInput = inputs));
      newOut.then((outputs: DatasetSpecification[]) => (r.hasOutput = outputs));

      let allp = Promise.all([newParams, newIn, newOut]);
      allp.catch(reject);
      allp.then((_) => resolve(r));
    });
  }

  protected _renderFullResource(r: ModelConfiguration) {
    // Example, Type, operating system, versions?
    return html`
      <table class="details-table">
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tr>
          <td>Category:</td>
          <td>${this._inputCategory}</td>
        </tr>

        <tr>
          <td>Description:</td>
          <td>${r.description ? r.description[0] : ""}</td>
        </tr>

        ${r.shortDescription
          ? html` <tr>
              <td>Short description:</td>
              <td>${r.shortDescription[0]}</td>
            </tr>`
          : ""}

        <tr>
          <td>Keywords:</td>
          <td>${r.keywords ? r.keywords[0] : ""}</td>
        </tr>

        ${!this._loadingTapisApp ? html`
        <tr>
          <td>Source Code:</td>
          <td>${this._inputSourceCode}</td>
        </tr>
        ` : null}

        <tr>
          <td>Installation instructions:</td>
          <td>
            ${r.hasInstallationInstructions
              ? r.hasInstallationInstructions[0]
              : ""}
          </td>
        </tr>

        <tr>
          <td>Assumptions:</td>
          <td>${r.hasAssumption ? r.hasAssumption[0] : ""}</td>
        </tr>

        ${r.runtimeEstimation
          ? html` <tr>
              <td>Runtime Estimation:</td>
              <td>${r.runtimeEstimation ? r.runtimeEstimation[0] : ""}</td>
            </tr>`
          : ""}
        ${r.parameterization
          ? html` <tr>
              <td>Parameterization:</td>
              <td>${r.parameterization ? r.parameterization[0] : ""}</td>
            </tr>`
          : ""}
        ${r.limitations
          ? html` <tr>
              <td>Limitations:</td>
              <td>${r.limitations ? r.limitations[0] : ""}</td>
            </tr>`
          : ""}

        <tr>
          <td>Website:</td>
          <td>${r.website ? r.website[0] : ""}</td>
        </tr>

        <tr>
          <td>Configuration Creator:</td>
          <td>${this._inputAuthor}</td>
        </tr>

        <tr>
          <td>Region:</td>
          <td>${this._inputRegion}</td>
        </tr>

        ${!this._loadingTapisApp ? html`
        <tr>
          <td>Software Image:</td>
          <td>${this._inputSoftwareImage}</td>
        </tr>
        ` : null}
        <tr>
          <td>Component Location:</td>
          ${this._loadingTapisApp ? html`<td>${this._inputTapisApp}</td>` : html`
            <td>
              ${r && r.hasComponentLocation
              ? renderExternalLink(r.hasComponentLocation)
                : ""}
            </td>
          `}
        </tr>

        <tr>
          <td>Grid:</td>
          <td>${this._inputGrid}</td>
        </tr>

        <tr>
          <td>Time interval:</td>
          <td>${this._inputTimeInterval}</td>
        </tr>

        <tr>
          <td>Processes:</td>
          <td>${this._inputProcesses}</td>
        </tr>

        <tr>
          <td>Useful for calculating index:</td>
          <td>${this._inputIndex}</td>
        </tr>

        <tr>
          <td>Usage notes:</td>
          <td>${r && r.hasUsageNotes ? r.hasUsageNotes[0] : ""}</td>
        </tr>
      </table>

      <wl-title level="3" style="margin-top:1em"> Inputs: </wl-title>
      <wl-title level="4"> Parameters: </wl-title>
      ${this._inputParameter}

      <wl-title level="4" style="margin-top:1em"> Files: </wl-title>
      ${this._inputDSInput}

      <wl-title level="3" style="margin-top:1em"> Output files: </wl-title>
      ${this._inputDSOutput}
    `;
  }

  public scrollUp() {
    let head = this.shadowRoot.getElementById("page-top");
    if (head) head.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  protected _renderFullForm() {
    let edResource = this._getEditingResource();
    return html` <div id="page-top"></div>
      <table class="details-table">
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tr>
          <td colspan="2" style="padding: 5px 20px;">
            <wl-textfield
              id="i-label"
              label="Model name"
              value="${edResource && edResource.label
                ? edResource.label[0]
                : ""}"
              required
            ></wl-textfield>
          </td>
        </tr>

        <tr>
          <td>Category:</td>
          <td>${this._inputCategory}</td>
        </tr>

        <tr>
          <td>Full description:</td>
          <td>
            <textarea id="i-full-desc" name="Description" rows="5">
${edResource && edResource.description
                ? edResource.description[0]
                : ""}</textarea
            >
          </td>
        </tr>

        <tr>
          <td>Short description:</td>
          <td>
            <textarea id="i-short-desc" name="Short description" rows="3">
${edResource && edResource.shortDescription
                ? edResource.shortDescription[0]
                : ""}</textarea
            >
          </td>
        </tr>

        <tr>
          <td>Keywords:</td>
          <td>
            <wl-textfield
              id="i-keywords"
              name="Keywords"
              value="${edResource && edResource.keywords
                ? edResource.keywords[0]
                : ""}"
            ></wl-textfield>
          </td>
        </tr>

        ${!this._loadingTapisApp ? html`
        <tr>
          <td>Source Code:</td>
          <td>${this._inputSourceCode}</td>
        </tr>
        ` : null}

        <tr>
          <td>Installation instructions:</td>
          <td>
            <textarea
              id="i-install-instructions"
              name="Installation instructions"
              rows="5"
            >
${edResource && edResource.hasInstallationInstructions
                ? edResource.hasInstallationInstructions[0]
                : ""}</textarea
            >
          </td>
        </tr>

        <tr>
          <td>Assumptions:</td>
          <td>
            <textarea id="i-assumption" name="Assumptions" rows="3">
${edResource && edResource.hasAssumption
                ? edResource.hasAssumption[0]
                : ""}</textarea
            >
          </td>
        </tr>

        <tr>
          <td>Runtime Estimation:</td>
          <td>
            <wl-textfield
              id="i-runtime"
              name="Runtime Estimation"
              value="${edResource && edResource.runtimeEstimation
                ? edResource.runtimeEstimation[0]
                : ""}"
            ></wl-textfield>
          </td>
        </tr>

        <tr>
          <td>Parameterization:</td>
          <td>
            <wl-textfield
              id="i-parameterization"
              name="Parameterization"
              value="${edResource && edResource.parameterization
                ? edResource.parameterization[0]
                : ""}"
            ></wl-textfield>
          </td>
        </tr>

        <tr>
          <td>Limitations:</td>
          <td>
            <wl-textfield
              id="i-limitations"
              name="Limitations"
              value="${edResource && edResource.limitations
                ? edResource.limitations[0]
                : ""}"
            ></wl-textfield>
          </td>
        </tr>

        <tr>
          <td>Website:</td>
          <td>
            <wl-textfield
              id="i-website"
              name="Website"
              value="${edResource && edResource.website
                ? edResource.website[0]
                : ""}"
            >
            </wl-textfield>
          </td>
        </tr>

        <tr>
          <td>Configuration Creator:</td>
          <td>${this._inputAuthor}</td>
        </tr>

        <tr>
          <td>Region:</td>
          <td>${this._inputRegion}</td>
        </tr>

        ${!this._loadingTapisApp ? html`
        <tr>
          <td>Software Image:</td>
          <td>${this._inputSoftwareImage}</td>
        </tr>
        ` : null}

        <tr>
          <td>Component Location:</td>
          ${this._loadingTapisApp ? html`<td>${this._inputTapisApp}</td>` : html`
            <td>
              <textarea id="i-comploc" rows="2">
${edResource && edResource.hasComponentLocation
                  ? edResource.hasComponentLocation[0]
                  : ""}</textarea
              >
            </td>
          `}
        </tr>

        <tr>
          <td>Grid:</td>
          <td>${this._inputGrid}</td>
        </tr>

        <tr>
          <td>Time interval:</td>
          <td>${this._inputTimeInterval}</td>
        </tr>

        <tr>
          <td>Processes:</td>
          <td>${this._inputProcesses}</td>
        </tr>

        <tr>
          <td>Useful for calculating index:</td>
          <td>${this._inputIndex}</td>
        </tr>

        <tr>
          <td>Usage notes:</td>
          <td>
            <textarea id="i-usage-notes" rows="6">
${edResource && edResource.hasUsageNotes
                ? edResource.hasUsageNotes[0]
                : ""}</textarea
            >
          </td>
        </tr>

        <tr>
          <td>Tag</td>
          <td>
            <wl-select
              id="i-tag"
              name="Tag"
              value="${edResource && edResource.tag ? edResource.tag[0] : ""}"
            >
              <option value="">None</option>
              <option value="latest">Latest</option>
              <option value="deprecated">Deprecated</option>
              <option value="preferred">Preferred</option>
            </wl-select>
          </td>
        </tr>

        <tr>
          <td>Constraints:</td>
          <td>${this._inputConstraint}</td>
        </tr>
      </table>

      <wl-title level="3" style="margin-top:1em"> Inputs: </wl-title>
      <wl-title level="4"> Parameters: </wl-title>
      ${this._inputParameter}

      <wl-title level="4" style="margin-top:1em"> Files: </wl-title>
      ${this._inputDSInput}

      <wl-title level="3" style="margin-top:1em"> Output files: </wl-title>
      ${this._inputDSOutput}`;
  }

  protected _getResourceFromFullForm() {
    // Check position
    if (
      !this._inputParameter.isOrdered() &&
      confirm("Parameters are not ordered, use automatic order?")
    ) {
      this._inputParameter.forceOrder();
    }
    if (
      !this._inputDSInput.isOrdered() &&
      confirm("Inputs are not ordered, use automatic order?")
    ) {
      this._inputDSInput.forceOrder();
    }
    if (
      !this._inputDSOutput.isOrdered() &&
      confirm("Outputs are not ordered, use automatic order?")
    ) {
      this._inputDSOutput.forceOrder();
    }

    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "i-label"
    ) as Textfield;
    let inputKeywords: Textfield = this.shadowRoot.getElementById(
      "i-keywords"
    ) as Textfield;
    let inputShortDesc: Textarea = this.shadowRoot.getElementById(
      "i-short-desc"
    ) as Textarea;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "i-full-desc"
    ) as Textarea;
    let inputCompLoc: Textarea = this.shadowRoot.getElementById(
      "i-comploc"
    ) as Textarea;
    let inputWebsite: Textfield = this.shadowRoot.getElementById(
      "i-website"
    ) as Textfield;
    let inputInstallInstructions: Textarea = this.shadowRoot.getElementById(
      "i-install-instructions"
    ) as Textarea;
    let inputAssumption: Textarea = this.shadowRoot.getElementById(
      "i-assumption"
    ) as Textarea;
    let inputUsageNotes: Textarea = this.shadowRoot.getElementById(
      "i-usage-notes"
    ) as Textarea;
    let inputTag: Select = this.shadowRoot.getElementById("i-tag") as Select;

    let inputLicense: Textarea = this.shadowRoot.getElementById(
      "i-license"
    ) as Textarea;
    let inputCitation: Textarea = this.shadowRoot.getElementById(
      "i-citation"
    ) as Textarea;
    let inputPurpose: Textarea = this.shadowRoot.getElementById(
      "i-purpose"
    ) as Textarea;
    let inputExample: Textarea = this.shadowRoot.getElementById(
      "i-example"
    ) as Textarea;
    let inputDocumentation: Textfield = this.shadowRoot.getElementById(
      "i-documentation"
    ) as Textfield;
    let inputDownload: Textfield = this.shadowRoot.getElementById(
      "i-download"
    ) as Textfield;

    let inputRuntime: Textfield = this.shadowRoot.getElementById(
      "i-runtime"
    ) as Textfield;
    let inputParameterization: Textfield = this.shadowRoot.getElementById(
      "i-parameterization"
    ) as Textfield;
    let inputLimitations: Textfield = this.shadowRoot.getElementById(
      "i-limitations"
    ) as Textfield;

    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let keywords: string = inputKeywords ? inputKeywords.value : "";
    let shortDesc: string = inputShortDesc ? inputShortDesc.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";
    let comploc: string;
    if (this._loadingTapisApp && this._inputTapisApp.getResourceIdNotUri()?.[0]) {
      comploc = this._inputTapisApp._toUri(this._inputTapisApp.getResourceIdNotUri()?.[0]);
    } else {
      comploc = inputCompLoc ? inputCompLoc.value : "";
    }
    let website: string = inputWebsite ? inputWebsite.value : "";
    let installInstructions: string = inputInstallInstructions
      ? inputInstallInstructions.value
      : "";
    let assumptions: string = inputAssumption ? inputAssumption.value : "";
    let usageNotes: string = inputUsageNotes ? inputUsageNotes.value : "";
    let tag: string = inputTag ? inputTag.value : "";

    let license: string = inputLicense ? inputLicense.value : "";
    let citation: string = inputCitation ? inputCitation.value : "";
    let purpose: string = inputPurpose ? inputPurpose.value : "";
    let example: string = inputExample ? inputExample.value : "";
    let documentation: string = inputDocumentation
      ? inputDocumentation.value
      : "";
    let download: string = inputDownload ? inputDownload.value : "";

    let runtime: string = inputRuntime ? inputRuntime.value : "";
    let parameterization: string = inputParameterization
      ? inputParameterization.value
      : "";
    let limitations: string = inputLimitations ? inputLimitations.value : "";

    let categories = this._inputCategory.getResources();

    if (label && desc && categories != null && categories.length > 0) {
      let jsonRes = {
        label: [label],
        hasModelCategory: categories,
        description: [desc],
        author: this._inputAuthor.getResources(),
        usefulForCalculatingIndex: this._inputIndex.getResources(),
        hasRegion: this._inputRegion.getResources(),
        hasSoftwareImage: this._inputSoftwareImage.getResources(),
        hasProcess: this._inputProcesses.getResources(),
        hasOutputTimeInterval: this._inputTimeInterval.getResources(),
        hasGrid: this._inputGrid.getResources(),
        // this ones are temporal resources
        hasParameter: this._inputParameter.getResources(),
        hasInput: this._inputDSInput.getResources(),
        hasOutput: this._inputDSOutput.getResources(),
        hasSourceCode: this._inputSourceCode.getResources(),
        hasConstraint: this._inputConstraint.getResources(),
      };
      if (keywords) jsonRes["keywords"] = [keywords];
      if (shortDesc) jsonRes["shortDescription"] = [shortDesc];
      if (comploc) jsonRes["hasComponentLocation"] = [comploc];
      if (website) jsonRes["website"] = [website];
      if (installInstructions)
        jsonRes["hasInstallationInstructions"] = [installInstructions];
      if (assumptions) jsonRes["hasAssumption"] = [assumptions];
      if (usageNotes) jsonRes["hasUsageNotes"] = [usageNotes];
      if (tag) jsonRes["tag"] = [tag];
      else {
        let edResource = this._getEditingResource();
        if (edResource && edResource.tag) jsonRes["tag"] = [];
      }

      if (license) jsonRes["license"] = [license];
      if (citation) jsonRes["citation"] = [citation];
      if (purpose) jsonRes["hasPurpose"] = [purpose];
      if (example) jsonRes["hasExample"] = [example];
      if (documentation) jsonRes["hasDocumentation"] = [documentation];
      if (download) jsonRes["hasDownloadURL"] = [download];

      if (runtime) jsonRes["runtimeEstimation"] = [runtime];
      if (parameterization) jsonRes["parameterization"] = [parameterization];
      if (limitations) jsonRes["limitations"] = [limitations];

      return ModelConfigurationFromJSON(jsonRes);
    } else {
      // Show errors
      if (!label) {
        (<any>inputLabel).onBlur();
        this._notification.error("You must enter a name");
      }
      if (categories == null || categories.length === 0) {
        this._notification.error("You must enter a category");
      }
      if (!desc) {
        this._notification.error("You must enter a full description");
      }
    }
  }

  public clearForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "i-label"
    ) as Textfield;
    let inputKeywords: Textfield = this.shadowRoot.getElementById(
      "i-keywords"
    ) as Textfield;
    let inputShortDesc: Textarea = this.shadowRoot.getElementById(
      "i-short-desc"
    ) as Textarea;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "i-desc"
    ) as Textarea;
    let inputLicense: Textarea = this.shadowRoot.getElementById(
      "i-license"
    ) as Textarea;
    let inputCitation: Textarea = this.shadowRoot.getElementById(
      "i-citation"
    ) as Textarea;
    let inputPurpose: Textarea = this.shadowRoot.getElementById(
      "i-purpose"
    ) as Textarea;
    let inputExample: Textarea = this.shadowRoot.getElementById(
      "i-example"
    ) as Textarea;
    let inputUsageNotes: Textarea = this.shadowRoot.getElementById(
      "i-usage-notes"
    ) as Textarea;
    let inputWebsite: Textfield = this.shadowRoot.getElementById(
      "i-website"
    ) as Textfield;
    let inputDocumentation: Textfield = this.shadowRoot.getElementById(
      "i-documentation"
    ) as Textfield;
    let inputDownload: Textfield = this.shadowRoot.getElementById(
      "i-download"
    ) as Textfield;
    let inputInstallInstructions: Textfield = this.shadowRoot.getElementById(
      "i-install-instructions"
    ) as Textfield;

    if (inputLabel) inputLabel.value = "";
    if (inputKeywords) inputKeywords.value = "";
    if (inputShortDesc) inputShortDesc.value = "";
    if (inputDesc) inputDesc.value = "";
    if (inputLicense) inputLicense.value = "";
    if (inputCitation) inputCitation.value = "";
    if (inputPurpose) inputPurpose.value = "";
    if (inputExample) inputExample.value = "";
    if (inputUsageNotes) inputUsageNotes.value = "";
    if (inputWebsite) inputWebsite.value = "";
    if (inputDocumentation) inputDocumentation.value = "";
    if (inputDownload) inputDownload.value = "";
    if (inputInstallInstructions) inputInstallInstructions.value = "";
  }

  protected _createLazyInnerResources(r: ModelConfiguration) {
    return new Promise((resolve, reject) => {
      let copy: ModelConfiguration = { ...r };

      let reqParams: Promise<Parameter[]> = this._inputParameter.save();
      reqParams.then((params: Parameter[]) => (copy.hasParameter = params));

      let reqInput: Promise<DatasetSpecification[]> = this._inputDSInput.save();
      reqInput.then(
        (inputs: DatasetSpecification[]) => (copy.hasInput = inputs)
      );

      let reqOutput: Promise<DatasetSpecification[]> =
        this._inputDSOutput.save();
      reqOutput.then(
        (outputs: DatasetSpecification[]) => (copy.hasOutput = outputs)
      );

      let all: Promise<any> = Promise.all([reqParams, reqInput, reqOutput]);
      all.catch(reject);
      all.then((x: any) => {
        resolve(copy);
      });
    });
  }
}
