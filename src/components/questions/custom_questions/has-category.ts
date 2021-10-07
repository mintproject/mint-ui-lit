import { ModelCategory, ModelConfigurationSetup } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { store } from "app/store";
import { customElement } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel } from "model-catalog-api/util";
import { ModelQuestion } from '../model-question';

@customElement("has-category-question")
export class HasCategoryQuestion extends ModelQuestion {
    private categories : IdMap<ModelCategory>;

    constructor (
            id:string = "hasCategoryQuestion",
            name:string = "Model is part of a specific category",
            template:string = "That are part of ?category models",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasModelCategory> ?category ."
        ) {
        super(id, name, template, pattern);

        let catReq = store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll());
        catReq.then((categories : IdMap<ModelCategory>) => {
            this.categories = categories;
            if (this.possibleSetups) {
                this.filterPossibleOptions(this.possibleSetups);
            }
        });
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);

        if (this.categories) {
            let categoryOptions : {[key:string] : string} = {};
            matchingSetups.forEach((s:ModelConfigurationSetup) =>
                (s.hasModelCategory||[]).forEach((c:ModelCategory) => {
                    this.countOption(c.id);
                    categoryOptions[c.id] = getLabel(this.categories[c.id] ? this.categories[c.id] : getLabel(c));
                })
            );

            this.setVariableOptions("?category", categoryOptions);
        }
    }

    public createCopy () : HasCategoryQuestion {
        return new HasCategoryQuestion(this.id, this.name, this.template, this.pattern);
    }

    public filterModels (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let catid : string = this.settedOptions["?category"];
        return modelsToFilter.filter((s:ModelConfigurationSetup) => !!s.hasModelCategory && s.hasModelCategory.some((c:ModelCategory) => c.id === catid));
    }
}