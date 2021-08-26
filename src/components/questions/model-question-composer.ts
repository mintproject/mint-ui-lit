import { Model, ModelCategory, ModelConfigurationSetup, Region } from "@mintproject/modelcatalog_client";
import { RootState, store } from "app/store";
import { customElement, LitElement, property, html, css, CSSResult, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { ModelQuestion } from "./model-question";

import "weightless/button";
import "weightless/icon";
import { Region as GQLRegion } from "screens/regions/reducers";
import { IdMap } from "app/reducers";
import { getLabel, isSubregion } from "model-catalog/util";
import { SharedStyles } from "styles/shared-styles";
import { HasSubRegionQuestion } from "./custom_questions/has-subregion-question";
import { HasCategoryQuestion } from "./custom_questions/has-category";
import { HasInputVariableQuestion } from "./custom_questions/has-input-variable";
import { HasOutputVariableQuestion } from "./custom_questions/has-output-variable";
import { HasIndicatorQuestion } from "./custom_questions/has-indicator";
import { HasStandardVariableQuestion } from "./custom_questions/has-standard-variable";


@customElement("model-question-composer")
export class ModelQuestionComposer extends LitElement {
    private static idCount : number = 0;
    @property({type: Boolean}) protected loadingModelCatalog: boolean = true;
    @property({type: Object}) private categories : IdMap<ModelCategory>;
    @property({type: Object}) private regions : IdMap<Region>;
    @property({type: Object}) private setups : IdMap<ModelConfigurationSetup>;
    @property({type: Object}) private selectedSetups : IdMap<boolean> = {};
    @property({type: Object}) protected mainRegion: GQLRegion;
    @property({type: Object}) private questionCatalog : IdMap<ModelQuestion> = {};
    @property({type: String}) private selectedQuestionId: string;
    @property({type: Array}) private selectedQuestions : ModelQuestion[] = [];

    @property({type: String}) private textFilter : string = "";

    constructor () {
        super();
        // Create common filters:
        let hasSubRegion = new HasSubRegionQuestion();
        this.questionCatalog[hasSubRegion.id] = hasSubRegion;

        let hasCategory = new HasCategoryQuestion();
        this.questionCatalog[hasCategory.id] = hasCategory;

        let hasInputVariable = new HasInputVariableQuestion();
        this.questionCatalog[hasInputVariable.id] = hasInputVariable;

        let hasOutputVariable = new HasOutputVariableQuestion();
        this.questionCatalog[hasOutputVariable.id] = hasOutputVariable;

        let hasStandardVariable = new HasStandardVariableQuestion();
        this.questionCatalog[hasStandardVariable.id] = hasStandardVariable;

        let generatesIndicator = new HasIndicatorQuestion();
        this.questionCatalog[generatesIndicator.id] = generatesIndicator;
    }

    static get styles () : CSSResult [] {
        return [ SharedStyles, css`
            #searchBar {
                width: calc(100% - 15px);
                padding: 0px 10px 0px 5px;
                border: 0px;
            }
        `]
    }

    protected render () : TemplateResult {
        let matchingSetups : ModelConfigurationSetup[] = this.loadingModelCatalog ? [] : this.applyAllFilters();
        if (this.selectedQuestionId)
            this.questionCatalog[this.selectedQuestionId].filterPossibleOptions(matchingSetups);
        return html`
            <!-- If a main region is selected, filter by main region first -->
            ${this.mainRegion != null ?
                html`<p> Showing models for <b @click="${this.printComposedQuestion}">${this.mainRegion.name}</b>:</p>`
                : html`<p>Filtering models:</p>`
            }

            <!-- Show active question filters -->
            ${this.selectedQuestions.length > 0 ?
                html`
                <ul>
                    ${this.selectedQuestions.map((q:ModelQuestion) => html`
                        <li style="line-height: 20px; vertical-align: middle;">
                            ${q}
                            <wl-icon @click="${() => this.removeQuestion(q)}" class="actionIcon" style="vertical-align: middle; margin-left:10px;">close</wl-icon>
                        </li>`
                    )}
                </ul>`
                : ""
            }

            <!-- Select from a list of questions -->
            <select id="questionSelector" @change="${this.onQuestionSelectorChange}">
                <option value="" ?selected="${!this.selectedQuestionId}" disabled>
                    - Add a new filter -
                </option>
                ${Object.values(this.questionCatalog).map((mq:ModelQuestion) => html`
                    <option value="${mq.id}" ?selected="${this.selectedQuestionId === mq.id}">
                        ${mq.getOptionName()}
                    </option>
                `)}
            </select>

            <!-- If a question is selected, show form template -->
            ${this.selectedQuestionId ? html`
                <ul>
                    <li>${ this.questionCatalog[this.selectedQuestionId] }</li>
                </ul>` 
                : ""
            }

            <!-- Input text to search -->
            <div style="display: flex; border-top: 1px solid #f0f0f0; margin-top: 1em;">
                <input id="searchBar" placeholder="Search..." type="text" @input=${this.onSearchInputChange}/>
                <wl-icon @click="${this.clearSearchInput}" id="clearIcon" class="actionIcon">close</wl-icon>
            </div>

            <!-- Table with filtered models -->
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr>
                        <th></th>
                        <th><b>Model</b></th>
                        <th>Category</th>
                        <th>Region</th>
                    </tr>
                </thead>
                <tbody>
                ${this.loadingModelCatalog ?
                    html`
                        <tr>
                            <td colspan="4">
                                <wl-progress-bar style="width: 100%;"></wl-progress-bar>
                            </td>
                        </tr>
                    `
                    : this.renderMatchingModels(matchingSetups)
                }
                </tbody>
            </table>
        `;
    }

    private onQuestionSelectorChange () : void {
        let selector : HTMLSelectElement = this.shadowRoot.getElementById("questionSelector") as HTMLSelectElement;
        if (selector) {
            this.selectedQuestionId = selector.value;
        }
    }

    private onSearchInputChange () : void {
        let inputEl : HTMLInputElement = this.shadowRoot!.getElementById("searchBar") as HTMLInputElement;
        if (inputEl)
            this.textFilter = inputEl.value.toLowerCase();
    }

    private clearSearchInput () : void {
        let inputEl : HTMLInputElement = this.shadowRoot!.getElementById("searchBar") as HTMLInputElement;
        if (inputEl) {
            inputEl.value = "";
            this.textFilter = "";
        }
    }

    private renderMatchingModels (matchingSetups: ModelConfigurationSetup[]) : TemplateResult {
        if (matchingSetups.length === 0)
            return html`
                <tr>
                    <td colspan="4" style="text-align:center; color: rgb(153, 153, 153);">
                        - No models found -
                    </td>
                </tr>
            `;
        else
            return html`
                ${matchingSetups.map((s:ModelConfigurationSetup) => this.renderRow(s))}
            `;
    }

    private renderRow (setup:ModelConfigurationSetup) : TemplateResult {
        return html`
        <tr>
            <td>
                <input class="checkbox" type="checkbox" data-modelid="${setup.id}"
                        ?checked="${this.selectedSetups[setup.id]}"></input>
            </td>
            <td>
                <a target="_blank" href="${this.getModelUrl(setup)}">${getLabel(setup)}</a>
                ${setup.description ? html`<div>${setup.description[0]}</div>` : ''}
            </td> 
            <td> 
                ${setup.hasModelCategory && setup.hasModelCategory.length > 0 ? 
                    setup.hasModelCategory.map((c:ModelCategory) => this.categories[c.id]).map(getLabel).join(", ")
                    : ""}
            </td>
            <td>
                ${setup.hasRegion && setup.hasRegion.length > 0 ? 
                    setup.hasRegion.map((r:Region) => this.regions[r.id]).map(getLabel).join(", ")
                    : ""}
            </td>
        </tr>`;
    }

    public applyAllFilters () : ModelConfigurationSetup[] {
        let filteredModels : ModelConfigurationSetup[] = Object.values(this.setups);
        // If theres a main region, filter.
        if (this.mainRegion != null && filteredModels.length > 0) {
            filteredModels = filteredModels.filter((s:ModelConfigurationSetup) => 
                    !s.hasRegion || 
                    s.hasRegion.some((r:Region) => isSubregion(this.mainRegion.model_catalog_uri, this.regions[r.id]))
            );
        }

        // For each selected model question, apply the filter:
        this.selectedQuestions.forEach((question:ModelQuestion) => {
            filteredModels = question.applyFilter(filteredModels);
        });

        // Finally filter by text search
        if (this.textFilter != "" && filteredModels.length > 0) {
            filteredModels = filteredModels.filter((s:ModelConfigurationSetup) => {
                let modelText = getLabel(s);
                if (s.description) modelText += s.description.join();
                if (s.shortDescription) modelText += s.shortDescription.join();
                if (s.hasModelCategory) modelText += s.hasModelCategory.map(cat => this.categories[cat.id]).map(getLabel).join();
                if (s.hasRegion) modelText += s.hasRegion.map(reg => this.regions[reg.id]).map(getLabel).join();
                return modelText.toLowerCase().includes(this.textFilter);
            });
        }
        return filteredModels;
    }

    public getModelUrl (setup: ModelConfigurationSetup) : string {
        return "TODO";
    }

    protected firstUpdated () : void {
        let setupReq = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll());
        let categoryReq = store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll());
        let regionReq = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());

        setupReq.then((setups:IdMap<ModelConfigurationSetup>) => { this.setups = setups });
        categoryReq.then((categories:IdMap<ModelCategory>) => { this.categories = categories });
        regionReq.then((regions:IdMap<Region>) => { this.regions = regions });

        Promise.all([setupReq, categoryReq, regionReq]).then(() => {
            this.loadingModelCatalog = false;
        });
        
        // Add event listeners
        this.addEventListener('model-question-added', (e:Event) => {
            let question : ModelQuestion = e['detail'];
            // Change id of added question and add a new copy to the list of questions.
            let copy : ModelQuestion = question.createCopy();
            question.id = question.id + ModelQuestionComposer.idCount;
            ModelQuestionComposer.idCount += 1;
            this.selectedQuestions.push(question);

            this.questionCatalog[copy.id] = copy;
            this.selectedQuestionId = "";
        })
    }

    private removeQuestion (question: ModelQuestion) {
        let index : number = this.selectedQuestions.indexOf(question);
        if (index >= -1) {
            this.selectedQuestions.splice(index, 1);
            this.requestUpdate();
        }
    }

    public setMainRegion (reg: GQLRegion) : void {
        this.mainRegion = reg;
    }

    public printComposedQuestion () {
        let composed : string = "?model a <https://w3id.org/okn/o/sdm#ModelConfigurationSetup> .\n";
        this.selectedQuestions.forEach((question:ModelQuestion) => composed += question.getPattern());
        console.log(composed);
    }
}