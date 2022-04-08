/*  
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"conf": {"email": "mosorio@inf.utfsm.cl", "thread_id": "xvbhipEWW5FMSRoAkaBd",  "graphql_endpoint": "https://graphql.dev.mint.isi.edu/v1/graphql"}}' \
  -H "Authorization: Token ${TOKEN}" https://airflow.mint.isi.edu/api/v1/dags/download_thread_dev_v3/dagRuns
*/

import * as mintConfig from 'config/config.json';
import { MintPreferences } from 'app/reducers';

let prefs = mintConfig["default"] as MintPreferences;

interface AirflowResultsConfiguration {
    email: string,
    thread_id: string,
    graphql_endpoint: string,
    subtask_url: string,
    problem_statement_name: string,
    subtask_name: string
}

interface AirflowConfiguration {
    conf: AirflowResultsConfiguration
};



export class AirflowAdapter {
    private static server: string = "https://airflow.mint.isi.edu/api/v1/";
    private static _accessToken: string;

    public static setAccessToken(token: string) {
        AirflowAdapter.saveAccessToken(token);
    }

    private static saveAccessToken(token: string) {
        localStorage.setItem('accessToken', token);
        AirflowAdapter._accessToken = token;
    }

    private static getAccessToken(): string {
        if (AirflowAdapter._accessToken) return AirflowAdapter._accessToken;
        let localToken: string = this.getLocalAccessToken();
        if (localToken) {
            AirflowAdapter._accessToken = localToken;
            return localToken;
        }
        throw new Error('Could not get access token');
    }

    private static getLocalAccessToken(): string {
        let accessToken = localStorage.getItem('access-token');
        if (accessToken) return accessToken;
        console.info('No access token on local storage');
        return '';
    }

    public static sendResultsToEmail(email: string, threadId: string, subtask_url: string, problem_statement_name: string, subtask_name: string): Promise<void> {
        let conf: AirflowConfiguration = {
            conf: {
                email: email,
                thread_id: threadId,
                graphql_endpoint: prefs.graphql.endpoint,
                subtask_url: subtask_url,
                problem_statement_name: problem_statement_name,
                subtask_name: subtask_name
            }
        }
        return new Promise<void>((resolve, reject) => {
            let req: Promise<Response> = fetch(AirflowAdapter.server + "dags/download_thread_dev_v3/dagRuns", {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': "Token " + AirflowAdapter.getAccessToken(),
                },
                body: JSON.stringify(conf)
            });
            req.catch(reject);
            req.then((response: Response) => {
                if (response.status === 200) {
                    let jsn = response.json();
                    jsn.catch(reject);
                    jsn.then((tkn) => {
                        console.log("Response from airflow", tkn);
                        resolve();
                    })
                } else {
                    reject(response.statusText);
                }
            });
        })
    }
}
