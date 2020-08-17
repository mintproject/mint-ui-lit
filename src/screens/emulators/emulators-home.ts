import { html, css, customElement, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/nav-title'
import { db } from 'config/firebase';
import { Pathway, ExecutableEnsembleSummary } from 'screens/modeling/reducers';

import "weightless/tab-group";
import "weightless/tab";

import emulators from './reducers';
import { goToPage } from 'app/actions';

store.addReducers({
    emulators
});

@customElement("emulators-home")
export class EmulatorsHome extends connect(store)(PageViewElement) {
    @property({type: String})
    private _selectedModel : string = '';
    
    static get styles() {
        return [
            css `
            @media (min-width: 1025px) {
                .content {
                    width: 75%;
                }
            }
            @media (max-width: 1024) {
                .content {
                    width: 100%;
                }
            }
            .content {
                margin: 0 auto;
            }
            ul li {
                padding: 10px;
            }
            `,
            SharedStyles
        ];
    }

    private _showEmulators(model) {
        this._selectedModel = model;
        goToPage("emulators/" + model);
    }

    protected render() {
        let nav = [{label:'Model Products / Emulators', url:'emulators'}] 
        if(this._regionid == "ethiopia") {
            return html`
            <nav-title .nav="${nav}"></nav-title>

            <wl-tab-group align="center" style="width: 100%;">
                <wl-tab @click="${() => this._showEmulators('pihm')}" ?checked="${this._selectedModel=='pihm'}">PIHM</wl-tab>
                <wl-tab @click="${() => this._showEmulators('topoflow')}" ?checked="${this._selectedModel=='topoflow'}">TOPOFLOW</wl-tab>
                <wl-tab @click="${() => this._showEmulators('hand')}" ?checked="${this._selectedModel=='hand'}">HAND</wl-tab>
                <wl-tab @click="${() => this._showEmulators('cycles')}" ?checked="${this._selectedModel=='cycles'}">CYCLES</wl-tab>
                <wl-tab @click="${() => this._showEmulators('fsi')}" ?checked="${this._selectedModel=='fsi'}">FSI</wl-tab>
            </wl-tab-group>

            <div id="pihm_emulators" class="emulators" .style="display:${this._selectedModel=='pihm' ? '': 'none'}">
                <h2>PIHM Emulators</h2>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <tr><th>Area</th><th>Region</th><th>Time period</th><th>Input (data preparation has been completed)</th><th>Setup (the model setup available in MINT)</th><th>Ensemble description (range of parameters completed in the simulation)</th><th>Output summary (Ensemble)</th><th>JSON-Summary (triggered manually)</th><th>URL to be shared (with hand-curated metadata and provenance)</th><th>Results reviewed by modeler</th><th>Quality</th><th>Status</th><th>Validated?</th><th>Usage Notes</th><th>Comments</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Baro (Oromia)</td><td>Oromia</td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-baro-gam-2c7bf2138d4fe78680310ca26e2614a4.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-baro-gam-2c7bf2138d4fe78680310ca26e2614a4.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-baro">https://w3id.org/okn/i/mint/pihm-v4.1.0-baro</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/WX6w5WG9syCkp6JhXyAL/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/WX6w5WG9syCkp6JhXyAL/results</a></td><td>n/a</td><td></td><td>Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful
                        <tr><td>Baro (Oromia)</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-baro-gam-6bf82b55ecdeb2169b090fc124ef8117.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-baro-gam-6bf82b55ecdeb2169b090fc124ef8117.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-baro-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-baro-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/wbXTKQmFmEQuQOgMi9Ky/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/wbXTKQmFmEQuQOgMi9Ky/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/gwOa5pU7E7S4HLxc6i9Q_export/summary.json">https://ingestion.mint.isi.edu/data/gwOa5pU7E7S4HLxc6i9Q_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Baro-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Baro-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>YES</td><td>The output of the model is valid after a spin-up phase. 
                        <tr><td>Guder</td><td>Oromia</td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-03e27a812e84d140a93667727bd0a4fd.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-03e27a812e84d140a93667727bd0a4fd.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-guder">https://w3id.org/okn/i/mint/pihm-v4.1.0-guder</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/etZK2mpavnnjJRyfe5mm/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/etZK2mpavnnjJRyfe5mm/results</a></td><td>n/a</td><td></td><td>-Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful
                        <tr><td>Guder</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-213f016b3ecc76180f56c3c3f9cc7a0e.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-213f016b3ecc76180f56c3c3f9cc7a0e.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-guder-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-guder-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/DKn6afMctvVQhaOg0Y5Q/runs">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/DKn6afMctvVQhaOg0Y5Q/runs</a></td><td><a href="https://ingestion.mint.isi.edu/data/DKn6afMctvVQhaOg0Y5Q_export/summary.json">https://ingestion.mint.isi.edu/data/DKn6afMctvVQhaOg0Y5Q_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Guder-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Guder-2000-2018.zip</a></td><td>Chris Duffy</td><td>2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase
                        <tr><td>Muger</td><td>Oromia</td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-11854a20dd2429e4bfa1d21419b47e67.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-11854a20dd2429e4bfa1d21419b47e67.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-muger">https://w3id.org/okn/i/mint/pihm-v4.1.0-muger</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/1L4JMmK1MTmJJFquGFXB/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/1L4JMmK1MTmJJFquGFXB/results</a></td><td>n/a</td><td></td><td>-Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful
                        <tr><td>Muger</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-39eb0c043fa323ebcaa713e2eef654b0.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-39eb0c043fa323ebcaa713e2eef654b0.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-muger-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-muger-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/EniqL0YCVJPRJIF3IrgO/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/EniqL0YCVJPRJIF3IrgO/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/EniqL0YCVJPRJIF3IrgO_export/summary.json">https://ingestion.mint.isi.edu/data/EniqL0YCVJPRJIF3IrgO_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Muger-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Muger-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomaous data.
                        <tr><td>Ganale</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-ganale-9c2c4a61aa5f685fc4821afb948d1214.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-ganale-9c2c4a61aa5f685fc4821afb948d1214.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-ganale-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-ganale-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/5kIaza3ScBZwuVDkQtfc/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/5kIaza3ScBZwuVDkQtfc/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/5kIaza3ScBZwuVDkQtfc_export/summary.json">https://ingestion.mint.isi.edu/data/5kIaza3ScBZwuVDkQtfc_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Ganale-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Ganale-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomalous data.</td></tr>
                        <tr><td>Jamma</td><td></td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-jamma-841383ade6ce27f51ecc4d7da1eae065.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-jamma-841383ade6ce27f51ecc4d7da1eae065.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-jamma">https://w3id.org/okn/i/mint/pihm-v4.1.0-jamma</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/VggqferoeUnXQB93yeBM/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/VggqferoeUnXQB93yeBM/results</a></td><td>n/a</td><td></td><td>Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful</td></tr>
                        <tr><td>Jamma</td><td></td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-jamma-743327e83e8db47a55f1c3ab1db65462.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-jamma-743327e83e8db47a55f1c3ab1db65462.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-jamma-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-jamma-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/7yzeCTrH9z0Y0fAIiGsT/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/7yzeCTrH9z0Y0fAIiGsT/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/7yzeCTrH9z0Y0fAIiGsT_export/summary.json">https://ingestion.mint.isi.edu/data/7yzeCTrH9z0Y0fAIiGsT_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Jamma-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Jamma-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomaous data.</td></tr>
                        <tr><td>Bashilo</td><td></td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-bashilo-670ec7019c625ee04ee56e38e7fb047c.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-bashilo-670ec7019c625ee04ee56e38e7fb047c.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-bashilo">https://w3id.org/okn/i/mint/pihm-v4.1.0-bashilo</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/l3EAhLLCUv2NtFbYVLkp/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/l3EAhLLCUv2NtFbYVLkp/results</a></td><td>n/a</td><td></td><td>Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful
                        <tr><td>Bashilo</td><td></td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-bashilo-f7766968423b8f66c5b9264e819f2733.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-bashilo-f7766968423b8f66c5b9264e819f2733.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-bashilo-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-bashilo-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/VFtUYdyUqcO91MrvGq21/models">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/VFtUYdyUqcO91MrvGq21/models</a></td><td><a href="https://ingestion.mint.isi.edu/data/VFtUYdyUqcO91MrvGq21_export/summary.json">https://ingestion.mint.isi.edu/data/VFtUYdyUqcO91MrvGq21_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Bashilo-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Bashilo-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomaous data.
                        <tr><td>Beko-Tippi</td><td></td><td>2017</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-beko-tippi-a973531b118289dbe142df07be5130ee.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-beko-tippi-a973531b118289dbe142df07be5130ee.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-beko-tippi">https://w3id.org/okn/i/mint/pihm-v4.1.0-beko-tippi</a></td><td>Dates: 2017; PRCP (0.9,1,1.1); SFTMP (-1, 1,2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/PvjIvVMa4ELIQQcDYgIM/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/VFVlWwqUOOpG3PYFko0h/PvjIvVMa4ELIQQcDYgIM/results</a></td><td>n/a</td><td></td><td>Chris Duffy</td><td>1</td><td>Done (initial run to test model in region)</td><td>Yes</td><td>Model test run was successful
                        <tr><td>Beko-Tippi</td><td></td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-beko-tippi-b55168b7f67ef454ed4013ffe2a4b1ea.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-beko-tippi-b55168b7f67ef454ed4013ffe2a4b1ea.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-beko-tippi-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-beko-tippi-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/pCygfd0EDyH6uZ4WL28h/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/pCygfd0EDyH6uZ4WL28h/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/pCygfd0EDyH6uZ4WL28h_export/summary.json">https://ingestion.mint.isi.edu/data/pCygfd0EDyH6uZ4WL28h_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Beko-Tippi-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Beko-Tippi-2000-2018.zip</a></td><td>Chris Duffy</td><td>1-2</td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomaous data.</td></tr>
                        <tr><td>Tekeze</td><td></td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-tekeze-dam-832df7185e048ad6fcad9aa6a3c82f8b.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-tekeze-dam-832df7185e048ad6fcad9aa6a3c82f8b.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-tekeze-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-tekeze-full</a></td><td>Dates: 2000-2018; PRCP (0.9,1,1.1); ETP (0.8, 1, 1.2)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/dRBdVH6uD7P2izq5BFeu/results">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/t6QkONfwbFhUl86NOwT3/dRBdVH6uD7P2izq5BFeu/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/TDfPujmXbubkbLTeF42a_export/summary.json">https://ingestion.mint.isi.edu/data/TDfPujmXbubkbLTeF42a_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/PIHM/Tekeze-2000-2018.zip">https://data.mint.isi.edu/files/sharedResults/PIHM/Tekeze-2000-2018.zip</a></td><td>Chris Duffy</td><td></td><td>Completed</td><td>Yes</td><td>The output of the model is valid after a spin-up phase with some anomaous data.
                        <tr><td>Guder</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-213f016b3ecc76180f56c3c3f9cc7a0e.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-guder-213f016b3ecc76180f56c3c3f9cc7a0e.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-guder-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-guder-full</a></td><td>Dates: 2000-2018; KSAT_H (1,10,100)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/5sDvhHCpCpypIDbreX3x/rpQYw90KZyKIzla8wBnk">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/5sDvhHCpCpypIDbreX3x/rpQYw90KZyKIzla8wBnk</a></td><td></td><td></td><td></td><td></td><td>Completed
                        <tr><td>Muger</td><td>Oromia</td><td>2008-April2018</td><td><a href="https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-39eb0c043fa323ebcaa713e2eef654b0.tgz">https://data.mint.isi.edu/files/wings-dev/mint/mint-test/data/pihm-input-muger-39eb0c043fa323ebcaa713e2eef654b0.tgz</a></td><td><a href="https://w3id.org/okn/i/mint/pihm-v4.1.0-muger-full">https://w3id.org/okn/i/mint/pihm-v4.1.0-muger-full</a></td><td>Dates: 2000-2018; KSAT_H (1,10,100)</td><td><a href="/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/5sDvhHCpCpypIDbreX3x/q2pgLYLnZIPteKH9mN8a">/ethiopia/modeling/scenario/hcbtnXF5gRSnUIszeEcI/5sDvhHCpCpypIDbreX3x/q2pgLYLnZIPteKH9mN8a</a></td><td></td><td></td><td></td><td></td><td>Completed
                    </tbody>
                </table>
            </div>

            <div id="topoflow_emulators" .style="display:${this._selectedModel=='topoflow' ? '': 'none'}" class="emulators">
                <h2>TOPOFLOW Emulators</h2>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <tr><th>Area</th><th>Region</th><th>Time period</th><th>Input (data preparation has been completed)</th><th>Setup (the model setup available in MINT)</th><th>Ensemble description (range of parameters completed in the simulation)</th><th>Output summary (Ensemble)</th><th>JSON-Summary (triggered manually)</th><th>URL to be shared (with hand-curated metadata and provenance)</th><th>Results reviewed by modeler</th><th>Status</th><th>Validated?</th><th>Usage Notes</th><th>Comments</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Baro (Oromia)</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip">https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip</a><br>Precip rates: <a href="https://publisher.mint.isi.edu/ognUm/topoflow_gpm_2018_baro_15quantile.tar.gz">https://publisher.mint.isi.edu/ognUm/topoflow_gpm_2018_baro_15quantile.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Baro">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Baro</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/s8WAHXQKYliYbP90ntzn/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/s8WAHXQKYliYbP90ntzn/results</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Baro (variable precip rates)</td><td>Oromia</td><td>2018 (Forecast)</td><td>- Config: <a href="https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip ">https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip </a><br>- Data catalog ids: <br><a href="/ethiopia/datasets/browse/bf5bf384-768e-4037-b7ff-08169869dd24/xTESsM6UaTIAfckPVWbs">/ethiopia/datasets/browse/bf5bf384-768e-4037-b7ff-08169869dd24/xTESsM6UaTIAfckPVWbs</a><br> <a href="/ethiopia/datasets/browse/74e99ea2-235b-4994-a136-1fec22b21849/xTESsM6UaTIAfckPVWbs">/ethiopia/datasets/browse/74e99ea2-235b-4994-a136-1fec22b21849/xTESsM6UaTIAfckPVWbs</a><br> <a href="/ethiopia/datasets/browse/297b7d16-d2ca-407a-aec7-26db3ec480fa/xTESsM6UaTIAfckPVWbs">/ethiopia/datasets/browse/297b7d16-d2ca-407a-aec7-26db3ec480fa/xTESsM6UaTIAfckPVWbs</a><br> <a href="/ethiopia/datasets/browse/15799674-a408-4e18-be93-184c04e8ba93/xTESsM6UaTIAfckPVWbs">/ethiopia/datasets/browse/15799674-a408-4e18-be93-184c04e8ba93/xTESsM6UaTIAfckPVWbs</a><br> <a href="/ethiopia/datasets/browse/7cc01424-da6a-4639-bcf3-21e73aa9d564/xTESsM6UaTIAfckPVWbs">/ethiopia/datasets/browse/7cc01424-da6a-4639-bcf3-21e73aa9d564/xTESsM6UaTIAfckPVWbs</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/l8uffgtNXqCRexz76puM/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/l8uffgtNXqCRexz76puM/results</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Baro (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Baro_30sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Baro_30sec.zip -</a><br>Precipitation rates: <a href="/ethiopia/datasets/browse/6def2f0c-4077-40d2-ac16-4ecbcf3a57ce/ethiopia">/ethiopia/datasets/browse/6def2f0c-4077-40d2-ac16-4ecbcf3a57ce/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro ">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro </a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/EvdhYtTJ42aS8BaZ2yGS/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/EvdhYtTJ42aS8BaZ2yGS/runs</a></td><td><a href="https://ingestion.mint.isi.edu/data/EvdhYtTJ42aS8BaZ2yGS_export/summary.json">https://ingestion.mint.isi.edu/data/EvdhYtTJ42aS8BaZ2yGS_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Baro/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Baro/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Baro (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Baro</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/zhprlchxCS092iaddiyD/datasets">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/zhprlchxCS092iaddiyD/datasets</a></td><td><a href="https://ingestion.mint.isi.edu/data/UO9HCLXgdFaJPuJtuRHG_export/summary.json">https://ingestion.mint.isi.edu/data/UO9HCLXgdFaJPuJtuRHG_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Baro/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Baro/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Baro (GPM)-30</td><td>Oromia</td><td>2018</td><td>- Config: <a href="https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip.">https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip.</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/climate/baro_gpm_2018_30.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/climate/baro_gpm_2018_30.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow36_2.1.0_Baro">https://w3id.org/okn/i/mint/topoflow36_2.1.0_Baro</a></td><td>Start date: 1/1/2018; end date: 12/31/2018; dt: 4; dt_meteo:1800</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/2B2ULd7YlwcVD9dCOTiX/vJLcvvBFWhFxv7gOZuqH/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/2B2ULd7YlwcVD9dCOTiX/vJLcvvBFWhFxv7gOZuqH/results</a></td><td>Not done, Scott asked not to share</td><td>Not done, Scott asked not to share for now</td><td></td><td>Finished</td></tr>
                        <tr><td>Baro (GPM)-30</td><td>Oromia</td><td>2008-2018</td><td>- Config: <a href="https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip.">https://github.com/mintproject/MINT-WorkflowDomain/raw/master/WINGSWorkflowComponents/topoflow-36/data/Baro_Gam_1min_Input.zip.</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/climate/baro_gpm_2018_30.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/climate/baro_gpm_2018_30.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow36_2.1.0_Baro">https://w3id.org/okn/i/mint/topoflow36_2.1.0_Baro</a></td><td>Start date: 1/1/2008; end date: 12/31/2018; dt: 4; dt_meteo:1800</td><td></td><td></td><td></td><td></td><td>Finished</td></tr>
                        <tr><td>Guder</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip,">https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip,</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/guder_gpm_2008_30_agg.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/guder_gpm_2008_30_agg.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Guder">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Guder</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/sK53rJ9YTm8fiOQ1QVeF/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/sK53rJ9YTm8fiOQ1QVeF/runs</a></td><td>-</td><td></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Guder (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/0113a9dd-0a1a-442c-8cbb-49950d8c6ab3/ethiopia">/ethiopia/datasets/browse/0113a9dd-0a1a-442c-8cbb-49950d8c6ab3/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Guder">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Guder</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/jzZVBuCmAEvzAcWY2SQ9">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/jzZVBuCmAEvzAcWY2SQ9</a></td><td><a href="https://ingestion.mint.isi.edu/data/jzZVBuCmAEvzAcWY2SQ9_export/summary.json">https://ingestion.mint.isi.edu/data/jzZVBuCmAEvzAcWY2SQ9_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Guder/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Guder/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Guder (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Guder_30sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/25be6bc5-7a7a-4d03-a8f5-faca98158f2a/ethiopia">/ethiopia/datasets/browse/25be6bc5-7a7a-4d03-a8f5-faca98158f2a/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Guder">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Guder</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/Fom5dKxfMy8CxTnBMWhc">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/Fom5dKxfMy8CxTnBMWhc</a></td><td><a href="https://ingestion.mint.isi.edu/data/Fom5dKxfMy8CxTnBMWhc_export/summary.json">https://ingestion.mint.isi.edu/data/Fom5dKxfMy8CxTnBMWhc_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Guder/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Guder/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Muger</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip;">https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip;</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/muger_gpm_2008_30_agg.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/muger_gpm_2008_30_agg.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Muger">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Muger</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/wjY9dLJbaw9GZttEtPKC/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/wjY9dLJbaw9GZttEtPKC/results</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Muger (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip  -">https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip  -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/4d325edd-78e3-4b85-9d5c-67538f4ccbd0/ethiopia">/ethiopia/datasets/browse/4d325edd-78e3-4b85-9d5c-67538f4ccbd0/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Muger">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Muger</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/kwbvC3XpzUOPDQvYQWCe">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/kwbvC3XpzUOPDQvYQWCe</a></td><td><a href="https://ingestion.mint.isi.edu/data/kwbvC3XpzUOPDQvYQWCe_export/summary.json">https://ingestion.mint.isi.edu/data/kwbvC3XpzUOPDQvYQWCe_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Muger/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Muger/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Muger (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip  -">https://data.mint.isi.edu/files/topoflow-regions/regions/Muger_30sec.zip  -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/5cdfcc63-a9ba-46b4-9bee-fd16ee877936/ethiopia">/ethiopia/datasets/browse/5cdfcc63-a9ba-46b4-9bee-fd16ee877936/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Muger">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Muger</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/gLqZyf3pwYhQBV8NZRGy">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/gLqZyf3pwYhQBV8NZRGy</a></td><td><a href="https://ingestion.mint.isi.edu/data/gLqZyf3pwYhQBV8NZRGy_export/summary.json">https://ingestion.mint.isi.edu/data/gLqZyf3pwYhQBV8NZRGy_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Muger/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Muger/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Awash</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip;">https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip;</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/awash_gpm_2008_60_agg.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/awash_gpm_2008_60_agg.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Awash">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Awash</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/D1epX6cfdmGOyVCh0cab/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/D1epX6cfdmGOyVCh0cab/runs</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Awash (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/8ac790e4-820e-490b-ba66-ee6071ac6104/ethiopia">/ethiopia/datasets/browse/8ac790e4-820e-490b-ba66-ee6071ac6104/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Awash">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Awash</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/LN1z7b6IyXDGVGD6PTGH/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/LN1z7b6IyXDGVGD6PTGH/runs</a></td><td><a href="https://ingestion.mint.isi.edu/data/LN1z7b6IyXDGVGD6PTGH_export/summary.json">https://ingestion.mint.isi.edu/data/LN1z7b6IyXDGVGD6PTGH_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Awash/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Awash/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Awash (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Awash-border_60sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/d818bd9d-28ce-4720-b313-7de67dcf5c71/ethiopia">/ethiopia/datasets/browse/d818bd9d-28ce-4720-b313-7de67dcf5c71/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Awash">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Awash</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/FXzkyMuZhI9No7LMOLUP">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/FXzkyMuZhI9No7LMOLUP</a></td><td><a href="https://ingestion.mint.isi.edu/data/FXzkyMuZhI9No7LMOLUP_export/summary.json">https://ingestion.mint.isi.edu/data/FXzkyMuZhI9No7LMOLUP_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Awash/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Awash/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Shebelle</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip;">https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip;</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/shebelle_gpm_2008_30_agg.tar.gz">https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/shebelle_gpm_2008_30_agg.tar.gz</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Shebelle">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Shebelle</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/2kIRPrHCTMS9xEtkg9Kw/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/2kIRPrHCTMS9xEtkg9Kw/runs</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Shebelle (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/079c1109-01d3-41c2-8798-94cbda23cfe4/ethiopia">/ethiopia/datasets/browse/079c1109-01d3-41c2-8798-94cbda23cfe4/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Shebelle">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Shebelle</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/qE1FKGKW1rpAFcyEEJKH/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/qE1FKGKW1rpAFcyEEJKH/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/qE1FKGKW1rpAFcyEEJKH_export/summary.json">https://ingestion.mint.isi.edu/data/qE1FKGKW1rpAFcyEEJKH_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Shebelle/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Shebelle/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Shebelle (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Shebelle-Imi_60sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/8450a29b-086a-4734-a8d6-b7286726db9a/ethiopia">/ethiopia/datasets/browse/8450a29b-086a-4734-a8d6-b7286726db9a/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Shebelle">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Shebelle</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/g5mtBcfanvdguHqTHwDS/results">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/g5mtBcfanvdguHqTHwDS/results</a></td><td><a href="https://ingestion.mint.isi.edu/data/g5mtBcfanvdguHqTHwDS_export/summary.json">https://ingestion.mint.isi.edu/data/g5mtBcfanvdguHqTHwDS_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Shebelle/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Shebelle/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Ganale</td><td>Oromia</td><td>2008 (gpm)</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip;">https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip;</a><br>Precip rates: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/ganale_gpm_2008_60_agg.tar.gz ">https://data.mint.isi.edu/files/topoflow-regions/regions/inputs%20rates/ganale_gpm_2008_60_agg.tar.gz </a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_simple_Ganale">https://w3id.org/okn/i/mint/topoflow_cfg_simple_Ganale</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/zbMpzCAsnNJFNDZSgoJS/runs">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/4ssRI03e5lNjN2VLuCoa/zbMpzCAsnNJFNDZSgoJS/runs</a></td><td>-</td><td></td><td>-</td><td>Finished</td><td>NO
                        <tr><td>Ganale (GPM)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip -">https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip -</a><br>Precip rates: <a href="/ethiopia/datasets/browse/5f0efdb1-0057-423c-aa6e-90518390d3b3/ethiopia">/ethiopia/datasets/browse/5f0efdb1-0057-423c-aa6e-90518390d3b3/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Ganale">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Ganale</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/mBvSXIOK4AMcXMpuLrFv">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/mBvSXIOK4AMcXMpuLrFv</a></td><td><a href="https://ingestion.mint.isi.edu/data/mBvSXIOK4AMcXMpuLrFv_export/summary.json">https://ingestion.mint.isi.edu/data/mBvSXIOK4AMcXMpuLrFv_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Ganale/GPM.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Ganale/GPM.zip</a></td><td>-</td><td>Finished</td></tr>
                        <tr><td>Ganale (GLDAS)</td><td>Oromia</td><td>2008-April2018</td><td>Config: <a href="https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip">https://data.mint.isi.edu/files/topoflow-regions/regions/Ganale-border_60sec.zip</a><br>Precip rates: <a href="/ethiopia/datasets/browse/06cc80e2-ad97-4c26-965f-04c8ac134809/ethiopia">/ethiopia/datasets/browse/06cc80e2-ad97-4c26-965f-04c8ac134809/ethiopia</a></td><td><a href="https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Ganale">https://w3id.org/okn/i/mint/topoflow_cfg_advanced_Ganale</a></td><td>N/A (no knobs)</td><td><a href="/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/1beCAUFWxJe5WD1wZkIw/models">/ethiopia/modeling/scenario/vol641Tb5Ku9xfI0tC2Q/T6eVSQodyolTmN8x7CAg/1beCAUFWxJe5WD1wZkIw/models</a></td><td><a href="https://ingestion.mint.isi.edu/data/1beCAUFWxJe5WD1wZkIw_export/summary.json">https://ingestion.mint.isi.edu/data/1beCAUFWxJe5WD1wZkIw_export/summary.json</a></td><td><a href="https://data.mint.isi.edu/files/sharedResults/Topoflow/Ganale/GLDAS.zip">https://data.mint.isi.edu/files/sharedResults/Topoflow/Ganale/GLDAS.zip</a></td><td>-</td><td>Finished</td></tr>
                    </tbody>
                </table>
            </div>

            <div id="hand_emulators" .style="display:${this._selectedModel=='hand' ? '': 'none'}" class="emulators">
                <h2>HAND Emulators</h2>
                <h4 style="margin: 2px;">To view and download the inputs used in the execution, click on the Input column.</h4>
                <h4 style="margin: 2px;">To view information about the model associated with the results, click on the setup column.</h4>
                <h4 style="margin: 2px;">To access and download the results, click on the output summary link.</h4>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <tr><th>Area</th><th>Region</th><th>Time period</th><th>Input (data preparation has been completed)</th><th>Setup (the model setup available in MINT)</th><th>Ensemble description (range of parameters completed in the simulation)</th><th>Output summary (Ensemble)</th></tr>
                    </thead>
                    <tbody>

                        <tr>
                            <td>Baro </td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Baro/Baro_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Baro/Baro_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/d42dee74-17b6-4821-b18e-5af4f7e3754c/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/d42dee74-17b6-4821-b18e-5af4f7e3754c/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/OPOZ17QlQq9g47bDiiyU">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/OPOZ17QlQq9g47bDiiyU
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Guder</td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Guder/Guder_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Guder/Guder_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/4268c4ae-6a91-476c-9f0d-57643cfab6ea/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/4268c4ae-6a91-476c-9f0d-57643cfab6ea/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/310lucStjp4XXhN7u1zZ">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/310lucStjp4XXhN7u1zZ
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Muger</td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Muger/Muger_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Muger/Muger_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/01ebfec2-a192-4c4b-a905-37aba583c31b/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/01ebfec2-a192-4c4b-a905-37aba583c31b/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/01ebfec2-a192-4c4b-a905-37aba583c31b/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/01ebfec2-a192-4c4b-a905-37aba583c31b/
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Awash</td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Awash/Awash-border_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Awash/Awash-border_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/1727b1d9-e9d2-4a82-8c7c-188c8cf140b2/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/1727b1d9-e9d2-4a82-8c7c-188c8cf140b2/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/GKs94p4EcggiBVao8Xti">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/GKs94p4EcggiBVao8Xti
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Shebelle</td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Shebelle/Shebelle-Imi_3sec_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Shebelle/Shebelle-Imi_3sec_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/c2e5cb61-4535-4321-8be5-410437d361b8/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/c2e5cb61-4535-4321-8be5-410437d361b8/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/vcG6cIj76iuNTyUhU3Kh">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/vcG6cIj76iuNTyUhU3Kh
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Ganale</td>
                            <td>Oromia</td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Ganale/Ganale-border_3sec_DEM_buffer.tif">
                                    https://data.mint.isi.edu/files/hand-dem/GIS-Oromia/Ganale/Ganale-border_3sec_DEM_buffer.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/853e0986-f642-4035-aa4e-a8679123da90/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/853e0986-f642-4035-aa4e-a8679123da90/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/5Iqar4ruRdiqqGaZSWiG">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/5Iqar4ruRdiqqGaZSWiG
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Jamma</td>
                            <td></td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/Jamma_DEM.tif">
                                    https://data.mint.isi.edu/files/hand-dem/Jamma_DEM.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/433bc0ad-9751-4e79-9472-ddc156ef46e0/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/433bc0ad-9751-4e79-9472-ddc156ef46e0/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/pr1IfNPmDiLQTCy5xZh1">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/pr1IfNPmDiLQTCy5xZh1
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Bashilo</td>
                            <td></td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/Bashilo_DEM.tif">
                                    https://data.mint.isi.edu/files/hand-dem/Bashilo_DEM.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/eba6afdc-c20b-44d6-ab63-702e9498699a/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/eba6afdc-c20b-44d6-ab63-702e9498699a/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/i2qQfaaZHnQl0wF3yRVk">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/i2qQfaaZHnQl0wF3yRVk
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td>Beko-Tippi</td>
                            <td></td>
                            <td>N/A</td>
                            <td>
                                <a href="https://data.mint.isi.edu/files/hand-dem/Beko-Tippi_DEM.tif">
                                    https://data.mint.isi.edu/files/hand-dem/Beko-Tippi_DEM.tif
                                </a>
                            </td>
                            <td>
                                <a href="/ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/bc7179eb-bbcf-4042-963d-ef01fa331886/">
                                    /ethiopia/models/explore/HAND/HANDv2/hand_v2_raster/bc7179eb-bbcf-4042-963d-ef01fa331886/
                                </a>
                            </td>
                            <td>Threshold: 500</td>
                            <td>
                                <a href="/ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/bP8Y4q31sDdhAzlZZU2J">
                                    /ethiopia/modeling/scenario/vKAnkUcLzKqVnfwr1Qy2/wdS8drGoYwN4OJbIwnVn/bP8Y4q31sDdhAzlZZU2J
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div id="cycles_emulators" .style="display:${this._selectedModel=='cycles' ? '': 'none'}" class="emulators">
                <h2>CYCLES Emulators</h2>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <tr><th>Region</th><th>Time period</th><th>Input (data preparation has been completed)</th><th>Setup (the model setup available in MINT)</th><th>Ensemble description (range of parameters completed in the simulation)</th><th>Output summary (Ensemble)</th><th>Results reviewed by modeler</th><th>Status</th><th>Validated?</th><th>Shared results</th><th>Comments</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Oromia region (1 point per Woreda)</td><td>2000-2017</td><td>Crop: <a href="https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop">https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop</a><br>Weather-Soil: <a href="/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia">/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia">/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia</a></td><td>Start year: 2000; End year: 2017; crop:Sesame; planting date: 152; end planting date: 201; fert rates: 0, 78, 156, 312, 625; weed fraction: 0.05, 0.25, 1</td><td><a href="/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/SQfF7dWbW6aCfJpOP46Z/LK668mvW46e8W3gc9Zaj/results">/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/SQfF7dWbW6aCfJpOP46Z/LK668mvW46e8W3gc9Zaj/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td><a href="https://data.mint.isi.edu/files/sharedResults/Cycles/sesame.zip">https://data.mint.isi.edu/files/sharedResults/Cycles/sesame.zip</a></td></tr>
                        <tr><td>Oromia region (1 point per Woreda)</td><td>2000-2017</td><td>Crop: <a href="https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop">https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop</a><br>Weather-Soil: <a href="/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia">/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia">/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia</a></td><td>Start year: 2000; end year: 2017; crop:Maize, Sorghum; planting date: 121; end planting date: 196; fert rates: 0, 78, 156, 312, 625, 1250; weed fraction: 0.05, 0.25, 1</td><td><a href="/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/TGkwnP8xDcVZl98a4P2b/ylaGy6lRW59X17JvSMVT/results">/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/TGkwnP8xDcVZl98a4P2b/ylaGy6lRW59X17JvSMVT/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td><a href="https://data.mint.isi.edu/files/sharedResults/Cycles/maize_sorghum.zip">https://data.mint.isi.edu/files/sharedResults/Cycles/maize_sorghum.zip</a></td></tr>
                        <tr><td>Oromia region (1 point per Woreda)</td><td>2000-2017</td><td>Crop:<a href="https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop">https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop</a><br>Weather-Soil: <a href="/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia"">/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia"</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia">/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia</a></td><td>Start year: 2000; end year: 2017; crop:SpringBarley; planting date: 135; end planting date: 196; fert rates: 0, 78, 156, 312, 625; weed fraction: 0.05, 0.25, 1</td><td><a href="/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/VXE8dVUiEyN1FY4zHSOV/l2QgEeoX15hL6OSRTPTP/results">/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/VXE8dVUiEyN1FY4zHSOV/l2QgEeoX15hL6OSRTPTP/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td><a href="https://data.mint.isi.edu/files/sharedResults/Cycles/barley.zip">https://data.mint.isi.edu/files/sharedResults/Cycles/barley.zip</a></td></tr>
                        <tr><td>Oromia region (1 point per Woreda)</td><td>2000-2017</td><td>Crop:<a href="https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop">https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop</a><br>Weather-Soil: <a href="/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia">/ethiopia/datasets/browse/ac34f01b-1484-4403-98ea-3a380838cab1/ethiopia</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia">/ethiopia/models/explore/CYCLES/cycles_v0.10.2_alpha/cycles-0.10.2-alpha-collection/cycles-0.10.2-alpha-collection-oromia</a></td><td>Start year: 2000; end year: 2017; crop:Teff; planting date: 181; end planting date: 232; fert rates: 0, 94, 187; weed fraction: 0.05, 0.25, 1</td><td><a href="/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/rryVw0PUyXJgOwdrnLui/GBw3gzZXqTvQK157q7dU/results">/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/rryVw0PUyXJgOwdrnLui/GBw3gzZXqTvQK157q7dU/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td><a href="https://data.mint.isi.edu/files/sharedResults/Cycles/teff.zip">https://data.mint.isi.edu/files/sharedResults/Cycles/teff.zip</a></td></tr>
                        <tr><td>Pongo (1 point)</td><td>2000-2017</td><td>Crops: <a href="https://data.mint.isi.edu/files/Cycles/crops-complete.crop">https://data.mint.isi.edu/files/Cycles/crops-complete.crop</a><br>Soil: <a href="https://publisher.mint.isi.edu/OIvRW/pongo.soil">https://publisher.mint.isi.edu/OIvRW/pongo.soil</a><br>Weather: <a href="https://publisher.mint.isi.edu/kkA2u/met9.12Nx27.62E.weather">https://publisher.mint.isi.edu/kkA2u/met9.12Nx27.62E.weather</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.9.4_alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather">/ethiopia/models/explore/CYCLES/cycles_v0.9.4_alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather</a></td><td>start year: 2000; end year: 2017; crop name: Maize, Sorghum, Peanut; start planting day: 100; end planting day: 149; fertilizer rate: 0, 500, 1000; weed fraction: 0.05, 0.5</td><td><a href="/south_sudan/modeling/scenario/y0JY1XOMZx1e5hfEtp7M/XcAT247pxe7DH6zGifoI/IrTNQlbT166jx4tsyXN8/results">/south_sudan/modeling/scenario/y0JY1XOMZx1e5hfEtp7M/XcAT247pxe7DH6zGifoI/IrTNQlbT166jx4tsyXN8/results</a></td><td></td><td>Completed</td><td>NO</td><td></td></tr>
                        <tr><td>Gambella (1 point)</td><td>2000-2017</td><td>Soil: <a href="https://raw.githubusercontent.com/pegasus-isi/pegasus-cycles/master/data/gambela.soil;">https://raw.githubusercontent.com/pegasus-isi/pegasus-cycles/master/data/gambela.soil;</a><br>crop: <a href="https://data.mint.isi.edu/files/Cycles/crops-complete.crop;">https://data.mint.isi.edu/files/Cycles/crops-complete.crop;</a><br>weather: <a href="https://raw.githubusercontent.com/pegasus-isi/pegasus-cycles/master/weather/met10.12Nx34.62E.weather">https://raw.githubusercontent.com/pegasus-isi/pegasus-cycles/master/weather/met10.12Nx34.62E.weather</a></td><td><a href="/ethiopia/models/explore/CYCLES/cycles_v0.9.4_alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-ethiopia-weather">/ethiopia/models/explore/CYCLES/cycles_v0.9.4_alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-ethiopia-weather</a></td><td>Start year: 2000; End year: 2017; crop:Maize, Sorghum; planting date: 100; end planting date: 149; fert. rates: 0,200,500,1000; weed fraction: 0.05;0.25;1</td><td><a href="/ethiopia/modeling/scenario/Zz357o1jmHEoVklKdozX/lgjAqxFAQEZwB6YlgWJ4/GKGqnM1km4y4OzWU12AX/results">/ethiopia/modeling/scenario/Zz357o1jmHEoVklKdozX/lgjAqxFAQEZwB6YlgWJ4/GKGqnM1km4y4OzWU12AX/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td></td></tr>
                        <tr><td>Oromia (1 point)</td><td>2000-2017</td><td>Crop:<a href="https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop">https://github.com/pegasus-isi/pegasus-cycles/raw/master/data/crops.crop</a><br>Weather-Soil: <a href="https://data.mint.isi.edu/files/cycles-input-data/oromia/weather-soil/Arsi_Amigna_7.884865046N_40.19527054E.zip">https://data.mint.isi.edu/files/cycles-input-data/oromia/weather-soil/Arsi_Amigna_7.884865046N_40.19527054E.zip</a></td><td><a href="https://w3id.org/okn/i/mint/cycles-0.10.2-alpha-collection-oromia-single-point">https://w3id.org/okn/i/mint/cycles-0.10.2-alpha-collection-oromia-single-point</a></td><td>Start year: 2000; end year: 2017; crop:Maize; planting date: 100, 107,114; end planting date: 149; fert rates: 0; weed fraction: 0.05</td><td><a href="/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/Rx22lqnlXwYLivm5OK3d/Vz3LTGVndvaDuODoHbVk/results">/ethiopia/modeling/scenario/B46nwKOrapiUoBP35Go0/Rx22lqnlXwYLivm5OK3d/Vz3LTGVndvaDuODoHbVk/results</a></td><td>NO</td><td>Completed</td><td>NO</td><td></td></tr>
                    </tbody>
                </table>
            </div>
            
            <div id="fsi_emulators" .style="display:${this._selectedModel=='fsi' ? '': 'none'}" class="emulators">
                <h2>FSI Emulators</h2>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <tr><th>Region</th><th>Time period</th><th>Input (data preparation has been completed)</th><th>Model setup has been tested (outside MINT)</th><th>Setup (the model setup available in MINT)</th><th>Ensemble description (range of parameters completed in the simulation)</th><th>Output summary (Ensemble)</th><th>Results reviewed by modeler</th><th>Status</th><th>Validated?</th><th>Comments</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Ethiopia</td><td>2008-2017</td><td><a href="https://data.mint.isi.edu/files/raw-data/GloFAS/flooding/GloFASv2.1_SS_ET_1981_2017.nc">https://data.mint.isi.edu/files/raw-data/GloFAS/flooding/GloFASv2.1_SS_ET_1981_2017.nc</a></td><td>Yes (locally)</td><td><a href="https://w3id.org/okn/i/mint/fsi_1.0_simple_et_ss">https://w3id.org/okn/i/mint/fsi_1.0_simple_et_ss</a></td><td>simulation year: 2008-2017</td><td><a href="/ethiopia/modeling/scenario/cFut6KW7huKmLMqTLGEw/rzkcVNqnSGWKMttVWjCM/cqaAmUmY55WsMr79Nrcl/results">/ethiopia/modeling/scenario/cFut6KW7huKmLMqTLGEw/rzkcVNqnSGWKMttVWjCM/cqaAmUmY55WsMr79Nrcl/results</a></td><td></td><td>Finished</td><td>NO (no need for calibration)</td><td>Years 2018 and 2019 ran separately (Daniel). All runs shared with Jataware, they are happy with MINT NetCDF format </td></tr>
                    </tbody>
                </table>
            </div>               
            `;
        }
        if(this._regionid == "south_sudan") {
            return html`
            <nav-title .nav="${nav}"></nav-title>
            <ul>
                <li>An example of the PIHM Model for the Pongo basin in South Sudan can be browsed by using
                    <a href="https://files.mint.isi.edu/s/oLw76x6chUNXOc0/download">this Notebook</a>
                    (Wolfram Mathematica CDF player is needed to visualize and change the results of the notebook)
                </li>

                <li>
                    Alternatively, you may browse <a href="https://files.mint.isi.edu/s/tmn7sRjjPh7BZvK/download">this PDF</a>
                    for a non-interactive version of the example.
                </li>
            </ul>
            `;
        }
    }

    /*
    protected firstUpdated() {
        db.collectionGroup('pathways')
            .where('last_update.parameters.time', '>', 0)
            .get().then((snapshot) => {
                snapshot.docs.map((doc) => {
                    let pathway = doc.data() as Pathway;
                    Object.values(pathway.executable_ensemble_summary).map((summary: ExecutableEnsembleSummary) => {
                        if(summary.total_runs == summary.successful_runs && summary.total_runs > 400) {
                            console.log(pathway.id);
                        }
                    })
                })
            })
    }
    */

    stateChanged(state: RootState) {
        super.setRegionId(state);

        if(state.emulators && state.emulators.selected_model) {
            this._selectedModel = state.emulators.selected_model;
        }
    }
}

