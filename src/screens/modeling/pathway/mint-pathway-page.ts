import { property } from "lit-element";
import { RootState } from "../../../app/store";
import { PageViewElement } from "../../../components/page-view-element";

import { Pathway, Scenario } from "../reducers";
import { getUISelectedPathway } from "../../../util/state_functions";
import { User } from "firebase";
import { UserPreferences } from "app/reducers";

export class MintPathwayPage extends PageViewElement {
    @property({type: Object})
    protected scenario!: Scenario;
    
    @property({type: Object})
    protected pathway!: Pathway

    @property({type: Object})
    protected user: User | null = null;

    @property({type: Object})
    protected prefs: UserPreferences | null = null;

    setPathway(state: RootState): Boolean {
        let pathway: Pathway = getUISelectedPathway(state)!;
        if(pathway && (pathway != this.pathway)) {
            this.pathway = pathway;
            return true;
        }
        this.pathway = pathway;
        return false;
    }

    setUser(state: RootState) {
        this.user = state.app.user!;
        this.prefs = state.app.prefs!;
    }
}