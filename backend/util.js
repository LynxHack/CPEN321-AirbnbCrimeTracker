// Global Variables
const radiuspreset = 0.01;

var getdist = (x1,y1,x2,y2) => {
  // console.log(x1, x2, y1, y2, (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  // console.log((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2))
  return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
};

module.exports = {
  filterCrimes: (val, convcoord) => {
    // console.log(convcoord[0], convcoord[1], val.lng, val.lat);
    return getdist(convcoord[0], convcoord[1], val.lng, val.lat) < radiuspreset;
  }
};
