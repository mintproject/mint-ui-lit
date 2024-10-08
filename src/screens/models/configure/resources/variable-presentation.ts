import { ModelCatalogResource } from "./resource";
import { html, customElement, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";
import {
  VariablePresentation,
  VariablePresentationFromJSON,
  Unit,
} from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";

import { Textfield } from "weightless/textfield";
import { Textarea } from "weightless/textarea";
import { ModelCatalogStandardVariable } from "./standard-variable";
import { ModelCatalogUnit } from "./unit";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

@customElement("model-catalog-variable-presentation")
export class ModelCatalogVariablePresentation extends connect(store)(
  ModelCatalogResource
)<VariablePresentation> {
  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      this.getBasicStyles(),
      css`
        .small-tooltip:hover::after {
          width: min(max-content 200px);
        }
        #input-variable,
        #input-unit {
          --list-height: 200px;
          --dialog-height: 100%;
        }
        .inline-desc {
          display: none;
        }
        .two-inputs > wl-textfield,
        .two-inputs > wl-select,
        .two-inputs > span {
          display: inline-block;
          width: 50%;
        }
        .clickable-area > span > .inline-desc {
          display: inline-block;
          font-style: oblique;
          font-family: sans-serif;
          font-weight: 600;
          color: #777;
        }
      `,
    ];
  }

  protected classes: string = "resource variable-presentation";
  protected name: string = "variable presentation";
  protected pname: string = "variable presentations";

  protected resourceApi: DefaultReduxApi<VariablePresentation, BaseAPI> =
    ModelCatalogApi.myCatalog.variablePresentation;

  public uniqueLabel: boolean = true;

  private _inputStandardVariable: ModelCatalogStandardVariable;
  private _inputUnit: ModelCatalogUnit;

  private _allUnits: IdMap<Unit>;

  public pageMax: number = 10;
  public inlineMax: number = 4;

  constructor() {
    super();
    this._inputStandardVariable = new ModelCatalogStandardVariable();
    this._inputStandardVariable.setActionMultiselect();
    this._inputStandardVariable.setAttribute("id", "input-variable");

    this._inputUnit = new ModelCatalogUnit();
    this._inputUnit.setActionMultiselect();
    this._inputUnit.setAttribute("id", "input-unit");
    this._inputUnit.getAllResources().then((units: IdMap<Unit>) => {
      this._allUnits = units;
      //this._requestUpdate();
    });
  }

  protected _checkLabelUniq(resource: VariablePresentation) {
    let label: string = getLabel(resource).toLowerCase();
    let unitIds: string[] =
      resource.usesUnit && resource.usesUnit.length > 0
        ? resource.usesUnit.map((u: Unit) => u.id)
        : [];
    return !Object.values(this._loadedResources).some(
      (r: VariablePresentation) =>
        r &&
        r.label &&
        r.label.some((name: string) => name.toLowerCase() == label) &&
        ((unitIds.length === 0 && (!r.usesUnit || r.usesUnit.length === 0)) ||
          (unitIds.length === r.usesUnit.length &&
            r.usesUnit
              .map((u: Unit) => u.id)
              .every((id: string) => unitIds.includes(id))))
    );
  }

  protected _uniqueLabelError(resource: VariablePresentation) {
    this._notification.error(
      'The variable "' +
        getLabel(resource) +
        '" with the same units is already on the catalog.'
    );
  }

  protected _editResource(r: VariablePresentation) {
    super._editResource(r);
    let edResource = this._getEditingResource();
    this._inputStandardVariable.setResources(edResource.hasStandardVariable);
    this._inputUnit.setResources(edResource.usesUnit);
  }

  protected _createResource() {
    this._inputStandardVariable.setResources(null);
    this._inputUnit.setResources(null);
    super._createResource();
  }

  /*
export interface VariablePresentation {
    id?: string;
    type?: Array<string> | null;
    label?: Array<string> | null;
    description?: Array<string> | null;
    hasShortName?: Array<string> | null;
    hasLongName?: Array<string> | null;

    hasStandardVariable?: Array<StandardVariable> | null;
    usesUnit?: Array<Unit> | null;

    hasMinimumAcceptedValue?: Array<string> | null;     
    hasMaximumAcceptedValue?: Array<string> | null;
    hasConstraint?: Array<string> | null;

    hasDefaultValue?: Array<string> | null;
    partOfDataset?: Array<DatasetSpecification> | null; //NO
}
*/

  protected _renderForm() {
    let edResource = this._getEditingResource();
    return html` <div style="font-weight: bold; padding: 5px;">
        Please prefer to create a new variable instead of editing the units of
        an existing one.
      </div>
      <form>
        <wl-textfield
          id="var-label"
          label="Name"
          required
          value=${edResource ? getLabel(edResource) : ""}
        >
        </wl-textfield>
        <wl-textarea
          id="var-desc"
          label="Description"
          value=${edResource && edResource.description
            ? edResource.description[0]
            : ""}
        >
        </wl-textarea>
        <div class="two-inputs">
          <wl-textfield
            id="var-short-name"
            label="Short Name"
            value=${edResource && edResource.hasShortName
              ? edResource.hasShortName[0]
              : ""}
          >
          </wl-textfield>
          <wl-textfield
            id="var-long-name"
            label="Long Name"
            value=${edResource && edResource.hasLongName
              ? edResource.hasLongName[0]
              : ""}
          >
          </wl-textfield>
        </div>
        <div class="two-inputs">
          <wl-textfield
            id="var-min"
            label="Minimum Accepted Value"
            value=${edResource && edResource.hasMinimumAcceptedValue
              ? edResource.hasMinimumAcceptedValue[0]
              : ""}
          >
          </wl-textfield>
          <wl-textfield
            id="var-max"
            label="Maximum Accepted Value"
            value=${edResource && edResource.hasMaximumAcceptedValue
              ? edResource.hasMaximumAcceptedValue[0]
              : ""}
          >
          </wl-textfield>
        </div>
        <div style="padding: 5px 0px;">
          <div style="padding: 5px 0px; font-weight: bold;">
            Standard Variables:
          </div>
          ${this._inputStandardVariable}
        </div>
        <div style="padding: 5px 0px;">
          <div style="padding: 5px 0px; font-weight: bold;">Units:</div>
          ${this._inputUnit}
        </div>
      </form>`;
  }

  protected _renderResource(r: VariablePresentation) {
    if (r) {
      let desc: string =
        r.description && r.description.length > 0 ? r.description[0] : "";
      let label: string = getLabel(r).replaceAll("_", " ");
      let units: string =
        r.usesUnit && r.usesUnit.length > 0 && this._allUnits != null
          ? r.usesUnit
              .map((u: Unit) =>
                u.id && this._allUnits[u.id]
                  ? getLabel(this._allUnits[u.id])
                  : ""
              )
              .join(", ")
          : "";
      if (r.usesUnit && r.usesUnit.length > 0 && !units) {
        units = r.usesUnit[0].id.replace(/.+\//, "");
        if (units.length > 8) units = "";
      }
      return html`
        <span
          class="${desc ? "tooltip small-tooltip" : ""}"
          tip="${desc}"
          style="display: flex; justify-content: space-between;"
        >
          <span>${label}</span>
          <span>${units ? html`&nbsp;(${units})` : ""}</span>
        </span>
        ${desc ? html`<span class="inline-desc">${desc}</span>` : ""}
      `;
    } else return html`--`;
  }

  protected _getResourceFromForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "var-label"
    ) as Textfield;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "var-desc"
    ) as Textarea;
    let inputShort: Textfield = this.shadowRoot.getElementById(
      "var-short-name"
    ) as Textfield;
    let inputLong: Textfield = this.shadowRoot.getElementById(
      "var-long-name"
    ) as Textfield;
    let inputMin: Textfield = this.shadowRoot.getElementById(
      "var-min"
    ) as Textfield;
    let inputMax: Textfield = this.shadowRoot.getElementById(
      "var-max"
    ) as Textfield;

    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";
    let shortName: string = inputShort ? inputShort.value : "";
    let longName: string = inputLong ? inputLong.value : "";
    let min: string = inputMin ? inputMin.value : "";
    let max: string = inputMax ? inputMax.value : "";

    if (label) {
      let jsonRes = {
        type: ["VariablePresentation"],
        label: [label],
        usesUnit: this._inputUnit.getResources(),
        hasStandardVariable: this._inputStandardVariable.getResources(),
      };
      /*if (desc) jsonRes["description"] = [desc];
            if (shortName) jsonRes["hasShortName"] = [shortName];
            if (longName) jsonRes["hasLongName"] = [longName];*/

      jsonRes["description"] = desc ? [desc] : [];
      jsonRes["hasShortName"] = shortName ? [shortName] : [];
      jsonRes["hasLongName"] = longName ? [longName] : [];
      jsonRes["hasMinimumAcceptedValue"] = min ? [min] : [];
      jsonRes["hasMaximumAcceptedValue"] = max ? [max] : [];

      return VariablePresentationFromJSON(jsonRes);
    } else {
      // Show errors
      if (!label) (<any>inputLabel).onBlur();
    }
  }
}
