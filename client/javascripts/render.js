// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
const utils = require('./utility');
let ctx;
let zoom=1;
let pos={
  x: 0,
  y: 0
}

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

function zoomIn(val) {

}

function move(dX, dY) {
  pos.x+=dX;
  pos.y+=dY;
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
  pos: pos,
};

module.exports = render;
