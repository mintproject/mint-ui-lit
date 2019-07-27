interface resource {
    uri:    string;
    label?: string;
    desc?:  string;
}

export interface VersionDetail extends resource { configs?: ConfigDetail[] }
export interface ConfigDetail extends resource { calibrations?: CalibrationDetail[] }
export interface CalibrationDetail extends resource {}

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

export interface CompIODetail {
    label: string;
    desc: string;
    vars: string[];
    comp_config?: string;
}
