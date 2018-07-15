// -----------------------------------------------------------------------------
// ============================== ACTIONS ======================================
// -----------------------------------------------------------------------------

var utils = require('./utility');
var model = require('./model');
var render = require('./render');

var mouse;
// var sX, sY, eX, eY;
var line = {
  sX: 0,
  sY: 0,
  eX: 0,
  eY: 0
}
var downX, downY, upX, upY;
let clicked = false;
let snapped = false;
let withinSnap = {};
let dragging = false;

// Some parameters for settings
const STROKE_WIDTH = 1;
const SNAP_DIST = 10;

function goUp() {
  actions.act.up = model.s;
};

function goDown() {
  actions.act.up = -model.s;
};

function goLeft() {
  actions.act.right = -model.s;
};

function goRight() {
  actions.act.right = model.s;
};

function initiateDrag(e) {
  sX = e.changedTouches[0].pageX;
  sY = e.changedTouches[0].pageY;
  if(sX > 500 && sX < 600 && sY > 450 && sY < 550) {
    pointing = true;
    eX = sX;
    eY = sY;
    sX = 550;
    sY = 500;
  }
};

function endDrag(e) {
  pointing = false;
  actions.act.up = 0;
  actions.act.right = 0;
};

function drag(e) {
  if(pointing) {
    eX = e.changedTouches[0].pageX;
    eY = e.changedTouches[0].pageY;
    let vec = utils.unit(sX, sY, eX, eY);
    actions.act.up = -(vec.y * model.s);
    actions.act.right = vec.x * model.s;
  }
};

// Logout function
function logout() {
  $.ajax({
      type: 'POST',
      url: '/users/logout',
      dataType: 'JSON'
  }).done(function( response ) {
      location.reload();
  });
}

function goUp() {
  act.up = s;
};

function goDown() {
  act.up = -s;
};

function goLeft() {
  act.right = -s;
};

function goRight() {
  act.right = s;
};

function snap(x, y) {
  model.POINTS.forEach( (elem) => {
    if(utils.dist(x, y, elem.x, elem.y) < SNAP_DIST) {
      if(actions.drawing) {
        line.eX = elem.x;
        line.eY = elem.y;
      }
      else {
        line.sX = elem.x;
        line.sY = elem.y;
        snapped = true;
      }
    }
  });
}

function inSnap(x, y) {
  let aSnap = {s: false};
  model.POINTS.forEach( (elem) => {
    if(utils.dist(x, y, elem.x, elem.y) < SNAP_DIST) {
      aSnap = {s: true, x: elem.x, y: elem.y};
    }
  });
  return aSnap;
}

function startLine() {
  line.sX = render.pos.x + downX;
  line.sY = render.pos.y + downY;
  line.eX = render.pos.x + downX;
  line.eY = render.pos.y + downY;
  snap(downX, downY);
  let element = {
    id: 'currentLine',
    x1: line.sX,
    y1: line.sY,
    x2: line.eX,
    y2: line.eY,
    t: 'line',
    style: 'stroke:rgb(0,0,0);stroke-width:' + STROKE_WIDTH
  };
  render.addItem(element);
  actions.drawing = true;
};

function endLine() {
  snapped = false;
  line.eX = render.pos.x + upX;
  line.eY = render.pos.y + upY;
  snap(upX, upY);
  // Delete intermetiate
  render.removeItem('currentLine');
  // push line here
  let element = {
    x1: line.sX,
    y1: line.sY,
    x2: line.eX,
    y2: line.eY,
    t: 'line',
    style: 'stroke:rgb(0,0,0);stroke-width:' + STROKE_WIDTH
  };
  let pointA = {
    x: line.sX,
    y: line.sY
  }
  let pointB = {
    x: line.eX,
    y: line.eY
  }

  model.ELEM.push(element);
  model.POINTS.push(pointA);
  model.POINTS.push(pointB);
  render.addItem(element);
};

// Export functions
var actions = {

  assignListeners: function(c) {
    render.setCtx(c);
    // document.getElementById("save").addEventListener("click", saveMap);
    document.getElementById("logout").addEventListener("click", logout);
    c.addEventListener('mousedown', (event) => {
      // if right click
      if(dragging) {
        console.log("drag start");
      }
      else {
        downX = event.offsetX;
        downY = event.offsetY;
        if(actions.drawingType == 1) {
          if(!clicked) {
            startLine();
          }
        }
      }
    });
    c.addEventListener('mouseup', (event) => {
      // if right click
      if(dragging) {
        console.log("drag end");
      }
      else {
        upX = event.offsetX;
        upY = event.offsetY;
        if(actions.drawingType == 1) {
          if(actions.drawing && (upX != downX || upY != downY) || clicked ) {
            endLine();
          }
          if(upX != downX || upY != downY || clicked) {
            actions.drawing = false;
            clicked = false;
          }
          else {
            clicked = true;
          }
        }
      }
    });
    c.addEventListener('mousewheel', (event) => {
      console.log(event.deltaY);
    });
    c.addEventListener('touchstart', (event) => {
      initiateDrag(event);
    });
    c.addEventListener('touchend', (event) => {
      endDrag(event);
    });
    c.addEventListener('touchmove', (event) => {
      drag(event);
    });
    c.addEventListener('mousemove', (event) => {
      mouse = event;
      if(actions.drawingType == 1) {
        if(actions.drawing) {
          let element = {
            x2: mouse.offsetX,
            y2: mouse.offsetY
          };
          render.adjust("currentLine", element);
        }
        let aSnap = inSnap(mouse.offsetX, mouse.offsetY);
        if(aSnap.s) {
          document.getElementById('snapCircle').style.visibility = 'visible';
          render.adjust('snapCircle', {cx: aSnap.x, cy: aSnap.y});
        }
        else {
          document.getElementById('snapCircle').style.visibility = 'hidden';
        }
      }
    });
    document.addEventListener('keydown', (event) => {
      const keyName = event.key;
      if(keyName == "w") {
        goUp();
      }
      if(keyName == "s") {
        goDown();
      }
      if(keyName == "d") {
        goRight();
      }
      if(keyName == "a") {
        goLeft();
      }
      if(keyName == "q") {
        actions.drawingType = 0;
        clicked = false;
        snapped = false;
        actions.drawing = false;
        document.getElementById('curAction').innerHTML = 'none';
      }
      if(keyName == "l") {
        actions.drawingType = 1;
        clicked = false;
        snapped = false;
        actions.drawing = false;
        document.getElementById('curAction').innerHTML = 'drawing line';
      }
      if(keyName == 'Shift') {
        dragging = true;
      }
    });
    document.addEventListener('keyup', (event) => {
      if(event.key == "w" || event.key == "s")
        act.up = 0;
      if(event.key == "a" || event.key == "d")
        act.right = 0;
      if(event.key == 'Shift') {
        dragging = false;
      }
    });
  },
  drawing: false,
  drawingType: 0,
}

module.exports = actions;
