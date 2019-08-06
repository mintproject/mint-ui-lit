interface Resource {
    uri:    string;
    label?: string;
    desc?:  string;
}

export interface VersionDetail extends Resource { configs?: ConfigDetail[] }
export interface ConfigDetail extends Resource { calibrations?: CalibrationDetail[] }
export interface CalibrationDetail extends Resource {}
export interface ExplanationDiagramDetail extends Resource { url: string, source?: string }

export interface FetchedModel extends Resource {
    doc?:                   string;
    logo?:                  string;
    keywords?:              string[];
    assumptions?:           string;
    ver?:                   string[];
    categories?:            string[];
    screenshots?:           string[];
    authors?:               string[];
    referenceP?:            string;
    contactP?:              string;
    publisher?:             string;
    type?:                  string;
    sampleVisualization?:   string;
    fundS?:                 string;
    downloadURL?:           string;
    dateC?:                 string;
    installInstr?:          string;
    pl?:                    string[];
    sourceC?:               string;
    os?:                    string[];
    purpose?:               string[];
}

export interface IODetail extends Resource {
    kind:       string; //prop (model:hasInput or mode:hasOutput)
    format?:    string; //format
    dim?:       string; //dim
    type:       string; //type (URI)
    units?:     string; //units
    vp?:        string;
    sv?:        string;
    rl?:        string;
}

export interface VariableDetail extends Resource {
    unit?:      string;
    longName?:  string;
    shortName?: string;
    sn?:        string;
    rl?:        string;
}

export interface CompIODetail extends Resource {
    vars:           string[];
}
