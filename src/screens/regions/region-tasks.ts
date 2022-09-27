import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { RegionQueryPage } from './region-query-page';
import { SharedStyles } from 'styles/shared-styles';
import { goToPage } from 'app/actions';

@customElement('region-tasks')
export class RegionTasks extends connect(store)(RegionQueryPage)  {
    @property({type: Boolean})
    private _tasks_loading : boolean = false;

    @property({type: Object})
    private _tasks : any = [];

    @property({type: Object})
    private _scenarios : any = {};

    static get styles() {
        return [
            SharedStyles,
            css `
            `
        ];
    }

    protected render() {
        return html`
            ${this._selectedRegion ? 
                html`
                    <wl-title level="4" style="font-size: 17px;">Tasks for ${this._selectedRegion.name}</wl-title>
                    ${this._tasks_loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` :
                    this._tasks.length === 0 ? 'No tasks for this region' : 
                    
                    Object.keys(this._scenarios).map((sid:string) => html`
                    <wl-expansion name="scenarios">
                        <span slot="title">${this._scenarios[sid]}</span>
                        ${this._tasks.filter((el) => el.scenarioid === sid).map((el) => html`
                        <wl-list-item class="active" @click="${() => this._goToTask(el)}">
                            <wl-title level="4" style="margin: 0">
                            ${el.name}
                            </wl-title>
                            ${el.rvar ? el.rvar + ':' : ''}
                            ${this._selectedRegion.name}
                            <div slot="after" style="display:flex">
                            ${this._renderDates(el.dates)}
                            </div>
                        </wl-list-item>
                        `)}
                    </wl-expansion>
                    `)
                    }
                `
                : ""
            }
        `;
    }

    _renderDates (date) {
        return "";
        /* FIXME
        let startdate = fromTimeStampToDateString(date!.start_date);
        let enddate = fromTimeStampToDateString(date!.end_date);
        return startdate + " - " + enddate;*/
    }

    _goToTask (el) {
        goToPage('modeling/scenario/' + el.scenarioid + '/' + el.taskid + '/' + el.pathwayid);
    }

    async _getTasks () {
        this._tasks_loading = true;
        let tasks = [];
        let scenarios = {};
        let promises = [];

        /* TODO: Update this to work with graphql
        await db.collection("scenarios").where('regionid', '==', this._regionid).get().then((querySnapshot) => {
          querySnapshot.forEach((scenario) => {
            let sid = scenario.get('id');
            let l = scenario.ref.collection('subgoals').where('subregionid', '==', this._selectedRegion.id).get().then((qsnap) => {
              qsnap.forEach((task) => {
                  let tname = task.get('name');
                  let tvar  = task.get('response_variables');
                  let pathw = task.get('pathways')
                  let tdate = task.get('dates');
                  if (tname) {
                    if (!scenarios[sid]) {
                        scenarios[sid] = scenario.get('name');
                    }
                    tasks.push({
                        scenarioid: sid,
                        taskid: task.ref.id,
                        pathwayid: Object.keys(pathw)[0],
                        name: tname,
                        rvar: tvar.length > 0 ? tvar[0] : null,
                        dates: tdate
                    })
                  }
              });
            })
            promises.push(l);
          })
        })

        Promise.all(promises).then(() => {
            this._tasks = tasks;
            this._scenarios = scenarios;
            this._tasks_loading = false;
        });*/
    }

    stateChanged(state: RootState) {
        let curregion = this._selectedRegion;
        super.setSelectedRegion(state);
        if(this._selectedRegion) {
            if(curregion != this._selectedRegion) {
                // New region. Requery
                this._getTasks();
            }
        }
    }
}
