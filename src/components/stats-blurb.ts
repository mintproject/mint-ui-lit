import { customElement, LitElement, property, html, css } from "lit-element";

import "weightless/icon";

@customElement("stats-blurb")
export class StatsBlurb extends LitElement {
  @property({ type: String })
  icon = "";

  @property({ type: String })
  text = "";

  @property({ type: String })
  value = "";

  @property({ type: Number })
  change = 0;

  @property({ type: String })
  color = "#404040";

  static get styles() {
    return css`
      .top {
        font-size: 14px;
      }
      .top wl-icon {
        --icon-size: 14px;
      }
      .bottom wl-icon {
        --icon-size: 16px;
        margin-bottom: -10px;
        margin-right: -4px;
      }
      .main {
        font-size: 45px;
        line-height: 50px;
        padding-left: 5px;
      }
      .bottom {
        font-size: 12px;
      }
      .positive {
        color: green;
      }
      .negative {
        color: red;
      }
    `;
  }

  protected render() {
    return html`
      <div class="blurb">
        <div class="top"><wl-icon>${this.icon}</wl-icon> ${this.text}</div>
        <div class="main" style="color:${this.color}">${this.value}</div>
        <div class="bottom">
          <span class="${this.change > 0 ? "positive" : "negative"}">
            <wl-icon
              >${this.change > 0 ? "arrow_drop_up" : "arrow_drop_down"}</wl-icon
            >
            ${this.change}
          </span>
          from last Week
        </div>
      </div>
    `;
  }
}
