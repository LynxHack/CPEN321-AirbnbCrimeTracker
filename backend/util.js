// Global Variables
const radiuspreset = 10000;

var getdist = (x1,y1,x2,y2) => {
  return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
};

module.exports = {
  filterCrimes: (val, convcoord) => {
    return getdist(convcoord[0], convcoord[1], val.x, val.y) < radiuspreset;
  }
};
