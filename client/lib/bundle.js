(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== SETUP ========================================
// -----------------------------------------------------------------------------

var docCookies = require('./cookies');
var utils = require('./utility');
var actions = require('./actions');
var model = require('./model');
var render = require('./render');

var c;
var ctx;
var outsideData;
var hits = {};
var mapSet = false;
var resetWait = 0;

$( function() {
  var height = window.innerHeight;
  model.vHeight = height - 50;
  model.vWidth = window.innerWidth;
  var theView = document.getElementById('theView');
  theView.style.height = model.vHeight + "px";
  theView.style.width = model.vWidth + "px";
  actions.assignListeners(theView);
});

},{"./actions":2,"./cookies":3,"./model":4,"./render":5,"./utility":6}],2:[function(require,module,exports){
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
  clearTemp();
};

function clearTemp() {
  actions.drawing = false;
  hotkeyDist.writingVal = false;
  hotkeyDist.distSet = false;
  document.getElementById('curDist').innerHTML = "";
}

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
    hotkeyDist.writingVal = false;
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

},{"./model":4,"./render":5,"./utility":6}],3:[function(require,module,exports){
var docCookies = {
  getItem: function (name) {
    nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;  },
  parseMap: function(map) {
    var j = 0;
    var k = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          j++;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          k++;
        }
      }
    }
    var columns = j-1;
    var rows = (k+1)/columns;
    j=0;
    k=0;
    var MAP = Array(columns).fill().map(() => Array(rows).fill(0));
    var depth = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          depth++;
        }
        // Detects a ]
        if(map[i+1] == '5' && map[i+2] == 'D') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            k++;
            j=0;
          }
          depth--;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            j++;
          }
        }
      }
    }
    return MAP;

  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
        break;
        case String:
        sExpires = "; expires=" + vEnd;
        break;
        case Date:
        sExpires = "; expires=" + vEnd.toUTCString();
        break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "$&") + "s*=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|s*;)[^=]+)(?=;|$)|^s*|s*(?:=[^;]*)?(?:1|$)/g, "").split(/s*(?:=[^;]*)?;s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
      return aKeys;
  }
};

module.exports = docCookies;

},{}],4:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== MODEL ========================================
// -----------------------------------------------------------------------------

const vWidth = 1100; // Defaults
const vHeight = 800; // Defaults

var model = {
  X: 500,
  Y: 350,
  s: 5,                 // Constant that defines the change in distance per action
  vWidth: vWidth,
  vHeight: vHeight,
  needsReset: true,
  MAP: [],
  ELEM: [],
  POINTS: [],
  columns: 0,
  rows: 0,
  id: 0
}

module.exports = model;

},{}],5:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
const utils = require('./utility');
let ctx;
let sPos={
  x: 0,
  y: 0
}

function clearRender() {
  let circle = '<circle id="snapCircle" cx="50" cy="50" r="10" stroke-width="0" fill="yellow" />';
  ctx.innerHTML = circle;
};

function renderElems() {
  // loop through elements
  model.ELEM.forEach((elem) => {
    addItem(elem);
  });
};

function addItem(item) {
  // Adjust for pan/scale
  let adjustedElem = Object.assign({}, item);
  if(adjustedElem.t == 'line') {
    adjustedElem.x1 = (adjustedElem.x1 - render.pos.x) * render.screenScale;
    adjustedElem.y1 = (adjustedElem.y1 - render.pos.y) * render.screenScale;
    adjustedElem.x2 = (adjustedElem.x2 - render.pos.x) * render.screenScale;
    adjustedElem.y2 = (adjustedElem.y2 - render.pos.y) * render.screenScale;
  }
  let newEl = document.createElement(adjustedElem.t);
  var keys = Object.keys(item);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(key != 't')
      newEl.setAttribute(key, adjustedElem[key]);
  }
  ctx.appendChild(newEl);
  ctx.innerHTML += '';
}

function removeItem(name) {
  ctx.removeChild(document.getElementById(name));
}


// Currently Broken
function redraw(name, item) {
  let newEl = document.createElement(item.t);
  newEl.setAttribute('x1', item.x1);
  newEl.setAttribute('x2', item.x2);
  newEl.setAttribute('y1', item.y1);
  newEl.setAttribute('y2', item.y2);
  newEl.setAttribute('style', item.style);
  let currentLine = document.getElementById(name);
  console.log("currentLine", currentLine);
  console.log("name", name);

  ctx.replaceChild(newEl, currentLine);
  ctx.innerHTML += '';
}

function adjust(name, item) {
  let elem = document.getElementById(name);
  var keys = Object.keys(item);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(key != 't' && key != null)
      elem.setAttribute(key, item[key]);
  }
}

function zoomIn(x, y, val) {
  render.screenScale*=val;
  render.pos.x+=(val*x-x)/render.screenScale;
  render.pos.y+=(val*y-y)/render.screenScale;
}

function move(baseX, baseY) {
  render.pos.x = baseX;
  render.pos.y = baseY;
}

const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  renderElems: renderElems,
  clearRender: clearRender,
  addItem: addItem,
  removeItem: removeItem,
  adjust: adjust,
  pos: sPos,
  move: move,
  zoomIn: zoomIn,
  screenScale: 1,
};

module.exports = render;

},{"./model":4,"./utility":6}],6:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== UTILITY ========================================
// -----------------------------------------------------------------------------

var utils = {
  dist: function(x1, y1, x2, y2) {
      return (Math.hypot(x2-x1, y2-y1))
    },
  unit: function(x1, y1, x2, y2) {
      let d = this.dist(x1, y1, x2, y2);
      let dir = {
        x: (x2 - x1)/d,
        y: (y2 - y1)/d
      }
      return dir;
    },
  validate: function(format, input) {
      var keys = Object.keys(format);
      for(var i=0;i<keys.length;i++){
        var key = keys[i];
        if(input[key] == null) {
          return false;
        }
        else {
          if(typeof format[key] === 'object') {
            if(!this.validate(format[key], input[key]))
              return false;
          }
        }
      }
      return true;
    }
}

module.exports = utils;

},{}]},{},[1]);
