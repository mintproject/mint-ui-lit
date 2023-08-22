import { customElement, LitElement, property, html, css } from "lit-element";
import { SharedStyles } from "../styles/shared-styles";

import "weightless/icon";

@customElement("editable-note")
export class EditableNote extends LitElement {
  @property({ type: String })
  public text: string = "";

  @property({ type: String })
  private _edited: string = "";

  @property({ type: Function })
  public save;

  private _firstUpdate: boolean = true;

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

        fieldset textarea {
          resize: none;
          width: calc(100% - 5px);
          min-height: var(--min-height, 65px);
          max-height: var(--max-height, 150px);
          border: 0px solid #e9e9e9;
          /*font-family: cursive;*/
          font-size: 13px;
          color: #666;
        }

        fieldset textarea:focus {
          outline: none;
          border-color: #909090;
        }

        fieldset textarea:focus ~ #footer wl-button {
          visibility: visible;
          opacity: 1;
        }

        #footer {
          float: right;
          margin-top: -34px;
        }

        #footer wl-button {
          margin-left: 6px;
          visibility: hidden;
          opacity: 0;
          transition: visibility 0.1s linear, opacity 0.1s linear;
        }

        wl-button[disabled] {
          cursor: not-allowed;
        }
      `,
    ];
  }

  protected render() {
    if (this._firstUpdate) {
      this._firstUpdate = false;
      this._edited = this.text;
    }

    let edited = this.text != this._edited;

    return html`
      <fieldset>
        <legend>Notes</legend>
        <textarea id="editable-text" @keyup="${this._autoGrow}">
${this.text}</textarea
        >
        <div id="footer">
          <wl-button
            inverted
            @click="${this._cancel}"
            style="${edited
              ? "visibility: visible; opacity:1;"
              : "visibility: hidden; opacity: 0;"}"
            >DISCARD CHANGES</wl-button
          >
          <wl-button
            type="button"
            class="submit"
            @click="${this._save}"
            ?disabled=${!edited}
            style="${edited ? "visibility: visible; opacity:1;" : ""}"
            >SAVE</wl-button
          >
        </div>
      </fieldset>
    `;
  }

  _save() {
    if (this.save) this.save(this._edited);
  }

  _cancel() {
    let textarea = this.shadowRoot!.getElementById(
      "editable-text"
    ) as HTMLInputElement;
    textarea.value = this.text;
    this._autoGrow();
  }

  _autoGrow() {
    let textarea = this.shadowRoot!.getElementById(
      "editable-text"
    ) as HTMLInputElement;
    this._edited = textarea.value;
    textarea.style.height = "10px";
    textarea.style.height = textarea.scrollHeight + "px";
  }
}
