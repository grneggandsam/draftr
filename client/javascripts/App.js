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
