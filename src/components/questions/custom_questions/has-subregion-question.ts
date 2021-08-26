import { ModelConfigurationSetup, Region } from "@mintproject/modelcatalog_client";
import { IdMap } from "app/reducers";
import { store } from "app/store";
import { customElement, LitElement, property, html, css, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { getLabel } from "model-catalog/util";
import { ModelQuestion } from '../model-question';

@customElement("has-sub-region-question")
export class HasSubRegionQuestion extends ModelQuestion {
    private regions : IdMap<Region>;

    constructor (
            id:string = "hasSubRegionQuestion",
            name:string = "Model is configured to work on an especific region",
            template:string = "That are configured to work on ?region",
            pattern: string = "?model <https://w3id.org/okn/o/sdm#hasRegion> ?region ."
        ) {
        super(id, name, template, pattern);

        let regionReq = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        regionReq.then((regions : IdMap<Region>) => {
            this.regions = regions;
            if (this.possibleSetups) {
                this.filterPossibleOptions(this.possibleSetups);
            }
        });
    }

    public filterPossibleOptions(matchingSetups: ModelConfigurationSetup[]) {
        super.filterPossibleOptions(matchingSetups);

        if (this.regions) {
            let regionOptions : {[key:string] : string} = {};
            matchingSetups.forEach((s:ModelConfigurationSetup) =>
                (s.hasRegion||[]).forEach((r:Region) => {
                    this.countOption(r.id);
                    regionOptions[r.id] = getLabel(this.regions[r.id] ? this.regions[r.id] : getLabel(r));
                })
            );

            this.setVariableOptions("?region", regionOptions);
        }
    }

    public createCopy () : HasSubRegionQuestion {
        return new HasSubRegionQuestion(this.id, this.name, this.template, this.pattern);
    }

    public applyFilter (modelsToFilter: ModelConfigurationSetup[]): ModelConfigurationSetup[] {
        let regionid : string = this.settedOptions["?region"];
        return modelsToFilter.filter((s:ModelConfigurationSetup) => !!s.hasRegion && s.hasRegion.some((r:Region) => r.id === regionid));
    }
}