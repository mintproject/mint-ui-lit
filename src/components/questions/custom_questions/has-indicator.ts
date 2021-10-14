import { DatasetSpecification, ModelCategory, ModelConfigurationSetup, StandardVariable, VariablePresentation } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel } from "model-catalog-api/util";
import { VariableMap } from "screens/variables/reducers";
import { ModelQuestion } from '../model-question';

@customElement("has-indicator-question")
export class HasIndicatorQuestion extends ModelQuestion {
    private datasetSpecifications : IdMap<DatasetSpecification>;
    private variablePresentations : IdMap<VariablePresentation>;
    private standardVariables : IdMap<StandardVariable>;
    private static indicators : VariableMap;

    constructor (
            id:string = "hasIndicator",
            name:string = "Model generates a specific indicator",
            template:string = "That generates ?indicator",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasOutput> ?output .\n\
                               ?output <https://w3id.org/okn/o/sdm#hasPresentation> ?var . \n\
                               ?var <https://w3id.org/okn/o/sdm#hasStandardVariable> ?indicator ."
        ) {
        super(id, name, template, pattern);

        let dsReq = store.dispatch(ModelCatalogApi.myCatalog.datasetSpecification.getAll());
        let vpReq = store.dispatch(ModelCatalogApi.myCatalog.variablePresentation.getAll());
        let svReq = store.dispatch(ModelCatalogApi.myCatalog.standardVariable.getAll());
        dsReq.then((dss : IdMap<DatasetSpecification>) => {
            this.datasetSpecifications = dss;
        });
        vpReq.then((vps: IdMap<VariablePresentation>) => {
            this.variablePresentations = vps;
        })
        svReq.then((svs: IdMap<StandardVariable>) => {
            this.standardVariables = svs;
        })

        Promise.all([dsReq, vpReq, svReq]).then(() => {
            this.filterPossibleOptions(this.possibleSetups);
        });
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);

        if (this.datasetSpecifications && this.variablePresentations && this.standardVariables) {
            let indicatorOptions : {[key:string] : string} = {};
            if (matchingSetups && matchingSetups.length > 0) {
                matchingSetups.forEach((s:ModelConfigurationSetup) =>
                    (s.hasOutput||[])
                        .map((output:DatasetSpecification) => this.datasetSpecifications[output.id])
                        .forEach((output:DatasetSpecification) => 
                            (output.hasPresentation||[])
                                .map((vp:VariablePresentation) => this.variablePresentations[vp.id])
                                .forEach((vp:VariablePresentation) =>
                                    (vp.hasStandardVariable||[])
                                        .map((sv:StandardVariable) => this.standardVariables[sv.id])
                                        .forEach((sv:StandardVariable) => {
                                            let svLabel : string = getLabel(sv);
                                            if (HasIndicatorQuestion.indicators[svLabel]) {
                                                this.countOption(sv.id);
                                                indicatorOptions[sv.id] = HasIndicatorQuestion.indicators[svLabel].name;
                                            }
                                        })
                                )
                        )
                );
            } else {
                Object.values(this.standardVariables).forEach((sv:StandardVariable) => {
                    let svLabel : string = getLabel(sv);
                    if (HasIndicatorQuestion.indicators[svLabel]) {
                        //this.countOption(sv.id);
                        indicatorOptions[sv.id] = HasIndicatorQuestion.indicators[svLabel].name;
                    }

                })
            }

            this.setVariableOptions("?indicator", indicatorOptions);
        }
    }

    public getSelectedId () : string {
        let varname : string = "?indicator";
        let selectEl : HTMLSelectElement = this.shadowRoot.getElementById(varname) as HTMLSelectElement;
        if (selectEl && selectEl.value) {
            let cand = Object.values(this.standardVariables).filter((sv:StandardVariable) => sv.id === selectEl.value);
            if (cand.length === 1) {
                let label : string = getLabel(cand[0]);
                if (HasIndicatorQuestion.indicators[label])
                    return HasIndicatorQuestion.indicators[label].id;
            }
        }
    }

    public createCopy () : HasIndicatorQuestion {
        return new HasIndicatorQuestion(this.id, this.name, this.template, this.pattern);
    }

    public static setVariablesMap (map: VariableMap) {
        if (HasIndicatorQuestion.indicators != map) {
            HasIndicatorQuestion.indicators = map;
            console.log("SET!");
        }
    }

    public filterModels (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let indid : string = this.settedOptions["?indicator"];
        return modelsToFilter.filter((s:ModelConfigurationSetup) => 
            !!s.hasOutput && 
            s.hasOutput
                .map((output:DatasetSpecification) => this.datasetSpecifications[output.id])
                .some((output:DatasetSpecification) => 
                    (output.hasPresentation||[])
                        .map((vp:VariablePresentation) => this.variablePresentations[vp.id])
                        .some((vp:VariablePresentation) => 
                            (vp.hasStandardVariable||[])
                                .map((sv:StandardVariable) => this.standardVariables[sv.id])
                                .some((sv:StandardVariable) => sv.id === indid)
                        )
                )
        )
    }
}