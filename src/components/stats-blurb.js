var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, LitElement, property, html, css } from "lit-element";
import "weightless/icon";
let StatsBlurb = class StatsBlurb extends LitElement {
    constructor() {
        super(...arguments);
        this.icon = "";
        this.text = "";
        this.value = "";
        this.change = 0;
        this.color = "#404040";
    }
    static get styles() {
        return css `
            .blurb {
                /*text-align: center;*/
            }
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
    render() {
        return html `
            <div class="blurb">
                <div class="top">
                    <wl-icon>${this.icon}</wl-icon> ${this.text}
                </div>
                <div class="main" style="color:${this.color}">
                    ${this.value}
                </div>
                <div class="bottom">
                    <span class="${this.change > 0 ? 'positive' : 'negative'}">
                        <wl-icon>${this.change > 0 ? 'arrow_drop_up' : 'arrow_drop_down'}</wl-icon>
                        ${this.change}
                    </span>
                    from last Week
                </div>
            </div>
        `;
    }
};
__decorate([
    property({ type: String })
], StatsBlurb.prototype, "icon", void 0);
__decorate([
    property({ type: String })
], StatsBlurb.prototype, "text", void 0);
__decorate([
    property({ type: String })
], StatsBlurb.prototype, "value", void 0);
__decorate([
    property({ type: Number })
], StatsBlurb.prototype, "change", void 0);
__decorate([
    property({ type: String })
], StatsBlurb.prototype, "color", void 0);
StatsBlurb = __decorate([
    customElement('stats-blurb')
], StatsBlurb);
export { StatsBlurb };
