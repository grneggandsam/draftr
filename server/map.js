// ------------------------THE MAP------------------------------//

var columns = 110;
var rows = 80;

var MAP = Array(columns).fill().map(() => Array(rows).fill({t: 0}));

function readMap() {
return new Promise( function(resolve, reject) {
    var map;
    fs = require('fs')
    fs.readFile(__dirname + "/a_map.m", 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      map = JSON.parse(data);
      for(let i=0; i<map.length; i++) {
        for(let j=0; j<map[0].length; j++) {
          MAP[i][j] = map[i][j];
        }
      }
      columns = map.length;
      rows = map[0].length;
      resolve(MAP);
    });
  });
}

function readDBMap(db) {
  const collection = db.get('map');
  collection.findOne({ 'id': 1 }, {}, function(e,docs){
    map = docs.map;
    for(let i=0; i<map.length; i++) {
      for(let j=0; j<map[0].length; j++) {
        MAP[i][j] = map[i][j];
      }
    }
  });
}

function insertDBMap(db) {
  const collection = db.get('map');

  collection.insert( {id: 1, map: MAP} ).then((docs) => {
    console.log("saved", docs.map[1][0], docs.map.length, docs.map[0].length);
    console.log("existing", MAP[1][0], MAP.length, MAP[0].length);
  });
  console.log("Inserted Map into Database");
}

function saveDBMap(db) {
  return new Promise( function(resolve, reject) {
    const collection = db.get('map');
    MAP[0][0] = { t: 1}
    collection.update( {id: 1}, { $set: { map: MAP } } ).then((docs) => {
      console.log("saved", MAP);
      resolve(docs);
    });
  });
}

function createWall(x1, y1, len, dir, val) {
  switch(dir) {
    // Right is 0
    case 0:
      for(let i=0; i<len; i++) {
        MAP[x1+i][y1] = val;
      };
      break;
    // Down is 1
    case 1:
      for(let i=0; i<len; i++) {
        MAP[x1][y1+i] = val;
      };
      break;
      // Left is 2
      case 2:
        for(let i=0; i<len; i++) {
          MAP[x1-i][y1] = val;
        };
        break;
      // Up is 3
      case 3:
        for(let i=0; i<len; i++) {
          MAP[x1][y1-i] = val;
        };
        break;
  };
}

function initiateMap() {
  createWall(0, 0, 33, 0, 1);
  createWall(0, 1, 23, 1, 1);
  createWall(1, 23, 32, 0, 1);
  createWall(32, 1, 22, 1, 1);
  createWall(9, 9, 5, 0, 1);
  createWall(9, 8, 5, 3, 1);
};

function change(type, x, y) {
  MAP[x][y] = type;14
};

function changeDB(type, x, y, db) {
  const collection = db.get('map');
  collection.findOne({ 'id': 1 }, {}, function(e,docs){
    let updateMap = docs;
    console.log(x, y, type);
    updateMap[x][y] = type;
    collection.update( {'id': 1}, { $set: { map: updateMap } } );
  });
};

module.exports = {map: MAP, initiateMap: initiateMap, change: change, readMap: readMap, saveDBMap: saveDBMap, readDBMap: readDBMap, insertDBMap: insertDBMap};
