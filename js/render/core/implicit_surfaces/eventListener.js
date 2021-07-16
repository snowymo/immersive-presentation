export let addEventListenersToCanvas = function(canvas) {
    let r = canvas.getBoundingClientRect();
    let toX = x => (2 * x - r.left - r.right) / canvas.height,
        toY = y => 1 - 2 * (y - r.top) / canvas.height;
   // let toX = x => (2 * x - r.left - r.right) / canvas.height,
   // toY = y => 2 - (y - r.top) / canvas.height;

      if (! canvas.onDrag      ) canvas.onDrag       = (x, y) => { };
      if (! canvas.onMove      ) canvas.onMove       = (x, y) => { };
      if (! canvas.onPress     ) canvas.onPress      = (x, y) => { };
      if (! canvas.onRelease   ) canvas.onRelease    = (x, y) => { };
      if (! canvas.onKeyPress  ) canvas.onKeyPress   = key => { };
      if (! canvas.onKeyRelease) canvas.onKeyRelease = key => { };
 
    canvas.addEventListener('mousemove', function(e) {
       this._response = this._isDown ? this.onDrag : this.onMove;
       this._response(toX(e.clientX), toY(e.clientY));
    });
 
    canvas.addEventListener('mousedown', function(e) {
       this.onPress(toX(e.clientX), toY(e.clientY));
       this._isDown = true ;
    });
 
    canvas.addEventListener('mouseup'  , function(e) {
       this.onRelease(toX(e.clientX), toY(e.clientY));
       this._isDown = false;
    });
 
    window.addEventListener('keydown', function(e) {
       switch (e.keyCode) {
       case   8: // DELETE
       case  32: // SPACE
       case  33: // PAGE UP
       case  34: // PAGE DOWN
       case  37: // LEFT ARROW
       case  38: // UP ARROW
       case  39: // RIGHT ARROW
       case  40: // DOWN ARROW
       case 191: // /
       case 222: // '
          e.preventDefault();
       }
       canvas.onKeyPress(e.keyCode);
    }, true);
 
    window.addEventListener('keyup', function(e) {
       canvas.onKeyRelease(e.keyCode);
    }, true);
 }