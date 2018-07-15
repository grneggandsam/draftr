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

function setMapPart(x1, y1, x2, y2, mapPart) {
  for(let i=0; i<(y2-y1); i++) {
    for(let j=0; j<(x2-x1); j++) {
      model.MAP[i+x1][j+y1] = mapPart[i][j];
    }
  }
}

function resetLoc() {
  if(outsideData != null) {
    if(outsideData.units[model.id] != null) {
      model.X = outsideData.units[model.id].x;
      model.Y = outsideData.units[model.id].y;
      model.needsReset = false;
    }
  }
}

function clearData() {
  actions.missles = {};
  actions.build.type = 0;
}

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
let clicked = false;
let snapped = false;
let withinSnap = {};

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

function dragging(e) {
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
  line.sX = downX;
  line.sY = downY;
  line.eX = downX;
  line.eY = downY;
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
  console.log("start", element);
  render.addItem(element);
  actions.drawing = true;
};

function endLine() {
  snapped = false;
  line.eX = upX;
  line.eY = upY;
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
  console.log("end", element, downX, line.sX);

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
      if(actions.drawingType == 1) {
        if(!actions.drawing) {
          downX = event.offsetX;
          downY = event.offsetY;
        }
        if(!clicked) {
          startLine();
        }
      }
    });
    c.addEventListener('mouseup', (event) => {
      if(actions.drawingType == 1) {
        upX = event.offsetX;
        upY = event.offsetY;
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
    });
    c.addEventListener('mousewheel', (event) => {
      console.log("blah", event.deltaY);
    });
    c.addEventListener('touchstart', (event) => {
      initiateDrag(event);
    });
    c.addEventListener('touchend', (event) => {
      endDrag(event);
    });
    c.addEventListener('touchmove', (event) => {
      dragging(event);
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
        actions.drawing = false;
        document.getElementById('curAction').innerHTML = 'none';
      }
      if(keyName == "l") {
        actions.drawingType = 1;
        clicked = false;
        actions.drawing = false;
        document.getElementById('curAction').innerHTML = 'drawing line';
      }
    });
    document.addEventListener('keyup', (event) => {
      if(event.key == "w" || event.key == "s")
        act.up = 0;
      if(event.key == "a" || event.key == "d")
        act.right = 0;
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
let outsideData;

function clearRender() {

};

function renderElems() {
  // loop through elements
  model.ELEM.forEach((elem) => {
    console.log(elem);
  });
};

function addItem(item) {
  let newEl = document.createElement(item.t);
  var keys = Object.keys(item);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(key != 't')
      newEl.setAttribute(key, item[key]);
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
    if(key != 't')
      elem.setAttribute(key, item[key]);
  }
}

const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  render: () => {
    renderElems();
    // outsideData = outsideDataP;
    // renderActions();
    // drawMap();
  },
  addItem: addItem,
  redraw: redraw,
  removeItem: removeItem,
  adjust: adjust,
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
