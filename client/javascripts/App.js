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
