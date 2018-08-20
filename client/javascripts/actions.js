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
let isMouseDown = false;
let clicked = false;
let mouseMoving = false;
let snapped = false;
let withinSnap = {};
let dragging = false;
let dragMouseDown = false;
let dragStart = {
  x: 0,
  y: 0
};
let screenStart = {
  x: 0,
  y: 0
};
let stick = 0;
hotkeyDist = {
  writingVal: false,
  val: "",
  distSet: false,
  distVal: 0
};

// Some parameters for settings
const STROKE_WIDTH = 1;
const SNAP_DIST = 10;
const ZOOM_OUT = .8;
const ZOOM_IN = 1.2;

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
  // if(pointing) {
  //   eX = e.changedTouches[0].pageX;
  //   eY = e.changedTouches[0].pageY;
  //   let vec = utils.unit(sX, sY, eX, eY);
  //   actions.act.up = -(vec.y * model.s);
  //   actions.act.right = vec.x * model.s;
  // }
  mouse = event;
  if(dragging || dragMouseDown) {
    if(dragMouseDown) {
      let dX = screenStart.x + (dragStart.x - mouse.offsetX) / render.screenScale;
      let dY = screenStart.y + (dragStart.y - mouse.offsetY) / render.screenScale;
      render.move(dX, dY);
      render.clearRender();
      render.renderElems();
    }
  }
  else {
    if(actions.drawingType == 1) {
      if(actions.drawing) {
        let element;
        if(stick == 2) {
          element = {
            x2: mouse.offsetX,
            y2: deconvertY(line.sY)
          };
        }
        else if(stick == 1) {
          element = {
            x2: deconvertX(line.sX),
            y2: mouse.offsetY
          };
        }
        else {
          element = {
            x2: mouse.offsetX,
            y2: mouse.offsetY
          };
          if(hotkeyDist.distSet) {
            let lineX = deconvertX(line.sX);
            let lineY = deconvertY(line.sY);
            let lineRatio = hotkeyDist.distVal / utils.dist(lineX, lineY, element.x2, element.y2);
            element.x2 = lineRatio * (element.x2 - lineX) + lineX;
            element.y2 = lineRatio * (element.y2 - lineY) + lineY;
            line.eX = adjustX(element.x2);
            line.eY = adjustY(element.y2);
          }
        }
        render.adjust("currentLine", element);
      }
      else {
        if(isMouseDown || clicked) {
          startLine();
          actions.drawing = true;
        }
      }

      // Snapping Logic
      let aSnap = inSnap(mouse.offsetX, mouse.offsetY);
      if(aSnap.s) {
        document.getElementById('snapCircle').style.visibility = 'visible';
        render.adjust('snapCircle', {cx: aSnap.x, cy: aSnap.y});
      }
      else {
        document.getElementById('snapCircle').style.visibility = 'hidden';
      }
    }
  }
};

function mouseIn(event) {
  isMouseDown = true;
  // if shift click
  if(dragging) {
    dragMouseDown = true;
    dragStart.x = event.offsetX;
    dragStart.y = event.offsetY;
    screenStart.x = render.pos.x;
    screenStart.y = render.pos.y;
  }
  else {
    downX = event.offsetX;
    downY = event.offsetY;
    mouseMoving = false;
  }
};

function mouseOut(event) {
  isMouseDown = false;
  // if dragging
  if(dragging || dragMouseDown) {
    dragMouseDown = false;
  }
  else {
    upX = event.offsetX;
    upY = event.offsetY;
    mouseMoving = false;
    if(actions.drawingType == 1) {
      if(!actions.drawing) {
        clicked = !clicked;
      }
      else {
        clicked = false;
        endLine();
      }
    }
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

function snap(x, y) {
  model.POINTS.forEach( (elem) => {
    if(utils.dist(x, y, (elem.x - render.pos.x) * render.screenScale, (elem.y - render.pos.y) * render.screenScale) < SNAP_DIST) {
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
    if(utils.dist(x, y, (elem.x - render.pos.x) * render.screenScale, (elem.y - render.pos.y) * render.screenScale) < SNAP_DIST) {
      aSnap = {s: true, x: (elem.x - render.pos.x) * render.screenScale, y: (elem.y - render.pos.y) * render.screenScale};
    }
  });
  return aSnap;
}

function startLine() {
  line.sX = adjustX(downX);
  line.sY = adjustY(downY);
  line.eX = adjustX(downX);
  line.eY = adjustY(downY);
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
  if(hotkeyDist.distSet) {
    // line.eX = adjustX();
    // line.eY = adjustY(upY);
  } else {
    line.eX = adjustX(upX);
    line.eY = adjustY(upY);
  }
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
  if(stick == 1) {
    element.x2 = element.x1;
  }
  if(stick == 2) {
    element.y2 = element.y1;
  }
  let pointA = {
    x: element.x1,
    y: element.y1
  }
  let pointB = {
    x: element.x2,
    y: element.y2
  }

  model.ELEM.push(element);
  model.POINTS.push(pointA);
  model.POINTS.push(pointB);
  render.addItem(element);
  actions.drawing = false;
};

function zoom(x, y, val) {
  if(val > 0) {
    render.zoomIn(x, y, ZOOM_OUT);
  }
  else {
    render.zoomIn(x, y, ZOOM_IN);
  }
  render.clearRender();
  render.renderElems();
};

function adjustX(x) {
  return render.pos.x + (x / render.screenScale);
};

function adjustY(y) {
  return render.pos.y + (y / render.screenScale);
};

function deconvertX(x) {
  return (x - render.pos.x) * render.screenScale;
};

function deconvertY(y) {
  return (y - render.pos.y) * render.screenScale;
};

function assignKeyDowns(event) {
  const keyName = event.key;
  dragging = false;
  if(keyName == "w" || keyName == "s") {
    if(stick == 1) {
      stick = 0;
    }
    else {
      stick = 1;
    }
  }
  if(keyName == "d" || keyName == "a") {
    if(stick == 2) {
      stick = 0;
    }
    else {
      stick = 2;
    }
  }
  if(keyName == "q" || keyName == 'Escape') {
    stick = 0;
    actions.drawingType = 0;
    let curLine = document.getElementById('currentLine');
    if(curLine)
      render.removeItem('currentLine');
    clicked = false;
    snapped = false;
    actions.drawing = false;
    hotkeyDist.distSet = false;
    document.getElementById('curAction').innerHTML = 'none';
  }
  if(keyName == "l") {
    if(actions.drawingType != 1) {
      actions.drawingType = 1;
      clicked = false;
      snapped = false;
      actions.drawing = false;
      document.getElementById('curAction').innerHTML = 'drawing line';
    }
  }
  if(keyName == 'Shift') {
    dragging = true;
  }
  if(keyName > -1 && keyName < 10) {
    hotkeyDist.writingVal = true;
    hotkeyDist.val += keyName;
    document.getElementById('curDist').innerHTML = hotkeyDist.val;
    console.log("number detected");
  }
  if(keyName == "Enter") {
    console.log("Enter Detected", hotkeyDist.val, hotkeyDist.distSet);
    hotkeyDist.distSet = true;
    hotkeyDist.distVal = parseInt(hotkeyDist.val);
    hotkeyDist.writingVal = false;
    hotkeyDist.val = "";
  }
};

function assignKeyUps(event) {
  if(event.key == "w" || event.key == "s") {
    // if(stick == 1) {
    //   stick = 0;
    // }
  }
  if(event.key == "a" || event.key == "d") {
    // if(stick = 2) {
    //   stick = 0;
    // }
  }
  if(event.key == 'Shift') {
    dragging = false;
  }
};

// Export functions
var actions = {

  assignListeners: function(c) {
    render.setCtx(c);
    // document.getElementById("save").addEventListener("click", saveMap);
    document.getElementById("logout").addEventListener("click", logout);
    c.addEventListener('mousedown', (event) => {
      mouseIn(event);
    });
    c.addEventListener('mouseup', (event) => {
      mouseOut(event);
    });
    c.addEventListener('mousemove', (event) => {
      drag(event);
    });
    c.addEventListener('mousewheel', (event) => {
      zoom(event.offsetX, event.offsetY, event.deltaY);
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
    document.addEventListener('keydown', (event) => {
      assignKeyDowns(event);
    });
    document.addEventListener('keyup', (event) => {
      assignKeyUps(event);
    });
  },
  drawing: false,
  drawingType: 0,
}

module.exports = actions;
