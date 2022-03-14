import { property } from "lit-element";
import { RootState, store } from "../../../app/store";
import { PageViewElement } from "../../../components/page-view-element";

import { Thread, ProblemStatementInfo, MintPermission } from "../reducers";
import { User, UserPreferences } from "app/reducers";
import { getUserPermission } from "util/permission_utils";
import { selectThreadSection } from "app/ui-actions";
import { ModelQuestionComposer } from "components/questions/model-question-composer";

export class MintThreadPage extends PageViewElement {
    @property({type: Object})
    protected problem_statement!: ProblemStatementInfo;
    
    @property({type: Object})
    protected thread!: Thread

    @property({type: Object})
    protected user: User | null = null;

    @property({type: Object})
    protected prefs: UserPreferences | null = null;

    @property({type: Object})
    protected permission: MintPermission = null;

    @property({type: Boolean})
    protected _waiting: boolean = false;    

    selectAndContinue(section) {
        if(section == "models") {
            this.thread.refresh = true;
        }
        store.dispatch(selectThreadSection(null));        
    }

    setThread(state: RootState): boolean {
        let thread_id = state.ui!.selected_thread_id;
        this.thread = state.modeling.thread;
        if (this.thread != null) {
            this.permission = getUserPermission(this.thread.permissions ?? [], this.thread.events ?? []);
        } else {
            this.permission = null;
        }
        if (state.modeling.thread && state.modeling.thread.id == thread_id) {
            return false;
        }
        this._waiting = false;

        return true;
    }

    setUser(state: RootState) {
        this.user = state.app.user!;
        this.prefs = state.app.prefs!;
    }
}