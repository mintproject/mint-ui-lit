import { ModelConfigurationSetup } from "@mintproject/modelcatalog_client";
import { store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult, eventOptions } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import "weightless/button";
import "weightless/icon";

export const SPARQL_VAR_RE : RegExp = new RegExp(/\?\w+/g);

@customElement("model-question")
export class ModelQuestion extends LitElement {
    @property({type:String}) public id : string;         // Some unique URI
    @property({type:String}) public name : string;       // Text name of this Model question
    @property({type:String}) public template : string;   // Form that the user can fill to set the variables
    @property({type:String}) public pattern : string;    // RDF representation of this question, for doing the filter TODO

    @property({type:Array}) private varNames : string[];
    @property({type: Object}) private varOptions : {[key:string] : {[key:string] : string}} = {}; // map varname -> map of options (optid-value)
    @property({type: Object}) protected settedOptions : {[key:string] : string} = {};     // map varname -> user selected option (optid)
    @property({type: Object}) protected optionCount : {[key:string] : number} = {};     // map optid -> number of conincidences on possible setups.

    protected possibleSetups: ModelConfigurationSetup[];

    constructor (id:string, name:string, template:string, pattern: string) {
        super();
        this.id = id;               // Internal id
        this.name = name;           // Name to show
        this.template = template;   // Template to fill, with variable names
        this.pattern = pattern;     // Pattern that the model must follow

        // Check for variable names and register them
        this.varNames = this.template.match(SPARQL_VAR_RE);
        if (this.varNames == null) this.varNames = [];
    }

    static get styles() {
        return [css`
        `];
    }

    protected render () : TemplateResult {
        // Check that all variables have been set:
        if (this.varNames.some((varName:string) => !this.settedOptions[varName]))
            return this.renderForm();

        let templateParts : string[] = this.template.split(SPARQL_VAR_RE);
        if (templateParts.length > 0 && templateParts[templateParts.length-1] === "") {
            templateParts.pop();
        }
        return html`
            ${templateParts.map((part:string, i: number) => html`
                ${part}
                ${this.varNames && this.varNames.length > i ?
                    html`<b>${
                        this.varOptions[this.varNames[i]][
                            this.settedOptions[this.varNames[i]]
                        ]
                    }</b>`
                    : ""
                }
            `)}`
    }

    public getOptionName () : string {
        return this.name;
    }

    public renderForm () : TemplateResult {
        let templateParts : string[] = this.template.split(SPARQL_VAR_RE);
        if (templateParts.length > 0 && templateParts[templateParts.length-1] === "") {
            templateParts.pop();
        }
        return html`
            ${templateParts.map((part:string, i: number) => html`
                ${part}
                ${this.varNames && this.varNames.length > i ?
                    html`
                        <select id="${this.varNames[i]}">
                            ${this.varOptions[this.varNames[i]] ? 
                                Object.keys(this.varOptions[this.varNames[i]]).map((key:string) => {
                                    let curopt = this.varOptions[this.varNames[i]][key];
                                    return html`
                                        <option value="${key}">
                                            ${curopt}
                                            ${this.optionCount[key] ? " [" + this.optionCount[key] + "]": ""}
                                        </option>`
                                })
                                :html`<option disable>Loading...</option>`
                            }
                        </select>`
                    : ""
                }
            `)}
            <button style="margin-left:5px;" @click="${this.onAddClicked}">Add</button>
        `;
    }

    public setVariableOptions (varName:string, idToLabel: {[key:string]:string;}) : void {
        if (!this.varNames.includes(varName))
            return;

        this.varOptions[varName] = idToLabel;
    }

    protected countOption (optionid:string) {
        if (this.optionCount[optionid]) {
            this.optionCount[optionid] += 1;
        } else {
            this.optionCount[optionid] = 1;
        }
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        if (matchingSetups)
            this.possibleSetups = matchingSetups;

        //Clean selected variables and options
        this.optionCount = {};
        this.varOptions = {};

        //Filter posible values by currently available setups
        // Specific to each question.
    }

    private onAddClicked () {
        this.varNames.forEach((varname:string) => {
            //Check that the variable is set.
            if (!this.varOptions[varname]) return;

            let selectEl : HTMLSelectElement = this.shadowRoot.getElementById(varname) as HTMLSelectElement;
            if (selectEl && selectEl.value) {
                this.settedOptions[varname] = selectEl.value;
            }
        });

        let event : CustomEvent = new CustomEvent("model-question-added", {
            bubbles: true,
            composed: true,
            detail: this
        });
        this.dispatchEvent(event);
        this.requestUpdate();
    }

    public createCopy () : ModelQuestion {
        return new ModelQuestion(this.id, this.name, this.template, this.pattern);
    }

    public applyFilter (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        throw new Error("Method not implemented.");
    }

    public getPattern () {
        let p = this.pattern.replaceAll(/\s+/g," ");
        p = p.replaceAll(" ."," .\n");
        this.varNames.forEach((varname:string) => {
            p = p.replaceAll(varname, "<" + this.settedOptions[varname] + ">")
        })
        return p;
    }
}