import { Goal, SubGoal, Pathway } from "../screens/modeling/reducers";
import { IdMap } from "../app/reducers";
import { Region } from "../screens/regions/reducers";

export const EXAMPLE_REGION_DATA = {
    "south_sudan": {
        "id": "south_sudan",
        "name": "South Sudan",
        "geojson": "http://mint-ui.org/server/common/geo/south_sudan"
    } as Region,
    "ethiopia": {
        "id": "ethiopia",
        "name": "Ethiopia",
        "geojson": "https://raw.githubusercontent.com/glynnbird/countriesgeojson/master/ethiopia.geojson"
    } as Region
};

export const EXAMPLE_SCENARIOS_LIST_DATA = {
    "scenarioids": [ "scenario1", "scenario2", "scenario3", "scenario4", "scenario5" ],
    "scenarios": {
        "scenario1": {
            "id": "scenario1",
            "name": "Check on Food Security in South Sudan",
            "regionid": "south_sudan",
            "dates": {
                "start_date": (new Date()).toDateString(),
                "end_date": (new Date()).toDateString(),
            }
        },
        "scenario2": {
            "id": "scenario2",
            "name": "Check up on Flooding issues in South Sudan",
            "regionid": "south_sudan",
            "dates": {
                "start_date": (new Date()).toDateString(),
                "end_date": (new Date()).toDateString(),
            }
        },
        "scenario3": {
            "id": "scenario3",
            "name": "Investigate the evolving refugee crisis in Ethipia",
            "regionid": "ethiopia",
            "dates": {
                "start_date": (new Date()).toDateString(),
                "end_date": (new Date()).toDateString(),
            }
        },
        "scenario4": {
            "id": "scenario4",
            "name": "Check up on Flooding issues in Ethiopia",
            "regionid": "ethiopia",
            "dates": {
                "start_date": (new Date()).toDateString(),
                "end_date": (new Date()).toDateString(),
            }
        },
        "scenario5": {
            "id": "scenario5",
            "name": "Check up on Flooding issues in Ethiopia",
            "regionid": "ethiopia",
            "dates": {
                "start_date": (new Date()).toDateString(),
                "end_date": (new Date()).toDateString(),
            }
        }
    }
}

export const EXAMPLE_SCENARIO_DETAILS = {
    "id": "scenario1",
    "name": "Check on Food Security in South Sudan",
    "regionid": "south_sudan",
    "dates": {
        "start_date": "2017-01-01",
        "end_date": "2018-01-01"
    },
    "goals": {
        "goal1": {
            "id": "goal1",
            "name": "Forecast crop production for lean season of 2017",
            "subgoalids": ["subgoal1", "subgoal2"]
        },
        "goal2": {
            "id": "goal2",
            "name": "Check for transportation blockages if there is increased rainfall",
            "subgoalids": ["subgoal3"]
        },
    } as IdMap<Goal>,
    "subgoals": {
        "subgoal1": {
            "id": "subgoal1",
            "name": "View historical precipitation data",
            "pathwayids": [ "pathway1" ]
        },
        "subgoal2": {
            "id": "subgoal2",
            "name": "Forecast crop production details",
            "pathwayids": [ "pathway2" ]
        },
        "subgoal3": {
            "id": "subgoal3",
            "name": "Check transportation map",
            "pathwayids": [ "pathway3" ]
        },
    } as IdMap<SubGoal>,
    "pathways": {
        "pathway1": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": [],
            "models": {},
            "datasets": {}
        },
        "pathway2": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": [],
            "models": {},
            "datasets": {}
        },
        "pathway3": {
            "id": "pathway1",
            "driving_variables": [],
            "response_variables": [],
            "models": {},
            "datasets": {}
        },
    } as IdMap<Pathway>
}
