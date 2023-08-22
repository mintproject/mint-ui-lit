import { customElement, LitElement, property, html, css } from "lit-element";
import { SharedStyles } from "../styles/shared-styles";

import "weightless/icon";
import { MintPermission } from "screens/modeling/reducers";
import { getAllUsersPermission } from "util/permission_utils";

@customElement("permissions-editor")
export class PermissionsEditor extends LitElement {
  @property({ type: Array })
  public permissions: MintPermission[];

  @property({ type: Object })
  private _permission: MintPermission;

  static get styles() {
    return [
      SharedStyles,
      css`
        fieldset {
          margin: 10px 0px;
          padding: 5px 10px;
          border: 1px solid #d9d9d9;
          border-radius: 5px;
        }
        fieldset legend  {
          font-size: 10px;
        }
      `,
    ];
  }

  private _changedPublicPermission(e) {
    this._permission.read = !this._permission.read;
    if (!this._permission.read) this._permission.write = false;
    this.requestUpdate();
  }

  private _changedWritePermission(e) {
    this._permission.write = !this._permission.write;
    this.requestUpdate();
  }

  public setPermissions(permissions: MintPermission[]) {
    this._permission = Object.assign(
      {},
      getAllUsersPermission(permissions ?? [])
    );
    this.permissions = [this._permission];
    this.requestUpdate();
  }

  protected render() {
    if (!this._permission) {
      return html``;
    }
    return html`
      <div class="input_full">
        <label>Sharing</label>
      </div>
      <div class="formRow" style="justify-content: start">
        <div style="width: 200px">
          <input
            type="checkbox"
            name="public"
            id="public"
            @click="${this._changedPublicPermission}"
            .checked="${this._permission.read}"
          />
          <label for="public">Publicly Visible</label>
        </div>
        <div style="width: 200px">
          <input
            type="checkbox"
            name="writable"
            id="writable"
            .disabled="${!this._permission.read}"
            @click="${this._changedWritePermission}"
            .checked="${this._permission.read && this._permission.write}"
          />
          <label for="writable">Publicly Writable</label>
        </div>
      </div>
    `;
  }
}
