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
    purpose?: string[];

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
    modelMetadata: any;
    parameters: any;
    selectedModel: string;
    selectedVersion: string;
    selectedConfig: string;
    selectedCalibration: string;
}

export const INITIAL_STATE: ExplorerState = { 
    models: {} as UriModels,
    io: {} as UriIO,
    version: {} as UriVersion,
    variables: {} as UriVariable,
    compatibleInput: {} as UriCompIO,
    compatibleOutput: {} as UriCompIO,
    modelMetadata: {},
    parameters: {},
    selectedModel: '',
    selectedVersion: '',
    selectedConfig: '',
    selectedCalibration: '',
}
