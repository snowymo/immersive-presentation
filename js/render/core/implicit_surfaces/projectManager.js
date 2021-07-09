
export function ProjectManager() {
    let projectName = 'project 1';
 
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
 
    this.load = onLoad => {
       projectName = localStorage.getItem('projectName');
       if (! projectName) {
          projectName = 'project 1';
          localStorage.setItem('projectName', projectName);
       }
 
       let str = localStorage.getItem(projectName);
       if (str)
          onLoad(JSON.parse(str));
    }
 
    this.save = S => {
       localStorage.setItem(projectName, JSON.stringify(S));
    }
 }
 
 