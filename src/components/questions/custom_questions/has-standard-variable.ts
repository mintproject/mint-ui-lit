import { DatasetSpecification, ModelCategory, ModelConfigurationSetup, StandardVariable, VariablePresentation } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel } from "model-catalog-api/util";
import { ModelQuestion } from '../model-question';

@customElement("has-standard-variable-question")
export class HasStandardVariableQuestion extends ModelQuestion {
    private datasetSpecifications : IdMap<DatasetSpecification>;
    private variablePresentations : IdMap<VariablePresentation>;
    private standardVariables : IdMap<StandardVariable>;

    constructor (
            id:string = "hasStandardVariable",
            name:string = "Model generates a specific standard variable",
            template:string = "That generates ?standardVariable",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasOutput> ?output .\n\
                               ?output <https://w3id.org/okn/o/sdm#hasPresentation> ?var . \n\
                               ?var <https://w3id.org/okn/o/sdm#hasStandardVariable> ?standardVariable ."
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
            if (this.possibleSetups) {
                this.filterPossibleOptions(this.possibleSetups);
            }
        });
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);

        if (this.datasetSpecifications && this.variablePresentations && this.standardVariables) {
            let standardVariableOptions : {[key:string] : string} = {};
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
                                        this.countOption(sv.id);
                                        standardVariableOptions[sv.id] = getLabel(sv);
                                    })
                            )
                    )
            );

            this.setVariableOptions("?standardVariable", standardVariableOptions);
        }
    }

    public createCopy () : HasStandardVariableQuestion {
        return new HasStandardVariableQuestion(this.id, this.name, this.template, this.pattern);
    }

    public filterModels (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let indid : string = this.settedOptions["?standardVariable"];
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