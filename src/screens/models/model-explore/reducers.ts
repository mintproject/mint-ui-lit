import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_SELECT, EXPLORER_DETAILS, EXPLORER_VERSIONS, EXPLORER_IO } from './actions'

export interface FetchedModel {
    uri: string,
    label: string,

    doc?: string,
    desc?: string,
    logo?: string,
    keywords?: string, //FIXME can by an array if slit()
    assumptions?: string,
    versions?: string[],
    categories?: string[],
    screenshots?: string[],
    authors?: string[],
    referenceP?: string,
    contactP?: string,
    publisher?: string,
    type?: string,
    sampleVisualization?: string,
}

export interface IODetail {
    uri: string,    //io
    kind: string,   //prop (model:hasInput or mode:hasOutput)
    format?: string,//format
    dim?: string,   //dim
    desc?: string,  //ioDescription
    type: string,   //type (URI)
    label: string,  //ioLabel
    units?: string, //units
    vp?: string,
    sv?: string,
    rl?: string,
}

export interface VersionDetail {
    uri: string,
    config: ConfigDetail[]
}

interface ConfigDetail {
    uri: string,
    calibration: string[],
}

export type UriModels = Map<string, FetchedModel>;
type UriIO = Map<string, IODetail[]>;
type UriVersion = Map<string, VersionDetail[]>;

export interface ExplorerState {
    models: UriModels,
    io: UriIO, 
    version: UriVersion,
    selected: string
}

const INITIAL_STATE: ExplorerState = { 
    models: {} as UriModels,
    io: {} as UriIO,
    version: {} as UriVersion,
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
            //console.log(state, action);
            if (state.models[action.uri]) {
                let ios : IODetail[] = [];
                action.details.forEach( io => {
                    let newIO : IODetail = {
                        uri: io['io'].value,
                        kind: io['prop'].value,  //(model:hasInput or mode:hasOutput)
                        type: io['type'].value,  //type (URI)
                        label: io['iolabel'].value  //iolabel
                    }

                    if (io['dim']) newIO['dim'] = io['dim'].value;
                    if (io['format']) newIO['format'] = io['format'].value;
                    if (io['desc']) newIO['desc'] = io['desc'].value;
                    if (io['units']) newIO['units'] = io['units'].value;
                    if (io['vp']) newIO['vp'] = io['vp'].value;
                    if (io['sv']) newIO['sv'] = io['sv'].value;
                    if (io['rl']) newIO['rl'] = io['rl'].value;

                    ios.push( newIO );
                })
                //state.models[action.uri].io = ios;
                state.io[action.uri] = ios;
            }
            break;
        case EXPLORER_VERSIONS:
            let versions : VersionDetail[] = [];
            // FIXME this could be done better or use other datatype..
            let data = {};
            action.details.forEach( (obj: any) => {
                if (!data[obj['version'].value]) {
                    data[obj['version'].value] = {};
                }
                if (obj['config'] &&
                    !data[obj['version'].value][obj['config'].value]) {
                    data[obj['version'].value][obj['config'].value] = []
                }
                if (obj['calibration']) {
                    data[obj['version'].value][obj['config'].value].push(obj['calibration'])
                }
            })
            Object.keys(data).forEach( version => {
                let vd : VersionDetail = {
                    uri: version,
                    config: []
                }
                Object.keys(data[version]).forEach( config => {
                    vd.config.push(
                        {uri: config, calibration: data[version][config].map((obj:any) => obj.value)}
                    )
                })
                versions.push(vd)
            })
            state.version[action.uri] = versions
            break;
        case EXPLORER_IO:
            //console.log(state, action);
            let ios : IODetail[] = [];
            action.details.forEach( io => {
                let newIO : IODetail = {
                    uri: io['io'].value,
                    kind: io['prop'].value,  //(model:hasInput or mode:hasOutput)
                    type: io['type'].value,  //type (URI)
                    label: io['iolabel'].value  //iolabel
                }
                if (io['format']) newIO['format'] = io['format'].value;
                if (io['ioDescription']) newIO['desc'] = io['ioDescription'].value;

                ios.push( newIO );
            })
            //state.models[action.uri].io = ios;
            state.io[action.uri] = ios;
            console.log(state)
            break;
    }
    return {
      ...state
    }
};

export default explorer;
