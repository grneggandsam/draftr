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
