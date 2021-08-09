
import { ServerStorage } from "./serverStorage.js";

export function ProjectManager() {
    let projectName = 'project 1';
    let serverStorage = new ServerStorage();
 
    this.clearNames = () => {
       localStorage.setItem('projectNames', '');
    }
 
    this.choice = onLoad => {
 
       // LOAD THE LIST OF ALL PROJECT NAMES
 
       let projectNames = localStorage.getItem('projectNames');
       if (! projectNames)
          projectNames = '';
 
       // PROMPT USER TO SPECIFY A PROJECT NAME
 
       let names = projectNames.split('\n');
       let promptStr = 'ENTER PROJECT NAME';
       for (let i = 0 ; i < names.length ; i++)
          promptStr += '\n  ' + names[i];
       projectName = prompt(promptStr, projectName).trim();
 
       // LOAD THE PROJECT
 
       localStorage.setItem('projectName', projectName);
       this.load(onLoad);
 
       // IF PROJECT NAME IS NOT ALREADY ON THE LIST, ADD IT
 
       for (let i = 0 ; i < names.length ; i++)
          if (projectName === names[i])
         return;
       names.push(projectName);
       let nameList = names.join('\n');
       localStorage.setItem('projectNames', nameList);
    }

    let strPrev = '';
 
    this.load = async onLoad => {
/*
       projectName = localStorage.getItem('projectName');
       if (! projectName) {
          projectName = 'project 1';
          localStorage.setItem('projectName', projectName);
       }
 
       function readTextFile(file, callback) {
         var rawFile = new XMLHttpRequest();
         rawFile.overrideMimeType("application/json");
         rawFile.open("GET", file, true);
         rawFile.onreadystatechange = function() {
             if (rawFile.readyState === 4 && rawFile.status == "200") {
                 callback(rawFile.responseText);
             }
         }
         rawFile.send(null);
     }
*/
/*
     readTextFile("js/data/clayData.json", function(text){
         var data = JSON.parse(text);
         if (data) {
            onLoad(data);
          }
     });
*/
     let str = await serverStorage.getItem(projectName);
     if (str && str.localeCompare(strPrev)) {
        onLoad(str);
        strPrev = str;
     }

      //  let str = localStorage.getItem(projectName);
      //  if (str) {
      //    onLoad(str);
      //  }
    }
 
    this.save = S => {
       localStorage.setItem(projectName, JSON.stringify(S));
       console.log(localStorage.getItem(projectName))
    }
 }
 
 
