import { customElement, LitElement, property, html, css } from "lit-element";

import { goToPage } from "../app/actions";
import { SharedStyles } from "../styles/shared-styles";

import "weightless/icon";

@customElement("nav-title")
export class NavTitle extends LitElement {
  @property({ type: Array })
  nav = [];

  @property({ type: Number })
  min = 1;

  @property({ type: Number })
  max = 3;

  static get styles() {
    return [
      SharedStyles,
      css`
        .cltmain > wl-title {
          display: inline-block;
        }

        #nav-container {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-left: 5px;
          padding-top: 5px;
        }

        .clickable {
          cursor: pointer;
        }

        wl-title.clickable:hover {
          text-decoration: underline;
        }
      `,
    ];
  }

  protected render() {
    let len: number = this.nav.length;

    return html`
      <div class="cltrow">
        <wl-button
          flat
          inverted
          @click="${() => {
            goToPage(this.nav[len - 2].url);
          }}"
          ?disabled="${len === 1}"
        >
          <wl-icon>arrow_back_ios</wl-icon>
        </wl-button>

        <div class="cltmain" id="nav-container">
          ${this.nav.map((n, i) => {
            return i < this.max
              ? html`
                  ${i > 1
                    ? html`<wl-title
                        level="3"
                        style="padding:0px 10px; cursor: default;"
                        >/</wl-title
                      >`
                    : html``}
                  ${i >= this.min || len === 1
                    ? i === len - 1
                      ? html`
                          <wl-title level="3" style="cursor: default;"
                            >${n.label}</wl-title
                          >
                        `
                      : html`
                          <wl-title
                            level="3"
                            class="clickable"
                            @click="${() => {
                              goToPage(n.url);
                            }}"
                            >${n.label}</wl-title
                          >
                        `
                    : html``}
                `
              : html``;
          })}
        </div>

        <slot name="after"></slot>
      </div>
    `;
  }
}
