interface Resource {
    uri:    string;
    label?: string;
    desc?:  string;
}

export interface VersionDetail extends Resource { configs?: ConfigDetail[], id: string }
export interface ConfigDetail extends Resource { calibrations?: CalibrationDetail[] }
export interface CalibrationDetail extends Resource {}
export interface ExplanationDiagramDetail extends Resource { url: string, source?: string }

export interface FetchedModel extends Resource {
    // General stuff
    logo?:                  string;     // URL to logo
    dateC?:                 string;     // Creation Date
    shortDesc?:             string;     // Short description
    type?:                  string;     // Model type ##
    keywords?:              string[];   // Keywords ;;
    categories?:            string[];   // Categories ,
    // Overview
    purpose?:               string[];   // Purpose  ;;
    assumptions?:           string; // Assumption ...
    restrictions?:          string; // Restrictions <--- ???
    faq?:                   string;     // FAQ <--- ???
    // Publication & founding
    contactP?:              string; // Contact person 
    dateP?:                 string; // Published Date
    fundS?:                 string; // Funding Source
    publisher?:             string; // Publisher
    referenceP?:            string; // Reference
    authors?:               string[]; // Authors ,
    citations?:             string; // Citations ,  
    contributors?:          string; // URI of contributors , 
    // Technical stuff
    installInstr?:          string; // URL to Instalation instructions
    memReq?:                string; // Memory requeriments <---- ???
    procReq?:               string; // Processor requeriments <--- ???
    softwareReq?:           string; // Software requeriments <--- ???
    os?:                    string[]; // OS ;;
    pl?:                    string[]; // Programming language
    doc?:                   string; // URL to documentation
    sourceC?:               string; // URL to source code
    downloadURL?:           string; // URL to download
    // Media
    screenshots?:           string; // URL of screenshots
    explanationDiagrams?:   string; // URI of explanation diagrams.
    sampleVisualization?:   string; // URL of Sample visualizations
    web?:                   string; // URL to web page
    // ???
    grid?:                  string; // URI of one grid
    versions?:              string[]; // URI versions ,
    typicalDataSource?:     string; // <---- ???
}

export interface IODetail extends Resource {
    kind:               string; //prop (model:hasInput or mode:hasOutput)
    format?:            string; //format
    dim?:               string; //dim
    type:               string; //type (URI)
    units?:             string[]; //units
    vp?:                string[];
    st?:                string[];
    rl?:                string;
    fixedValueDCId?:    string;
    fixedValueURL?:     string;
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
