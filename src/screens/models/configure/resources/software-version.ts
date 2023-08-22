import { ModelCatalogResource } from "./resource";
import { html, customElement, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "app/store";
import { getLabel } from "model-catalog-api/util";
import {
  SoftwareVersion,
  SoftwareVersionFromJSON,
  Model,
} from "@mintproject/modelcatalog_client";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";

import { ModelCatalogPerson } from "./person";

import { Textfield } from "weightless/textfield";
import { Textarea } from "weightless/textarea";
import { Select } from "weightless/select";

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

const TAG_OPTIONS = ["latest", "deprecated"];

@customElement("model-catalog-software-version")
export class ModelCatalogSoftwareVersion extends connect(store)(
  ModelCatalogResource
)<SoftwareVersion> {
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

  protected classes: string = "resource software-version";
  protected name: string = "software version";
  protected pname: string = "Software Version";

  protected resourceApi: DefaultReduxApi<SoftwareVersion, BaseAPI> =
    ModelCatalogApi.myCatalog.softwareVersion;

  protected resourcePost = (r: SoftwareVersion) => {
    return this.resourceApi.post(r, this._parentModel?.id);
  };

  public pageMax: number = 10;

  private _inputAuthor: ModelCatalogPerson;
  private _parentModel: Model;

  constructor() {
    super();
  }

  protected _initializeSingleMode() {
    this._inputAuthor = new ModelCatalogPerson();
  }

  public setResource(r: SoftwareVersion) {
    let req = super.setResource(r);
    req.then((ver: SoftwareVersion) => {
      if (ver) {
        this._inputAuthor.setResources(ver.author);
      }
    });
    return req;
  }

  protected _editResource(r: SoftwareVersion) {
    super._editResource(r);
    this._inputAuthor.setActionMultiselect();
  }

  protected _clearStatus() {
    super._clearStatus();
    if (this._inputAuthor) this._inputAuthor.unsetAction();
  }

  public enableSingleResourceCreation(parentModel: Model) {
    super.enableSingleResourceCreation();
    this._parentModel = parentModel;
    this._inputAuthor.setResources(null);
    this._inputAuthor.setActionMultiselect();
  }

  protected _renderFullResource(r: SoftwareVersion) {
    return html`
            <table class="details-table">
                <colgroup wir.="150px">
                <!--tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-title level="3"> {getLabel(r)} </wl-title>
                    </td>
                </tr-->

                <tr>
                    <td>Description:</td>
                    <td>
                        ${r.description ? r.description[0] : ""}
                    </td>
                </tr>

                <tr>
                    <td>Keywords</td>
                    <td>
                        ${r.keywords ? r.keywords[0] : ""}
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Version number</td>
                    <td>
                        ${r.hasVersionId ? r.hasVersionId[0] : ""}
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        ${r.hasUsageNotes ? r.hasUsageNotes[0] : ""}
                    </td>
                </tr>

                ${
                  r.website
                    ? html` <tr>
                        <td>Website URL</td>
                        <td>
                          <a href="${r.website[0]}">${r.website[0]}</a>
                        </td>
                      </tr>`
                    : ""
                }

                ${
                  r.hasDocumentation
                    ? html` <tr>
                        <td>Documentation URL</td>
                        <td>
                          <a href="${r.hasDocumentation[0]}"
                            >${r.hasDocumentation[0]}</a
                          >
                        </td>
                      </tr>`
                    : ""
                }

                ${
                  r.hasDownloadURL
                    ? html` <tr>
                        <td>Download URL</td>
                        <td>
                          <a href="${r.hasDownloadURL[0]}"
                            >${r.hasDownloadURL[0]}</a
                          >
                        </td>
                      </tr>`
                    : ""
                }

                ${
                  r.hasInstallationInstructions
                    ? html` <tr>
                        <td>Installation instructions URL</td>
                        <td>
                          <a href="${r.hasInstallationInstructions[0]}"
                            >${r.hasInstallationInstructions[0]}</a
                          >
                        </td>
                      </tr>`
                    : ""
                }
            </table>
            `;
  }

  protected _renderFullForm() {
    let edResource = this._getEditingResource();
    return html`
            <table class="details-table">
                <colgroup width="150px">
                <tr>
                    <td colspan="2" style="padding: 5px 20px;">
                        <wl-textfield id="i-label" label="Software version name" 
                                      value="${
                                        edResource ? getLabel(edResource) : ""
                                      }" required></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Description:</td>
                    <td>
                        <textarea id="i-desc" name="Description" rows="5">${
                          edResource && edResource.description
                            ? edResource.description[0]
                            : ""
                        }</textarea>
                    </td>
                </tr>

                <tr>
                    <td>Keywords:</td>
                    <td>
                        <wl-textfield id="i-keywords" name="Keywords"
                                value="${
                                  edResource && edResource.keywords
                                    ? edResource.keywords[0]
                                    : ""
                                }"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Author</td>
                    <td>
                        ${this._inputAuthor}
                    </td>
                </tr>

                <tr>
                    <td>Version number</td>
                    <td>
                        <wl-textfield id="i-version-number" name="Version number"
                                value="${
                                  edResource && edResource.hasVersionId
                                    ? edResource.hasVersionId[0]
                                    : ""
                                }"></wl-textfield>
                    </td>
                </tr>

                <tr>
                    <td>Tag</td>
                    <td>
                        <wl-select id="i-tag" name="Tag" 
                                value="${
                                  edResource && edResource.tag
                                    ? edResource.tag
                                    : "latest"
                                }">
                            <option value="">None</option>
                            ${TAG_OPTIONS.map(
                              (tag: string) =>
                                html`<option value="${tag}">${tag}</option>`
                            )}
                        </wl-select>
                    </td>
                </tr>

                <tr>
                    <td>Usage notes:</td>
                    <td>
                        <textarea id="i-usage-notes" rows="6">${
                          edResource && edResource.hasUsageNotes
                            ? edResource.hasUsageNotes[0]
                            : ""
                        }</textarea>
                    </td>
                </tr>
            </table>

            <details>
              <summary>External URLs</summary>
                <table class="details-table">
                    <colgroup style="width: 220px">
                    <tr>
                        <td>Website URL</td>
                        <td>
                            <wl-textfield id="i-website" name="Website URL" type="url"
                                    value="${
                                      edResource && edResource.website
                                        ? edResource.website[0]
                                        : ""
                                    }"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Documentation URL</td>
                        <td>
                            <wl-textfield id="i-documentation" name="Documentation URL" type="url"
                                    value="${
                                      edResource && edResource.hasDocumentation
                                        ? edResource.hasDocumentation[0]
                                        : ""
                                    }"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Download URL</td>
                        <td>
                            <wl-textfield id="i-download" name="Download URL" type="url"
                                    value="${
                                      edResource && edResource.hasDownloadURL
                                        ? edResource.hasDownloadURL[0]
                                        : ""
                                    }"></wl-textfield>
                        </td>
                    </tr>

                    <tr>
                        <td>Installation instructions URL</td>
                        <td>
                            <wl-textfield id="i-install-instructions" name="Installation instructions URL" type="url"
                                    value="${
                                      edResource &&
                                      edResource.hasInstallationInstructions
                                        ? edResource
                                            .hasInstallationInstructions[0]
                                        : ""
                                    }"></wl-textfield>
                        </td>
                    </tr>
                </table>
            </details>
        `;
  }

  protected _getResourceFromFullForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "i-label"
    ) as Textfield;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "i-desc"
    ) as Textarea;
    let inputKeywords: Textfield = this.shadowRoot.getElementById(
      "i-keywords"
    ) as Textfield;
    let inputVersionId: Textfield = this.shadowRoot.getElementById(
      "i-version-number"
    ) as Textfield;
    let inputTag: Select = this.shadowRoot.getElementById("i-tag") as Select;
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
    let inputUsageNotes: Textarea = this.shadowRoot.getElementById(
      "i-usage-notes"
    ) as Textarea;

    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";
    let keywords: string = inputKeywords ? inputKeywords.value : "";
    let versionId: string = inputVersionId ? inputVersionId.value : "";
    let tag: string = inputTag ? inputTag.value : "";
    let website: string = inputWebsite ? inputWebsite.value : "";
    let documentation: string = inputDocumentation
      ? inputDocumentation.value
      : "";
    let download: string = inputDownload ? inputDownload.value : "";
    let installInstructions: string = inputInstallInstructions
      ? inputInstallInstructions.value
      : "";
    let usageNotes: string = inputUsageNotes ? inputUsageNotes.value : "";

    if (label && versionId) {
      let jsonRes = {
        type: ["SoftwareVersion"],
        label: [label],
        hasVersionId: [versionId],
        author: this._inputAuthor.getResources(),
      };
      if (desc) jsonRes["description"] = [desc];
      if (keywords) jsonRes["keywords"] = [keywords];
      if (tag) jsonRes["tag"] = [tag];
      if (website) jsonRes["website"] = [website];
      if (documentation) jsonRes["hasDocumentation"] = [documentation];
      if (download) jsonRes["hasDownloadURL"] = [download];
      if (installInstructions)
        jsonRes["hasInstallationInstructions"] = [installInstructions];
      if (usageNotes) jsonRes["hasUsageNotes"] = [usageNotes];

      return SoftwareVersionFromJSON(jsonRes);
    } else {
      // Show errors
      if (!label) {
        (<any>inputLabel).onBlur();
        this._notification.error("You must enter a name");
      }
      if (!versionId) {
        (<any>inputVersionId).onBlur();
        this._notification.error("You must enter a version number");
      }
    }
  }
}
