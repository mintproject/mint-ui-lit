import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_SELECT_MODEL, EXPLORER_SELECT_VERSION, EXPLORER_SELECT_CONFIG, EXPLORER_SELECT_CALIBRATION,
         EXPLORER_FETCH, EXPLORER_VERSIONS, EXPLORER_IO, EXPLORER_VAR_UNIT, EXPLORER_COMPATIBLE_INPUT,
         EXPLORER_COMPATIBLE_OUTPUT} from './actions'

export interface FetchedModel {
    uri: string,
    label: string,

    doc?: string,
    desc?: string,
    logo?: string,
    keywords?: string, //FIXME can by an array if slit()
    assumptions?: string,
    ver?: string[],
    categories?: string[],
    screenshots?: string[],
    authors?: string[],
    referenceP?: string,
    contactP?: string,
    publisher?: string,
    type?: string,
    sampleVisualization?: string,
    fundS?: string;
    downloadURL?: string;
    dateC?: string;
    installInstr?: string;
    pl?: string[];
    sourceC?: string;
    os?: string[];

    io?: IODetail[];
    version?: VersionDetail[];
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

    variables: VariableDetail[];
    //this is for the UI... :-(
    active: boolean;
}

export interface VariableDetail {
    uri: string;
    label: string;
    unit?: string;
    desc?: string;
    longName?: string;
    shortName?: string;
    sn?: string;
    rl?: string;
}

export interface VersionDetail {
    uri: string;
    config?: ConfigDetail[];
}

export interface ConfigDetail {
    uri: string;
    calibration?: CalibrationDetail[];
}

export interface CalibrationDetail {
    uri: string;
}

export interface CompIODetail {
    label: string;
    desc: string;
    vars: string[];
    comp_config?: string;
}

export type UriModels = Map<string, FetchedModel>;
type UriIO = Map<string, IODetail[]>;
type UriVersion = Map<string, VersionDetail[]>;
type UriVariable = Map<string, VariableDetail[]>;
type UriCompIO = Map<string, CompIODetail[]>;

export interface ExplorerState {
    models: UriModels,
    io: UriIO, 
    version: UriVersion,
    variables: UriVariable,
    compatibleInput: UriCompIO;
    compatibleOutput: UriCompIO;
    selectedModel: string;
    selectedVersion: string;
    selectedConfig: string;
    selectedCalibration: string;
}

const INITIAL_STATE: ExplorerState = { 
    models: {} as UriModels,
    io: {} as UriIO,
    version: {} as UriVersion,
    variables: {} as UriVariable,
    compatibleInput: {} as UriCompIO,
    compatibleOutput: {} as UriCompIO,
    selectedModel: '',
    selectedVersion: '',
    selectedConfig: '',
    selectedCalibration: '',
};

const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_SELECT_MODEL:
            state.selectedModel = action.uri;
            break;
        case EXPLORER_SELECT_VERSION:
            state.selectedVersion = action.uri;
            break;
        case EXPLORER_SELECT_CONFIG:
            state.selectedConfig = action.uri;
            break;
        case EXPLORER_SELECT_CALIBRATION:
            state.selectedCalibration = action.uri;
            break;
        case EXPLORER_FETCH:
            state.models = action.models;
            break;
        case EXPLORER_VERSIONS:
            state.version[action.uri] = action.details;
            state.models[action.uri].version = action.details;
            break;
        case EXPLORER_VAR_UNIT:
            state.variables[action.uri] = action.details;
            break;
        case EXPLORER_IO:
            let ios : IODetail[] = [];
            action.details.forEach( io => {
                ios.push( io as IODetail );
            })
            state.io[action.uri] = ios;
            break;
        case EXPLORER_COMPATIBLE_INPUT:
            state.compatibleInput[action.uri] = action.details;
            break;
        case EXPLORER_COMPATIBLE_OUTPUT:
            state.compatibleOutput[action.uri] = action.details;
            break;
    }
    return {
      ...state
    }
};

export default explorer;
