import { customElement, LitElement, css, html } from "lit-element";
import { SharedStyles } from "styles/shared-styles";

@customElement("my-footer")
export class MyFooter extends LitElement {
  static get styles() {
    return [ SharedStyles, css`
      .footer {
        background-color: #222222;
        height: 50px;
      }
      .footer > .content-page {
        height: 50px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        color: #888888;
      }
      .footer > .content-page > a {
        margin-left: .2rem;
      }
      .footer > .content-page > a:hover {
        background-color: transparent;
      }
    `];
  }

  protected render() {
    return html`<div class="footer">
      <div class="content-page">
        Powered by
        <a href="http://mint-project.info/index.html" target="_blank">MINT</a>
      </div>
    </div>`;
  }
}