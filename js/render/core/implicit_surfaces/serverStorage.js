export function ServerStorage() {
    let projectName = 'Clay';
    let serverLocation = 'http://localhost:5000/';
    let clearAllEndpoint = 'removeall?';
    let setItemEndpoint = 'setitem?';
    let getAllProjectNames = 'getall?';
    let getItemEndpoint = 'getitem?';

    let subprojectName = 'project 1';

    this.getFetch = (params, endPoint, httpRequestMethod, data) => {
        let query = Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');

        if (httpRequestMethod === 'GET') {
            return fetch(serverLocation + endPoint + query, {
                method: httpRequestMethod,
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        } else {
            return fetch(serverLocation + endPoint + query, {
                method: httpRequestMethod,
                mode: "cors",
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }
    }

    this.clearAll = async () => {

        let params = {
            "pname": projectName
        };

        return this.getFetch(params, clearAllEndpoint, 'GET', "").then(response => {

        }).catch(onerror => {
            console.log("Error getting all project names" + onerror)
        })
    }

    this.setProjectName = (m_subProjectName) => {
        subprojectName = m_subProjectName;
    }

    this.getProjectName = () => {
        return subprojectName;
    }

    this.getAllProjectNames = async () => {

        let params = {
            "pname": projectName
        };

        return this.getFetch(params, getAllProjectNames, 'GET', "")
            .then(response => response.text())
            .catch(onerror => {
                console.log("Error getting all project names" + onerror)
            });
    }

    this.setItem = async (subprojectName, data) => {
        let params = {
            "pname": projectName,
            "subpname": subprojectName
        };

        return this.getFetch(params, setItemEndpoint, 'POST', data).then(response => {

        }).catch(onerror => {
            console.log("Error setting item" + onerror)
        });
    }

    this.getItem = async (subprojectName) => {

        let params = {
            "pname": projectName,
            "subpname": subprojectName
        };

        return this.getFetch(params, getItemEndpoint, 'GET', "")
            .then(response => response.text())
            .catch(onerror => {
                console.log("Error getting item " + onerror)
            });
    }
}
