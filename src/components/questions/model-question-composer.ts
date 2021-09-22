import { Model, ModelCategory, ModelConfigurationSetup, Region } from "@mintproject/modelcatalog_client";
import { RootState, store } from "app/store";
import { customElement, LitElement, property, html, css, CSSResult, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { ModelQuestion } from "./model-question";

import "weightless/button";
import "weightless/icon";
import { Region as GQLRegion } from "screens/regions/reducers";
import { IdMap } from "app/reducers";
import { getLabel, isSubregion } from "model-catalog-api/util";
import { SharedStyles } from "styles/shared-styles";
import { HasSubRegionQuestion } from "./custom_questions/has-subregion-question";
import { HasCategoryQuestion } from "./custom_questions/has-category";
import { HasInputVariableQuestion } from "./custom_questions/has-input-variable";
import { HasOutputVariableQuestion } from "./custom_questions/has-output-variable";
import { HasIndicatorQuestion } from "./custom_questions/has-indicator";
import { HasStandardVariableQuestion } from "./custom_questions/has-standard-variable";
import { IsInBoundingBoxQuestion } from "./custom_questions/is-in-bounding-box";

const PER_PAGE = 10;

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

    //Pagination
    @property({type: Number}) private currentPage: number = 1;
    @property({type: Number}) private maxPage: number = 1;

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

        let isInBoundingBox = new IsInBoundingBoxQuestion();
        this.questionCatalog[isInBoundingBox.id] = isInBoundingBox;
    }

    static get styles () : CSSResult [] {
        return [ SharedStyles, css`
            #searchBar {
                width: 100%;
                padding: 5px 5px 5px 5px;
                border: 0px solid black;
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

            <div style="border: 1px solid #EEE; margin: 10px 0px;">
                <!-- Input text to search -->
                ${this.renderPaginator(matchingSetups.length)}

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
            </div>
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
            this.currentPage = 1;
    }

    private clearSearchInput () : void {
        let inputEl : HTMLInputElement = this.shadowRoot!.getElementById("searchBar") as HTMLInputElement;
        if (inputEl) {
            inputEl.value = "";
            if (!this.textFilter) this.currentPage = 1;
            this.textFilter = "";
        }
    }

    private renderPaginator (maxElements : number) : TemplateResult {
        return html`<div style="display: flex; align-items: center; padding: 0px 8px;">
            <wl-icon>search</wl-icon>
            <input id="searchBar" placeholder="Search..." type="text" @input=${this.onSearchInputChange}/>
            <wl-icon @click="${this.clearSearchInput}" id="clearIcon" class="actionIcon">close</wl-icon>
            <span style="font-size: 20px; font-weight: 200; color: #EEE;">|</span>
            <wl-button flat inverted ?disabled=${this.loadingModelCatalog || this.currentPage === 1} @click=${this.onPrevPage}>Back</wl-button>
            <span style="display: block; white-space: nowrap;">
                Page ${this.currentPage} of ${this.maxPage}
            </span>
            <wl-button flat inverted ?disabled=${this.loadingModelCatalog || this.currentPage * PER_PAGE > maxElements} @click=${this.onNextPage}>Next</wl-button>
        </div>`;
    }

    private renderMatchingModels (matchingSetups: ModelConfigurationSetup[]) : TemplateResult {
        let mx : number = (this.currentPage * PER_PAGE);
        let visibleSetups : ModelConfigurationSetup[] = matchingSetups.slice(
            (this.currentPage - 1) * PER_PAGE,
            mx > matchingSetups.length ? matchingSetups.length : mx
        );
        let selectedSetups : ModelConfigurationSetup[] = Object.keys(this.selectedSetups)
                .filter((key:string) => this.selectedSetups[key])
                .map((key:string) => this.setups[key]);

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
                ${selectedSetups.map((s:ModelConfigurationSetup) => this.renderRow(s, true))}
                ${visibleSetups.map((s:ModelConfigurationSetup) => this.renderRow(s, false))}
            `;
    }

    private renderRow (setup:ModelConfigurationSetup, selected:boolean) : TemplateResult {
        return html`
        <tr>
            <td>
                <input class="checkbox" type="checkbox" data-modelid="${setup.id}"
                        @change=${ this.toggleSelection }
                        .checked=${selected}></input>
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

    private toggleSelection (ev:Event) {
        ev.stopPropagation();
        ev.preventDefault();

        let path : EventTarget[] = ev.composedPath();
        let chbox : HTMLInputElement = path[0] as HTMLInputElement;
        let modelid : string = chbox.getAttribute("data-modelid");
        if (modelid) {
            chbox.checked = this.selectedSetups[modelid];
            this.selectedSetups[modelid] = !this.selectedSetups[modelid];
            this.requestUpdate();
        }
    }

    public applyAllFilters () : ModelConfigurationSetup[] {
        let filteredModels : ModelConfigurationSetup[] = Object.values(this.setups);
        // Filter selected models selected
        filteredModels = filteredModels.filter((s:ModelConfigurationSetup) => !this.selectedSetups[s.id]);

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

        // Update pagination
        this.maxPage = Math.ceil(filteredModels.length / PER_PAGE);
        return filteredModels;
    }

    public onPrevPage () : void {
        this.currentPage -= 1;
    }

    public onNextPage () : void {
        this.currentPage += 1;
    }

    public getModels () : ModelConfigurationSetup[] {
        return Object.keys(this.selectedSetups)
                .filter((key:string) => this.selectedSetups[key])
                .map((key:string) => this.setups[key]);
    }

    public setModelsIds (listid:string[]) : void {
        listid.forEach((id:string) => this.selectedSetups[id] = true);
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