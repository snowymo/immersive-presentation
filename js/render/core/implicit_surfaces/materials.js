export let materials = {};
materials['black' ] = { ambient: [.0 ,.0 ,.0 ], diffuse: [0  ,0  ,0  ], specular: [.9,.9,.9,10] };
materials['blue'  ] = { ambient: [.0 ,.0 ,.2 ], diffuse: [0  ,0  ,1  ], specular: [.9,.9,.9,10] };
materials['brass' ] = { ambient: [.03,.02,.01], diffuse: [.03,.02,.01], specular: [.9,.6,.3,10] };
materials['cyan'  ] = { ambient: [.0 ,.15,.15], diffuse: [0  ,.07,.07], specular: [.0,.7,.7,10] };
materials['green' ] = { ambient: [.0 ,.2 ,.0 ], diffuse: [0  ,1  ,0  ], specular: [.9,.9,.9,10] };
materials['red'   ] = { ambient: [.2 ,.0 ,.0 ], diffuse: [1  ,0  ,0  ], specular: [.9,.9,.9,10] };
materials['white' ] = { ambient: [.2 ,.2 ,.2 ], diffuse: [1  ,1  ,1  ], specular: [.9,.9,.9,10] };
materials['yellow'] = { ambient: [.2 ,.2 ,.0 ], diffuse: [1  ,1  ,0  ], specular: [.9,.9,.9,10] };

 // BUILD THE PALETTE OF COLORS
    
 let colors = [
    [1,1,1],     // white
    [1,0,0],     // red
    [1,.2,0],    // orange
    [1,1,0],     // yellow
    [0,1,0],     // green
    [0,1,1],     // cyan
    [.2,.2,1],   // blue
    [1,0,1],     // violet
    [.3,.1,.05], // brown
    [0,0,0],     // black
 ];
 
 for (let n = 0 ; n < 10 ; n++) {
    let r = colors[n][0], g = colors[n][1], b = colors[n][2];   
    for (let l = 0 ; l < 2 ; l++) {
       if (l) {
          r = .5 + .5 * r;
          g = .5 + .5 * g;
          b = .5 + .5 * b;
       }
       materials['color' + n + (l ? 'l' : '')] = {
          ambient : [.2*r,.2*g,.2*b],
          diffuse : [Math.max(.01,.8*r),
                     Math.max(.01,.8*g),
                     Math.max(.01,.8*b)],
          specular: [.1,.1,.1,2]
       };
    };
 }
