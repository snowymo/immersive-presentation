"use strict"

let catmullRomMatrix = [ -.5,1,-.5,0, 1.5,-2.5,0,1, -1.5,2,.5,0, .5,-.5,0,0 ];

let evalCatmullRomSpline = (t, K) => {
   t = Math.max(0, Math.min(t, .9999));
   let n = K.length - 1,
       i = Math.floor(n * t),
       f = (n * t) % 1,
       A = K[Math.max(0, i-1)],
       B = K[i],
       C = K[i+1],
       D = K[Math.min(n, i+2)],
       c = matrixTransform(catmullRomMatrix, [A,B,C,D]);
   return c[0] * f*f*f + c[1] * f*f + c[2] * f + c[3];
}

let matrixTransform = (M,V) => {
   return [
      M[0] * V[0] + M[4] * V[1] + M[ 8] * V[2] + M[12] * V[3],
      M[1] * V[0] + M[5] * V[1] + M[ 9] * V[2] + M[13] * V[3],
      M[2] * V[0] + M[6] * V[1] + M[10] * V[2] + M[14] * V[3],
      M[3] * V[0] + M[7] * V[1] + M[11] * V[2] + M[15] * V[3]
   ];
}

export let airfont = {
   _charName: ch => {
      switch (ch) {
      case '!' : ch = 'exclamation_point' ; break;
      case '"' : ch = 'double_quote'      ; break;
      case '#' : ch = 'pound_sign'        ; break;
      case '$' : ch = 'dollar_sign'       ; break;
      case '%' : ch = 'percent_sign'      ; break;
      case '&' : ch = 'ampersand'         ; break;
      case "'" : ch = 'single_quote'      ; break;
      case '(' : ch = 'left_parenthesis'  ; break;
      case ')' : ch = 'right_parenthesis' ; break;
      case '*' : ch = 'asterisk'          ; break;
      case '+' : ch = 'plus'              ; break;
      case ',' : ch = 'comma'             ; break;
      case '-' : ch = 'minus'             ; break;
      case '.' : ch = 'period'            ; break;
      case '/' : ch = 'slash'             ; break;
      case '0' : ch = 'zero'              ; break;
      case '1' : ch = 'one'               ; break;
      case '2' : ch = 'two'               ; break;
      case '3' : ch = 'three'             ; break;
      case '4' : ch = 'four'              ; break;
      case '5' : ch = 'five'              ; break;
      case '6' : ch = 'six'               ; break;
      case '7' : ch = 'seven'             ; break;
      case '8' : ch = 'eight'             ; break;
      case '9' : ch = 'nine'              ; break;
      case ':' : ch = 'colon'             ; break;
      case ';' : ch = 'semicolon'         ; break;
      case '<' : ch = 'less_than'         ; break;
      case '=' : ch = 'equals'            ; break;
      case '>' : ch = 'greater_than'      ; break;
      case '?' : ch = 'question_mark'     ; break;
      case '@' : ch = 'at_sign'           ; break;
      case '[' : ch = 'left_bracket'      ; break;
      case '\\': ch = 'backslash'         ; break;
      case ']' : ch = 'right_bracket'     ; break;
      case '^' : ch = 'hat'               ; break;
      case '_' : ch = 'underscore'        ; break;
      case '`' : ch = 'backquote'         ; break;
      case '{' : ch = 'left_brace'        ; break;
      case '|' : ch = 'vertical_bar'      ; break;
      case '}' : ch = 'right_brace'       ; break;
      case '~' : ch = 'tilde'             ; break;
      }
      return ch;
   },
   _evalStroke: (f,sx,sy) => {
      let x = evalCatmullRomSpline(f, sx);
      let y = evalCatmullRomSpline(f, sy);
      return [x,y];
   },
   strokeLength: ch => {
      let len = airfont._totalStrokeLength[airfont._charName(ch)];
      return len === undefined ? 0 : len;
   },
   eval: (t, ch) => {
      ch = airfont._charName(ch);
      let S = airfont[ch];
      if (S === undefined)
         return [-1000,-1000];

      let lengths = airfont._strokeLengths[ch];
      let T = t * airfont._totalStrokeLength[ch];
      let sum = 0, i;
      for (i = 0 ; i < S.length / 2 ; i++) {
         sum += lengths[i];
	 if (T < sum)
	    break;
      }
      let f = (T - (sum - lengths[i])) / lengths[i];

      return airfont._evalStroke(f, S[2*i], S[2*i+1]);
   },
   heart: [
         [-.2,-.6,-.2,-.2,.2,-.2], [.1,.3,-.1,-.4,-.5,-.4,-.1,.3,.1],
      ],
   exclamation_point: [
         [0,-.1,-.13], [-.2,.4],
         [.05,.07], [-.48,-.5],
      ],
   double_quote: [
         [-.1,-.15], [.2,.5],
         [.15,.1], [.2,.5],
      ],
   pound_sign: [
         [-.1,-.2], [-.4,.3],
         [.2,.1], [-.4,.3],
         [-.3,.25], [.1,.1],
         [-.25,.3], [-.2,-.2],
      ],
   dollar_sign: [
         [ .12,-.27, .17,-.27], [.15,.2,0,-.1,-.3,-.25],
         [-.1,-.2], [-.4,.3],
         [.1,0], [-.4,.3],
      ],
   percent_sign: [
         [-.25,-.15,-.25,-.35,-.25], [ .3, .25,.1,.05,.1, .25, .3],
         [.05,.15,.05,-.05,.05], [-.2,-.25,-.4,-.45,-.4,-.25,-.2],
	 [-.3,.1],[-.4,.2],
      ],
   ampersand: [
	 [0,-.3,.1],[.5,.35,-.5],
         [0,-.3,0,.1], [.5,-.45,0],
      ],
   single_quote: [
	 [0,0],[.2,.5],
      ],
   left_parenthesis: [
         [.15,-.07,-.12,0],[-.5,.5],
      ],
   right_parenthesis: [
         [-.15,.07,.12,0],[.5,-.5],
      ],
   asterisk: [
         [-.2,.2],[0,0],
         [-.1,.1],[.2,-.2],
         [.1,-.1],[.2,-.2],
      ],
   plus: [
         [-.2,.2],[0,0],
         [-.025,.025],[.2,-.2],
      ],
   comma: [
         [0,0,-.1], [-.4,-.7],
      ],
   minus: [
         [-.2,.2],[0,0],
      ],
   period: [
         [0,.02], [-.48,-.5],
      ],
   slash: [
         [.15,-.15], [.5,-.5],
      ],
   zero: [
         [-.2,.2,.1,-.2,-.1], [.5,.4,-.35,-.5,-.35,.4,.5],
      ],
   one: [
         [0,-.1,-.13], [-.5,.5],
         [-.13,-.33], [.5,.3],
      ],
   two: [
         [-.3,.15,-.1,-.4], [-.5,0,.4,.5,.5],
         [-.3,.3],[-.5,-.5],
      ],
   three: [
         [-.15,.15,-.1,-.4], [0,.1,.4,.5,.5],
         [-.2,.25,0,-.15], [-.5,-.45,-.1,0,0],
      ],
   four: [
         [.13,.2], [.5,-.5],
         [-.3,-.25], [.5,0],
         [-.25,.3], [0,0],
      ],
   five: [
         [-.25,.2], [.5,.5],
         [-.25,-.2], [.5,0],
         [-.2,.25,0,-.15], [-.5,-.45,-.1,0,0],
      ],
   six: [
         [-.2,.3,.1,-.2,.2], [0,0,-.35,-.5,-.35,.4,.5],
      ],
   seven: [
         [-.25,.2], [.5,.5],
         [.2,-.1], [.5,-.5],
      ],
   eight: [
         [-.1,.1,-.1,-.3,-.1], [0,.1,.4,.5,.4,.1,0],
         [-.05,.2,-.05,-.3,-.05], [0,-.1,-.4,-.5,-.4,-.1,0],
      ],
   nine: [
         [.2,-.3,-.1,.2,-.2], [0,0,.35,.5,.35,-.4,-.5],
      ],
   colon: [
         [.03,.05], [-.02,0],
         [.05,.07], [-.48,-.5],
      ],
   semicolon: [
         [0,.02], [-.02,0],
         [.03,.03,-.07], [-.4,-.7],
      ],
   less_than: [
         [-.2,.17], [0,.3],
         [-.2,.23], [0,-.3],
      ],
   equals: [
         [-.25,.2], [.15,.15],
         [-.2,.25], [-.15,-.15],
      ],
   greater_than: [
         [.2,-.23], [0,.3],
         [.2,-.17], [0,-.3],
      ],
   question_mark: [
         [0,0,.3,.1,-.1,-.3], [-.2,.1,.45,.5,.4],
         [.05,.07], [-.48,-.5],
      ],
   at_sign: [
         [.2,.1,-.25,-.15,.25], [0,.25,.25,-.2,-.4,-.25],
         [0,.2,0,-.1,0], [.1,0,-.1,-.2,-.1,0,.1],
      ],
   A: [
         [-.2,-.1], [-.5,.5],
         [.2,-.1], [-.5,.5],
         [-.1,.1], [-.2,-.2],
      ],
   B: [
         [-.1,.25,0,-.2], [-.5,-.45,-.1,0,0],
         [-.2,.15,-.1,-.3], [0,.1,.4,.5,.5],
         [-.25,-.15], [.5,-.5],
      ],
   C: [
         [.15,-.2,0,.25], [.45,.45,-.3,-.5,-.4],
      ],
   D: [
         [-.1,.2,-.05,-.25], [-.5,-.4,.3,.48,.5],
         [-.3,-.15], [.5,-.5],
      ],
   E: [
         [-.15,-.21,-.28], [-.5,.5],
         [-.15,.25], [-.5,-.5],
         [-.21,.1], [0,0],
         [-.28,.15], [.5,.5],
      ],
   F: [
         [-.15,-.21,-.28], [-.5,.5],
         [-.21,.1], [0,0],
         [-.28,.15], [.5,.5],
      ],
   G: [
         [.15,-.3,-.15,.15,.2], [.45,.45,-.3,-.5,-.4,0],
         [0,.15], [0,0],
      ],
   H: [
         [-.25,-.25,-.3], [-.5,.5],
	 [-.25,.1], [0,0],
         [.2,.1,.05], [-.5,.5],
      ],
   I: [
         [0,-.06,-.1], [-.5,.5],
         [-.15,.15], [-.5,-.5],
         [-.25,.05], [.5,.5],
      ],
   J: [
         [-.25,.15], [.5,.5],
         [-.05,.05,-.1,-.2,-.25], [.5,-.4,-.5,-.4],
      ],
   K: [
         [-.2,-.2,-.3], [-.5,.5],
         [.1,-.1], [.5,-.1],
         [-.03,.1,.25], [0,-.5],
      ],
   L: [
         [-.1,-.16,-.23], [-.5,.5],
         [-.1,.25], [-.5,-.5],
      ],
   M: [
         [-.2,-.25,-.35], [-.5,.5],
         [-.35,-.15,0], [.5,0],
         [0,.09,.15], [0,.5],
         [.3,.25,.15], [-.5,.5],
      ],
   N: [
         [-.15,-.15,-.25], [-.5,.5],
	 [.25,.05,-.25],[-.5,.5],
         [.25,.21,.15], [-.5,.5],
      ],
   O: [
         [-.2,.2,0,-.3,-.2], [.5,.4,-.35,-.5,-.35,.4,.5],
      ],
   P: [
         [-.2,.2,0,-.3], [0,.1,.4,.5,.5],
         [-.25,-.15], [.5,-.5],
      ],
   Q: [
         [-.2,.15,-.1,-.3,-.2], [.5,.4,-.4,-.5,-.35,.4,.5],
	 [-.1,.2],[-.1,-.5],
      ],
   R: [
         [-.2,.1,-.1,-.3], [0,.1,.4,.5,.5],
         [-.25,-.15], [.5,-.5],
	 [0,.2],[0,-.5],
      ],
   S: [
         [ .12,-.27, .23,-.22], [.4,.5,.1,-.1,-.5,-.4],
      ],
   T: [
         [.05,-.01,-.08], [-.5,.5],
         [-.33,.17], [.5,.5],
      ],
   U: [
         [-.3,-.2,.15,.1], [.5,0,-.45,-.45,0,.5],
      ],
   V: [
         [-.27,.05], [.5,-.5],
         [.05,.18], [-.5,.5],
      ],
   W: [
         [-.27,-.14], [.5,-.5],
         [-.14,-.03], [-.5,.5],
         [-.03,.13], [.5,-.5],
         [.13,.22], [-.5,.5],
      ],
   X: [
         [-.3,0,.2], [.5,-.5],
         [ .05,-.05,-.2], [.5,-.5],
      ],
   Y: [
         [-.37,-.1], [.5,0],
         [-.1,.08], [0,.5],
         [-.1,-.03], [0,-.5],
      ],
   Z: [
         [-.3,.05], [.5,.5],
         [.05,-.1,-.2], [.5,-.5],
         [-.2,.15], [-.5,-.5],
      ],
   left_bracket: [
         [-.15,-.21,-.25], [-.5,.5],
         [-.15,.15], [-.5,-.5],
         [-.25,.05], [.5,.5],
      ],
   backslash: [
         [-.2,.2], [.5,-.5],
      ],
   right_bracket: [
         [.15,.09,.05], [-.5,.5],
         [-.15,.15], [-.5,-.5],
         [-.25,.05], [.5,.5],
      ],
   hat: [
         [-.35,-.1],[.25,.5],
         [.2,-.1],[.25,.5],
      ],
   underscore: [
         [-.3,.3],[-.5,-.5],
      ],
   backquote: [
         [-.1,.05], [.5,.2],
      ],
   a: [
         [.1,.13,.2], [0,-.5],
         [.1,-.2,-.1,.2], [0,-.1,-.4,-.5,-.4],
      ],
   b: [
         [-.15,-.2,-.28], [-.5,.5],
         [-.15,.2,.1,-.2], [-.5,-.4,-.1,.05,-.05],
      ],
   c: [
         [.1,-.3,-.1,.2], [0,0,-.4,-.5,-.4],
      ],
   d: [
         [.1,.12,.2], [.5,-.5],
         [.1,-.3,-.1,.2], [0,-.1,-.4,-.5,-.4],
      ],
   e: [
         [-.2,.1,-.2,-.15,.2], [-.3,-.2,0,-.3,-.5,-.45],
      ],
   f: [
         [0,-.01,-.03,-.05,.15], [-.5,.4],
         [-.15,.1], [0,0],
      ],
   g: [
         [.1,-.2,-.1,.2], [0,-.1,-.4,-.5,-.4],
         [ .1, .15,-.1,-.2], [0,-.8,-.8],
      ],
   h: [
         [-.25,-.17,-.15], [.4,-.5],
         [-.2 , .05, .15], [-.1,0,-.5,],
      ],
   i: [
         [.05,-.05,-.08], [-.5,0],
         [-.08,-.07], [.28,.3],
      ],
   j: [
         [ .1, .15,-.1,-.2], [0,-.8,-.8],
         [.05,.05], [.28,.3],
      ],
   k: [
         [-.15,-.2,-.28], [-.5,.5],
         [-.15,.1], [-.25,0],
         [-.15,.2], [-.25,-.5],
      ],
   l: [
         [0,-.1,-.13], [-.5,.4],
      ],
   m: [
         [-.25,-.2 ,-.18], [0,-.5],
         [-.23,-.05, .05], [-.1,0,-.5],
         [-.02, .18, .28], [-.1,0,-.5],
      ],
   n: [
         [-.25,-.17,-.15], [0,-.5],
         [-.2 , .05, .15], [-.1,0,-.5,],
      ],
   o: [
         [0,.2,0,-.2,0], [0,-.1,-.4,-.5,-.4,-.1,0],
      ],
   p: [
         [-.1,-.15,-.23], [-1,0],
         [-.15,.2,.1,-.2], [-.5,-.4,-.1,.05,-.05],
      ],
   q: [
         [.3,.23,.2], [-1,0],
         [.3,.4], [-1,-.9],
         [.2,-.2,0,.22], [0,-.1,-.4,-.5,-.4],
      ],
   r: [
         [-.2 ,-.1,-.1], [0,-.5],
         [-.15, .2], [-.1,0,-.1,],
      ],
   s: [
         [ .12,-.27, .17,-.27], [-.05,0,-.2,-.3,-.5,-.45],
      ],
   t: [
         [0,-.06,-.08,-.08], [-.5,.2],
         [-.2,.05], [0,0],
      ],
   u: [
         [-.2,-.1 , .2, .2], [0,-.45,-.45,0],
         [ .2,.25], [0,-.5],
      ],
   v: [
         [-.22,0], [0,-.5],
         [0,.18], [-.5,0],
      ],
   w: [
         [-.22,-.09], [0,-.5],
         [-.09,0], [-.5,0],
         [0,.13], [0,-.5],
         [.13,.22], [-.5,0],
      ],
   x: [
         [-.22,.18], [0,-.5],
         [-.18,.1], [-.5,0],
      ],
   y: [
         [-.3,-.2 , .1, .1], [0,-.45,-.45,0],
         [ .1, .15,-.1,-.2], [0,-.8,-.8],
      ],
   z: [
         [-.22,.1], [0,0],
         [.1,-.18], [0,-.5],
         [-.18,.18], [-.5,-.5],
      ],
   left_brace: [
         [-.15,0,0,.1],[-.05,.5],
         [-.15,.02,.05,.2],[-.05,-.5],
      ],
   vertical_bar: [
         [.05,-.05],[-.5,.5],
      ],
   right_brace: [
         [.15,0,-.05,-.25],[.05,.5],
	 [.15,.01,.02,-.1],[.05,-.5],
      ],
   tilde: [
         [-.3,.3],[-.07,.07,-.07,.07],
      ],
};

{
   let computeStrokeLength = (sx, sy) => {
      let L = 0, A = airfont._evalStroke(0, sx, sy), B;
      for (let t = .1 ; t < 1.001 ; t += .1) {
         B = airfont._evalStroke(t, sx, sy);
	 let x = B[0] - A[0], y = B[1] - A[1];
	 L += Math.sqrt(x * x + y * y);
	 A = B;
      }
      return L;
   }
   airfont._strokeLengths = {};
   airfont._totalStrokeLength = {};
   for (let ch in airfont) {
      if (Array.isArray(airfont[ch])) {
         let strokes = airfont[ch];

         airfont._strokeLengths[ch] = [];
	 for (let i = 0 ; i < strokes.length ; i += 2)
            airfont._strokeLengths[ch].push(
	       computeStrokeLength(strokes[i], strokes[i+1]));

         airfont._totalStrokeLength[ch] = 0;
	 for (let i = 0 ; i < airfont._strokeLengths[ch].length ; i++)
            airfont._totalStrokeLength[ch] += airfont._strokeLengths[ch][i];
         
      }
   }
}


