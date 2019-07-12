var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, customElement } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';
import { SharedStyles } from '../components/shared-styles.js';
let VariableViewer = class VariableViewer extends PageViewElement {
    static get styles() {
        return [
            SharedStyles
        ];
    }
    render() {
        return html `
    <div class="card">
        Details about the variable here
    </div>
    `;
    }
};
VariableViewer = __decorate([
    customElement('variable-viewer')
], VariableViewer);
export { VariableViewer };
