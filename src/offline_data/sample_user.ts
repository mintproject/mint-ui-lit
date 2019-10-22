import { ModelCatalogPreferences } from "app/reducers";

export const SAMPLE_USER = {
    uid: "234234234234", 
    email: "varunratnakar@gmail.com"
};

export const SAMPLE_MINT_PREFERENCES = {
    "wings": {
        "server": "https://dev.wings.mint.isi.edu",
        "export_url": "http://localhost:8079",
        "username": "mint",
        "password": "Seozie3Eif5tol",
        "domain": "mint-test",
        "storage": "/data/projects/wings/dev/storage/default",
        "dotpath": "/usr/bin/dot",
        "onturl": "http://www.wings-workflows.org/ontology",
        "api": "https://api.wings.mint.isi.edu/v1.0.0",
    },
    "ingestion_api": "https://ingestion.mint.isi.edu/v1.0.0"
};

export const SAMPLE_MINT_PREFERENCES_LOCAL = {
    "wings": {
        "server": "http://localhost:9090/wings-portal",
        "export_url": "http://localhost:9090/wings-portal",
        "username": "admin",
        "password": "admin123",
        "domain": "mintTest",
        "storage": "/Users/varun/.wings/storage",
        "dotpath": "/usr/local/bin/dot",
        "onturl": "http://www.wings-workflows.org/ontology",
        "api": "http://localhost:8080/v1.0.0"
    },
    "ingestion_api": "https://ingestion.mint.isi.edu/v1.0.0"
};