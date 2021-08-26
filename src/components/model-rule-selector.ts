import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";

import { SharedStyles } from '../styles/shared-styles';

import "weightless/icon";
import { IdMap } from "app/reducers";
import { DatasetSpecification, Intervention, ModelCategory, ModelConfigurationSetup, Parameter, Region, StandardVariable, VariablePresentation } from "@mintproject/modelcatalog_client";
import { getLabel, isSubregion } from "model-catalog/util";
import { VariableMap } from "screens/variables/reducers";

export interface ModelRule {
    id: string,
    name: string,
    template: string,
    types: string[],
    values?: string[],
    options?: {(): TemplateResult | TemplateResult[]; }[],
    apply?: {(data:ModelConfigurationSetup[], values: string[]): ModelConfigurationSetup[];},
    filterSize?: number;
};

//FIXME: this should be a proper class with functions.
const RuleCatalog : ModelRule[] = [
    {
        id: "hasRegionFilter",
        name: "Model is configured to work with an especific region",
        template: "Is configured to work with an especific region",
        types: [],
        options: [],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            return setups.filter(s => !!s.hasRegion);
        }
    },
    {
        id: "subRegionFilter",
        name: "Model is configured for a subregion",
        template: "Configured for ?subregion",
        types: ["select"],
        options: [() => {
            if (ModelRuleSelector.regions && ModelRuleSelector.mainRegion) {
                return Object.values(ModelRuleSelector.regions)
                        .filter(r => r.id != ModelRuleSelector.mainRegion && isSubregion(ModelRuleSelector.mainRegion, r))
                        .map(r => html`<option value="${getLabel(r)}"> ${getLabel(r)}</option>`);
            } else {
                return html`<option disable> Loading... </option>`
            }
        }],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            let regionid : string;
            for (let region of Object.values(ModelRuleSelector.regions)) {
                if (getLabel(region) == values[0]) {
                    regionid = region.id;
                    break;
                }
            }
            return regionid ? setups.filter(s => !s.hasRegion || s.hasRegion.some(r => isSubregion(regionid, ModelRuleSelector.regions[r.id]))) : [];
        }
    },
    {
        id: "categoryFilter",
        name: "Model is part of category",
        template: "Is a ?category model",
        types: ["select"],
        options: [() => {
            if (ModelRuleSelector.categories) {
                return Object.values(ModelRuleSelector.categories)
                        .map(c => html`<option value="${getLabel(c)}"> ${getLabel(c)}</option>`);
            } else {
                return html`<option disable> Loading... </option>`
            }
        }],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            let catid : string;
            for (let cat of Object.values(ModelRuleSelector.categories)) {
                if (getLabel(cat) == values[0]) {
                    catid = cat.id;
                    break;
                }
            }
            return catid ? setups.filter(s => s.hasModelCategory && s.hasModelCategory.some(c => c.id === catid)) : [];
        }
    },
    {
        id: "generateIndicator",
        name: "Model generates specific indicator",
        template: "Generates indicator ?indicator",
        types: ["select"],
        options: [() => {
            if (ModelRuleSelector.variableMap) {
                return Object.values(ModelRuleSelector.variableMap)
                        .map(c => html`<option value="${c.id}"> ${c.name}</option>`);
            } else {
                return html`<option disable> Loading... </option>`
            }
        }],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            let selectedlabel = values[0];
            return setups.filter(s => s.hasOutput && s.hasOutput
                    .map(ds => ModelRuleSelector.datasetSpecifications[ds.id])
                    .some(ds => ds && ds.hasPresentation && ds.hasPresentation
                        .map(vp => ModelRuleSelector.variablePresentations[vp.id])
                        .some(vp =>  vp && vp.hasStandardVariable && vp.hasStandardVariable
                            .map(sv => ModelRuleSelector.standardVariables[sv.id])
                            .some(sv => sv && getLabel(sv) === selectedlabel ))));
        }
    },
    {
        id: "inputVarPresentation",
        name: "Model requires a specific input variable",
        template: "Requires ?invar as input variable",
        types: ["select"],
        options: [() => {
            if (ModelRuleSelector.variablePresentations) {
                return Object.values(ModelRuleSelector.variablePresentations)
                        .map(vp => html`<option value="${getLabel(vp)}"> ${getLabel(vp)}</option>`);
            } else {
                return html`<option disable> Loading... </option>`
            }
        }],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            let vpid : string;
            for (let vp of Object.values(ModelRuleSelector.variablePresentations)) {
                if (getLabel(vp) == values[0]) {
                    vpid = vp.id;
                    break;
                }
            }
            return vpid ? setups.filter(s => s.hasInput && s.hasInput
                            .map(ds => ModelRuleSelector.datasetSpecifications[ds.id])
                            .some(ds => ds && ds.hasPresentation && ds.hasPresentation.some(vp => vp.id === vpid))) : [];
        }
    },
    {
        id: "outputVarPresentation",
        name: "Model generates a specific output variable",
        template: "Generates ?outvar as output variable",
        types: ["select"],
        options: [() => {
            if (ModelRuleSelector.variablePresentations) {
                return Object.values(ModelRuleSelector.variablePresentations)
                        .map(vp => html`<option value="${getLabel(vp)}"> ${getLabel(vp)}</option>`);
            } else {
                return html`<option disable> Loading... </option>`
            }
        }],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            let vpid : string;
            for (let vp of Object.values(ModelRuleSelector.variablePresentations)) {
                if (getLabel(vp) == values[0]) {
                    vpid = vp.id;
                    break;
                }
            }
            return vpid ? setups.filter(s => s.hasOutput && s.hasOutput
                            .map(ds => ModelRuleSelector.datasetSpecifications[ds.id])
                            .some(ds => ds && ds.hasPresentation && ds.hasPresentation.some(vp => vp.id === vpid))) : [];
        }
    },
    {
        id: "hasAdjustableParameres",
        name: "Model has adjustable parameters",
        template: "Has adjustable parameters",
        types: [],
        options: [],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            return setups.filter(s => s.adjustableParameter && s.adjustableParameter.length > 0);
        }
    },
    {
        id: "noAdjustableParameres",
        name: "Model has no adjustable parameters",
        template: "Has no adjustable parameters",
        types: [],
        options: [],
        apply: (setups:ModelConfigurationSetup[], values:string[]) => {
            return setups.filter(s => !s.adjustableParameter || s.adjustableParameter.length === 0);
        }
    },
    //{
    //    id: "noAdjustableDataset",
    //    name: "Model has no adjustable datasets",
    //    template: "Has no adjustable datasets",
    //    types: [],
    //    options: [],
    //    apply: (setups:ModelConfigurationSetup[], values:string[]) => {
    //        return setups.filter(s => !s.hasInput || s.hasInput.length > 0 && s.hasInput
    //                .map(ds => ModelRuleSelector.datasetSpecifications[ds.id])
    //                .every(ds => !!ds.hasFixedResource && ds.hasFixedResource.length > 0) );
    //    }
    //},
    //{
    //    id: "hasAdjustableDataset",
    //    name: "Model has adjustable datasets",
    //    template: "Has adjustable datasets",
    //    types: [],
    //    options: [],
    //    apply: (setups:ModelConfigurationSetup[], values:string[]) => {
    //        return setups.filter(s => !s.hasInput || s.hasInput.length > 0 && s.hasInput  
    //                .map(ds => ModelRuleSelector.datasetSpecifications[ds.id])
    //                .every(ds => !ds.hasFixedResource) );
    //    }
    //},
];

@customElement('model-rule-selector')
export class ModelRuleSelector extends LitElement {
    static get styles() {
        return [SharedStyles, css`
        :host {
            display: block;
            line-height: 24px;
        }
        .selected-rules-container {
            line-height: 30px;
        }
        span.rule-preview + span.rule-preview {
            margin-left: 5px;
        }
        .rule-preview {
            border: 1px solid #888;
            padding: 4px 8px;
        }
        .error {
            background-color: lightcoral;;
        }`];
    }

    @property({type: Array}) private selectedRules : ModelRule[] = [];
    @property({type: String}) private displayedRuleId : string = "";
    private ruleMap : IdMap<ModelRule> = {};

    private callback : {(): void; };

    public static regions : IdMap<Region>;
    public static categories : IdMap<ModelCategory>;
    public static mainRegion : string;
    public static variableMap: VariableMap;
    public static datasetSpecifications: IdMap<DatasetSpecification>;
    public static variablePresentations: IdMap<VariablePresentation>;
    public static standardVariables: IdMap<StandardVariable>;
    public static parameters: IdMap<Parameter>;
    public static interventions: IdMap<Intervention>;

    public static setRegions (regions : IdMap<Region>) {
        ModelRuleSelector.regions = regions;
    }

    public static setCategories (cats : IdMap<ModelCategory>) {
        ModelRuleSelector.categories = cats;
    }

    public static setMainRegion (mr : string) {
        ModelRuleSelector.mainRegion = mr;
    }

    public static setVariableMap (map: VariableMap) {
        ModelRuleSelector.variableMap = map;
    }

    public static setDatasetSpecification (dss: IdMap<DatasetSpecification>) {
        ModelRuleSelector.datasetSpecifications = dss;
    }

    public static setVariablePresentations (vars: IdMap<VariablePresentation>) {
        ModelRuleSelector.variablePresentations = vars;
    }

    public static setStandardVariable (vars: IdMap<StandardVariable>) {
        ModelRuleSelector.standardVariables = vars;
    }

    public static setParameters (params: IdMap<Parameter>) {
        ModelRuleSelector.parameters = params;
    }

    public static setInterventions (ints: IdMap<Intervention>) {
        ModelRuleSelector.interventions = ints;
    }

    constructor () {
        super();
        for (let rule of RuleCatalog) {
            this.ruleMap[rule.id] = rule;
        }
    }

    public setCallback (call: {(): void; }) {
        this.callback = call;
    }

    protected render() {
        return html`
            <div class="selected-rules-container">
                ${this.selectedRules.map(this.renderRulePreview.bind(this))}
            </div>
            <select id="ruleSelector" @change="${this.onRuleSelectorChange}">
                <option value="" ?selected="${!this.displayedRuleId}" disabled>
                    - Select a new filter -
                </option>
                ${RuleCatalog.map((r:ModelRule) => html`
                    <option value="${r.id}" ?selected="${this.displayedRuleId === r.id}">
                        ${r.name}
                    </option>
                `)}
            </select>
            <div>
                ${this.displayedRuleId ?  this.renderRuleInput() : "" }
            </div>
        `;
    }

    private onRuleSelectorChange (ev) {
        let selector : HTMLSelectElement = this.shadowRoot.getElementById("ruleSelector") as HTMLSelectElement;
        if (selector) {
            this.displayedRuleId = selector.value;
        }
    }

    private renderRuleInput () {
        let rule = this.ruleMap[this.displayedRuleId];
        let templateParts : string[] = rule.template.split(/\?\w+/);
        return html`
            ${templateParts.map((part:string, i: number) => html`
                ${part}
                ${i < rule.types.length ? (
                    (rule.types[i] == "select") ? html`
                        <select id="${rule.id + "_" + i}">
                            ${rule.options[i]()}
                        </select>
                        ` : ''
                ) : ''}
            `)}
            <button @click="${this.onRuleAdd}">+</button>
        `;
    }

    private cont : number = 0;
    private onRuleAdd () {
        let rule = { ... this.ruleMap[this.displayedRuleId] };
        rule.values = []
        //rule.id += "_" + this.cont++;

        let i = 0;
        let el : HTMLElement = this.shadowRoot.getElementById(rule.id + "_0");
        for (; !!el; el = this.shadowRoot.getElementById(rule.id + "_" + ++i)) {
            rule.values.push( (el as HTMLSelectElement).value );
        }
        console.log(rule.values);

        this.selectedRules.push(rule);
        this.displayedRuleId = "";
        if (this.callback) this.callback();
    }

    private renderRulePreview (rule: ModelRule) {
        let templateParts : string[] = rule.template.split(/\?\w+/);
        return html`
        <span class="rule-preview ${rule.filterSize === 0? 'error' : ''}">
            ${templateParts.map((part:string, i: number) => html`
                ${part}
                ${i < rule.values.length ? html`<b>${rule.values[i]}</b>`: ''}
            `)}
            <button @click="${() => {this.onRemoveRule(rule.id)}}">x</button>
        </span>
        `;
    }

    private onRemoveRule (ruleid: string) {
        this.selectedRules = this.selectedRules.filter((r:ModelRule) => r.id != ruleid);
        //console.log(ruleid, this.selectedRules);
        this.requestUpdate();
        if (this.callback) this.callback();
    }

    public getSelectedRules () {
        return this.selectedRules;
    }

    public setRuleResults (ruleid: string, size: number) {
        for (let rule of this.selectedRules) {
            if (rule.id === ruleid) {
                rule.filterSize = size;
                break;
            }
        }
    }

}
