import { ModelConfiguration, ModelConfigurationSetup, Region } from "@mintproject/modelcatalog_client";
import { RootState, store } from "app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { customElement, LitElement, property, html, css, CSSResult, TemplateResult } from "lit-element";
import { ModelQuestion } from "./model-question";

import "weightless/button";
import "weightless/icon";
import { Region as GQLRegion } from "screens/regions/reducers";
import { IdMap } from "app/reducers";
import { SharedStyles } from "styles/shared-styles";
import { HasSubRegionQuestion } from "./custom_questions/has-subregion-question";
import { HasCategoryQuestion } from "./custom_questions/has-category";
import { HasInputVariableQuestion } from "./custom_questions/has-input-variable";
import { HasOutputVariableQuestion } from "./custom_questions/has-output-variable";
import { HasIndicatorQuestion } from "./custom_questions/has-indicator";
import { HasStandardVariableQuestion } from "./custom_questions/has-standard-variable";
import { IsInBoundingBoxQuestion } from "./custom_questions/is-in-bounding-box";
import { Dataset } from "screens/datasets/reducers";

import { DataCatalogAdapter, DatasetQuery } from "util/data-catalog-adapter";
import { Thread } from "screens/modeling/reducers";
import { ModelSelector } from "components/model-selector";

interface QuestionInfo {
    value: ModelQuestion;
    isEditable: boolean;
    isRequired: boolean;
}

@customElement("model-question-composer")
export class ModelQuestionComposer extends connect(store)(LitElement) {
    private static idCount : number = 0;
    //Data
    @property({type: Object}) private thread : Thread;
    @property({type: Object}) private questionCatalog : IdMap<ModelQuestion> = {};
    @property({type: Object}) protected mainRegion: GQLRegion;

    //State
    @property({type: String}) private selectedQuestionId: string;
    @property({type: Array}) private selectedQuestions : ModelQuestion[] = [];

    //Computed numbers
    public matchingModels : number = -1;
    public matchingDatasets : number = -1;

    public onFilteringModelsComplete : (matchingModels:ModelConfigurationSetup[]) => void;
    public onFilteringDataComplete : (matchingDatasets:Dataset[]) => void;

    // Standard questions
    @property({type: Object}) private regionQuestion : IsInBoundingBoxQuestion;
    @property({type: Object}) private indicatorQuestion : HasIndicatorQuestion;
    @property({type: Object}) private modelSelector : ModelSelector;

    static get styles () : CSSResult [] {
        return [ SharedStyles, css`
            #searchBar {
                width: 100%;
                padding: 5px 5px 5px 5px;
                border: 0px solid black;
            }
        `]
    }

    constructor (thread:Thread) {
        super();
        this.thread = thread;

        this.indicatorQuestion = new HasIndicatorQuestion();
        this.regionQuestion = new IsInBoundingBoxQuestion();

        this.questionCatalog[this.indicatorQuestion.id] = this.indicatorQuestion;
        this.questionCatalog[this.regionQuestion.id] = this.regionQuestion;

        this.createModelFilters();

        this.modelSelector = new ModelSelector();
        this.modelSelector.setSelected(new Set(Object.keys(thread.models)));
        
        // Add event listeners
        this.addEventListener('model-question-added', this.onModelQuestionAdded)
        this.addEventListener('model-selector-loaded', this.onModelSelectorLoaded)
    }

    private createModelFilters () : void {
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

    }

    public getRegionQuestion () : IsInBoundingBoxQuestion {
        return this.regionQuestion;
    }

    public getIndicatorQuestion () : HasIndicatorQuestion {
        return this.indicatorQuestion;
    }

    public getQuestion (questionId:string) : ModelQuestion {
        return this.questionCatalog[questionId];
    }

    protected render () : TemplateResult {
        let matchingSetups : ModelConfigurationSetup[] = this.applyAllModelFilters();
        if (this.selectedQuestionId)
            this.questionCatalog[this.selectedQuestionId].filterPossibleOptions(matchingSetups);

        return html`
            <!-- If a main region is selected, filter by main region first -->
            <p>Filtering models:</p>
            <ul>
                <li style="line-height: 20px; vertical-align: middle;">
                    ${this.regionQuestion.renderTextRepresentation()}
                </li>
                <!-- Show active question filters -->
                ${this.selectedQuestions.length > 0 ?
                    this.selectedQuestions.map((q:ModelQuestion) => html`
                        <li style="line-height: 20px; vertical-align: middle;">
                            ${q}
                            <wl-icon @click="${() => this.removeQuestion(q)}" class="actionIcon" style="vertical-align: middle; margin-left:10px;">close</wl-icon>
                        </li>`
                    )
                    : ""
                }
            </ul>

            <!-- Select from a list of questions -->
            <select id="questionSelector" @change="${this.onQuestionSelectorChange}">
                <option value="" ?selected="${!this.selectedQuestionId}" disabled>
                    - Add a new filter -
                </option>
                ${Object.values(this.questionCatalog).filter((mq:ModelQuestion) => mq.canBeAdded).map((mq:ModelQuestion) => html`
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

            ${this.modelSelector}
        `;
    }

    private onQuestionSelectorChange () : void {
        let selector : HTMLSelectElement = this.shadowRoot.getElementById("questionSelector") as HTMLSelectElement;
        if (selector) {
            this.selectedQuestionId = selector.value;
        }
    }

    public applyAllModelFilters () : (ModelConfiguration|ModelConfigurationSetup)[] {
        let allModels : (ModelConfiguration|ModelConfigurationSetup)[] = this.modelSelector.getAll();
        if (!allModels) return [];

        let filteredModels = this.regionQuestion.filterModels(allModels);

        // For each selected model question, apply the filter:
        this.selectedQuestions.forEach((question:ModelQuestion) => {
            filteredModels = question.filterModels(filteredModels);
        });

        if (this.onFilteringModelsComplete) this.onFilteringModelsComplete(filteredModels);
        this.matchingModels = filteredModels.length;

        this.modelSelector.setVisible(
            new Set(filteredModels.map(m => m.id))
        );

        return filteredModels;
    }

    private lastDatasets : Dataset[];
    public async applyAllDataFilters () : Promise<Dataset[]> {
        //TODO: Data filters cannot accept queries, so all filters on only one query here:
        let selectedRegion : GQLRegion = this.regionQuestion.getSelectedRegion();
        if (!selectedRegion) {
            setTimeout(() => { 
                    this.applyAllDataFilters();
            }, 500);
            return;
        }

        let datasetQuery : DatasetQuery = {};
        datasetQuery.spatial_coverage__intersects = selectedRegion.geometries[0];

        if (this.thread.dates) {
            if (this.thread.dates.start_date) datasetQuery.start_time = this.thread.dates.start_date;
            if (this.thread.dates.end_date) datasetQuery.end_time = this.thread.dates.end_date;
        }
        
        if (this.thread.response_variables && this.thread.response_variables.length > 0)
            datasetQuery.standard_variable_names__in = this.thread.response_variables;

        this.lastDatasets = await DataCatalogAdapter.findDataset(datasetQuery);
        if (this.onFilteringDataComplete) this.onFilteringDataComplete(this.lastDatasets);
        return this.lastDatasets;
    }

    public getModels () : ModelConfigurationSetup[] {
        return this.modelSelector.getSelectedModels();
    }

    private removeQuestion (question: ModelQuestion) {
        let index : number = this.selectedQuestions.indexOf(question);
        if (index >= -1) {
            this.selectedQuestions.splice(index, 1);
            this.requestUpdate();
        }
    }

    public printComposedQuestion () {
        let composed : string = "?model a <https://w3id.org/okn/o/sdm#ModelConfigurationSetup> .\n";
        this.selectedQuestions.forEach((question:ModelQuestion) => composed += question.getPattern());
        console.log(composed);
    }

    public stateChanged (state: RootState) {
        Object.values(this.questionCatalog).forEach((q:ModelQuestion) => {
            if (q["stateChanged"]) q["stateChanged"](state);
        });
    }

    // Events
    private onModelQuestionAdded : (e:Event) => void = (e:Event) => {
        let question : ModelQuestion = e['detail'];
        // Change id of added question and add a new copy to the list of questions.
        let copy : ModelQuestion = question.createCopy();
        question.id = question.id + ModelQuestionComposer.idCount;
        ModelQuestionComposer.idCount += 1;
        this.selectedQuestions.push(question);

        this.questionCatalog[copy.id] = copy;
        this.selectedQuestionId = "";
    };

    private onModelSelectorLoaded : (e:Event) => void = (e:Event) => {
        console.log("Model selector loaded!")
        this.applyAllModelFilters();
    }
}