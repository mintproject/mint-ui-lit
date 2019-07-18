import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_SELECT, EXPLORER_DETAILS } from './actions'

export interface FetchedModel {
    uri: string,
    label: string,

    doc?: string,
    desc?: string,
    keywords?: string, //FIXME can by an array if slit()
    assumptions?: string,
    versions: string[],
    categories: string[],
    screenshots: string[],

    io: IODetail[]
}

interface IODetail {
    uri: string,    //io
    kind: string,   //prop (model:hasInput or mode:hasOutput)
    format?: string,//format
    dim?: string,   //dim
    desc?: string,  //ioDescription
    type: string,   //type (URI)
    label: string,  //ioLabel
    units?: string, //units
    vp?: string
    sv?: string
    rl?: string,
}

export type UriModels = Map<string, FetchedModel>;

export interface ExplorerState {
    models: UriModels,
    selected: string
}

const INITIAL_STATE: ExplorerState = { 
    models: {} as UriModels,
    selected: ''
};

const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_FETCH:
            state.models = action.models;
            break;
        case EXPLORER_SELECT:
            state.selected = action.key;
            break;
        case EXPLORER_DETAILS:
            console.log(state, action);
            if (state.models[action.uri]) {
                let ios : IODetail[] = [];
                action.details.forEach( io => {
                    let newIO : IODetail = {
                        uri: io['io'],
                        kind: io['prop'],  //(model:hasInput or mode:hasOutput)
                        type: io['type'],  //type (URI)
                        label: io['iolabel']  //iolabel
                    }

                    /*if (io['format'])
                        format
                    if (io['dim'])
                        dim
                    if (io['desc'])
                        desc
                    if (io['units'])
                        units
                    if (io['vp'])
                        vp
                    if (io['sv'])
                        sv
                    if (io['rl'])
                        rl*/

                    ios.push( newIO );
                })
                state.models[action.uri].io = ios;
            }
            break;
    }
    return {
      ...state
    }
};

export default explorer;
