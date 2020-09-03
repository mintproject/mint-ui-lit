import { property } from "lit-element";
import { RootState } from "../../../app/store";
import { PageViewElement } from "../../../components/page-view-element";

import { Thread, ProblemStatementInfo } from "../reducers";
import { getUISelectedThread } from "../../../util/state_functions";
import { User } from "firebase";
import { UserPreferences } from "app/reducers";

export class MintThreadPage extends PageViewElement {
    @property({type: Object})
    protected problem_statement!: ProblemStatementInfo;
    
    @property({type: Object})
    protected thread!: Thread

    @property({type: Object})
    protected user: User | null = null;

    @property({type: Object})
    protected prefs: UserPreferences | null = null;

    setThread(state: RootState): Boolean {
        let thread_id = state.ui!.selected_thread_id;
        this.thread = state.modeling.thread;
        if(state.modeling.thread && state.modeling.thread.id == thread_id) {
            return false;
        }
        return true;
    }

    setUser(state: RootState) {
        this.user = state.app.user!;
        this.prefs = state.app.prefs!;
    }
}