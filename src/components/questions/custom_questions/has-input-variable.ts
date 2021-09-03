import { DatasetSpecification, ModelConfigurationSetup, VariablePresentation } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { store } from "app/store";
import { customElement } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel } from "model-catalog-api/util";
import { ModelQuestion } from '../model-question';

@customElement("has-input-variable-question")
export class HasInputVariableQuestion extends ModelQuestion {
    private datasetSpecifications : IdMap<DatasetSpecification>;
    private variablePresentations : IdMap<VariablePresentation>;

    constructor (
            id:string = "hasInputVariable",
            name:string = "Model requires a specific input variable",
            template:string = "That requires the variable ?variable as input",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasInput> ?input .\n\
                               ?input <https://w3id.org/okn/o/sdm#hasPresentation> ?variable ."
        ) {
        super(id, name, template, pattern);

        let dsReq = store.dispatch(ModelCatalogApi.myCatalog.datasetSpecification.getAll());
        let vpReq = store.dispatch(ModelCatalogApi.myCatalog.variablePresentation.getAll());
        dsReq.then((dss : IdMap<DatasetSpecification>) => {
            this.datasetSpecifications = dss;
        });
        vpReq.then((vps: IdMap<VariablePresentation>) => {
            this.variablePresentations = vps;
        })

        Promise.all([dsReq, vpReq]).then(() => {
            if (this.possibleSetups) {
                this.filterPossibleOptions(this.possibleSetups);
            }
        });
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);

        if (this.datasetSpecifications && this.variablePresentations) {
            let variablePresentationOptions : {[key:string] : string} = {};
            matchingSetups.forEach((s:ModelConfigurationSetup) =>
                (s.hasInput||[])
                    .map((input:DatasetSpecification) => this.datasetSpecifications[input.id])
                    .forEach((input:DatasetSpecification) => 
                        (input.hasPresentation||[])
                            .map((vp:VariablePresentation) => this.variablePresentations[vp.id])
                            .forEach((vp:VariablePresentation) => {
                                this.countOption(vp.id);
                                variablePresentationOptions[vp.id] = getLabel(vp);
                            })
                    )
            );

            this.setVariableOptions("?variable", variablePresentationOptions);
        }
    }

    public createCopy () : HasInputVariableQuestion {
        return new HasInputVariableQuestion(this.id, this.name, this.template, this.pattern);
    }

    public applyFilter (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let varid : string = this.settedOptions["?variable"];
        return modelsToFilter.filter((s:ModelConfigurationSetup) => 
            !!s.hasInput && 
            s.hasInput
                .map((input:DatasetSpecification) => this.datasetSpecifications[input.id])
                .some((input:DatasetSpecification) => 
                    (input.hasPresentation||[])
                        .map((vp:VariablePresentation) => this.variablePresentations[vp.id])
                        .some((vp:VariablePresentation) => vp.id === varid)
                )
        )
    }
}