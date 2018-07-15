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
