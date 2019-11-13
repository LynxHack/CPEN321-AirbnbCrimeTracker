/* adapted from http://home.hiwaay.net/~taylorc/toolbox/geography/geoutm.html*/


var pi = 3.14159265358979;

/* Ellipsoid model constants (actual values here are for WGS84) */
var sma = 6378137.0;
var smb = 6356752.314;
// var sm_EccSquared = 6.69437999013e-03;

var UTMScaleFactor = 0.9996;


/*
 * degToRad
 *
 * Converts degrees to radians.
 *
 */
function degToRad(deg) {
  return (deg / 180.0 * pi);
}

/*
 * arcLengthOfMeridian
 *
 * Computes the ellipsoidal distance from the equator to a point at a
 * given latitude.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * Inputs:
 *     phi - Latitude of the point, in radians.
 *
 * Globals:
 *     sma - Ellipsoid model major axis.
 *     smb - Ellipsoid model minor axis.
 *
 * Returns:
 *     The ellipsoidal distance of the point from the equator, in meters.
 *
 */
function arcLengthOfMeridian(phi) {
  var alpha, beta, gamma, delta, epsilon, n;
  var result;

  /* Precalculate n */
  n = (sma - smb) / (sma + smb);

  /* Precalculate alpha */
  alpha = ((sma + smb) / 2.0) *
    (1.0 + (Math.pow(n, 2.0) / 4.0) + (Math.pow(n, 4.0) / 64.0));

  /* Precalculate beta */
  beta = (-3.0 * n / 2.0) + (9.0 * Math.pow(n, 3.0) / 16.0) +
    (-3.0 * Math.pow(n, 5.0) / 32.0);

  /* Precalculate gamma */
  gamma = (15.0 * Math.pow(n, 2.0) / 16.0) +
    (-15.0 * Math.pow(n, 4.0) / 32.0);

  /* Precalculate delta */
  delta = (-35.0 * Math.pow(n, 3.0) / 48.0) +
    (105.0 * Math.pow(n, 5.0) / 256.0);

  /* Precalculate epsilon */
  epsilon = (315.0 * Math.pow(n, 4.0) / 512.0);

  /* Now calculate the sum of the series and return */
  result = alpha *
    (phi + (beta * Math.sin(2.0 * phi)) +
      (gamma * Math.sin(4.0 * phi)) +
      (delta * Math.sin(6.0 * phi)) +
      (epsilon * Math.sin(8.0 * phi)));

  return result;
}



/*
 * utmCentralMeridian
 *
 * Determines the central meridian for the given UTM zone.
 *
 * Inputs:
 *     zone - An integer value designating the UTM zone, range [1,60].
 *
 * Returns:
 *   The central meridian for the given UTM zone, in radians, or zero
 *   if the UTM zone parameter is outside the range [1,60].
 *   Range of the central meridian is the radian equivalent of [-177,+177].
 *
 */
function utmCentralMeridian(zone) {
  var cmeridian;

  cmeridian = degToRad(-183.0 + (zone * 6.0));

  return cmeridian;
}

/*
 * mapLatLonToXY
 *
 * Converts a latitude/longitude pair to x and y coordinates in the
 * Transverse Mercator projection.  Note that Transverse Mercator is not
 * the same as UTM; a scale factor is required to convert between them.
 *
 * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
 * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
 *
 * Inputs:
 *    phi - Latitude of the point, in radians.
 *    lambda - Longitude of the point, in radians.
 *    lambda0 - Longitude of the central meridian to be used, in radians.
 *
 * Outputs:
 *    xy - A 2-element array containing the x and y coordinates
 *         of the computed point.
 *
 * Returns:
 *    The function does not return a value.
 *
 */
function mapLatLonToXY(phi, lambda, lambda0, xy) {
  var N, nu2, ep2, t, t2, l;
  var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
  var tmp;

  /* Precalculate ep2 */
  ep2 = (Math.pow(sma, 2.0) - Math.pow(smb, 2.0)) / Math.pow(smb, 2.0);

  /* Precalculate nu2 */
  nu2 = ep2 * Math.pow(Math.cos(phi), 2.0);

  /* Precalculate N */
  N = Math.pow(sma, 2.0) / (smb * Math.sqrt(1 + nu2));

  /* Precalculate t */
  t = Math.tan(phi);
  t2 = t * t;
  tmp = (t2 * t2 * t2) - Math.pow(t, 6.0);

  /* Precalculate l */
  l = lambda - lambda0;

  /* Precalculate coefficients for l**n in the equations below
     so a normal human being can read the expressions for easting
     and northing
     -- l**1 and l**2 have coefficients of 1.0 */
  l3coef = 1.0 - t2 + nu2;

  l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);

  l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2 -
    58.0 * t2 * nu2;

  l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2 -
    330.0 * t2 * nu2;

  l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);

  l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

  /* Calculate easting (x) */
  xy[0] = N * Math.cos(phi) * l +
    (N / 6.0 * Math.pow(Math.cos(phi), 3.0) * l3coef * Math.pow(l, 3.0)) +
    (N / 120.0 * Math.pow(Math.cos(phi), 5.0) * l5coef * Math.pow(l, 5.0)) +
    (N / 5040.0 * Math.pow(Math.cos(phi), 7.0) * l7coef * Math.pow(l, 7.0));

  /* Calculate northing (y) */
  xy[1] = arcLengthOfMeridian(phi) +
    (t / 2.0 * N * Math.pow(Math.cos(phi), 2.0) * Math.pow(l, 2.0)) +
    (t / 24.0 * N * Math.pow(Math.cos(phi), 4.0) * l4coef * Math.pow(l, 4.0)) +
    (t / 720.0 * N * Math.pow(Math.cos(phi), 6.0) * l6coef * Math.pow(l, 6.0)) +
    (t / 40320.0 * N * Math.pow(Math.cos(phi), 8.0) * l8coef * Math.pow(l, 8.0));

  return;
}


/*
 * latLonToUTMXY
 *
 * Converts a latitude/longitude pair to x and y coordinates in the
 * Universal Transverse Mercator projection.
 *
 * Inputs:
 *   lat - Latitude of the point, in radians.
 *   lon - Longitude of the point, in radians.
 *   zone - UTM zone to be used for calculating values for x and y.
 *          If zone is less than 1 or greater than 60, the routine
 *          will determine the appropriate zone from the value of lon.
 *
 * Outputs:
 *   xy - A 2-element array where the UTM x and y values will be stored.
 *
 * Returns:
 *   The UTM zone used for calculating the values of x and y.
 *
 */
function latLonToUTMXY(lat, lon, zone, xy) {
  mapLatLonToXY(lat, lon, utmCentralMeridian(zone), xy);

  /* Adjust easting and northing for UTM system. */
  xy[0] = xy[0] * UTMScaleFactor + 500000.0;
  xy[1] = xy[1] * UTMScaleFactor;
  // if (xy[1] < 0.0) {
  //   xy[1] = xy[1] + 10000000;
  //   xy[1] = xy[1] + Math.pow(10, 8);
  // }

  return zone;
}

/*
 * btnToUTM_OnClick
 *
 * Called when the btnToUTM button is clicked.
 *
 */
// function btnToUTM_OnClick(lon, lat) {
function btnToUTMOnClick(lon, lat){
  var xy = new Array(2);

  // if(typeof lon != "integer") {
  var long = parseFloat(lon);
  // } else {
  //   var long = parseFloat(lon);
  // }

  // if(typeof lat != "integer") {
  //   var lati = parseFloat(lat);
  // } else {
  var lati = parseFloat(lat);
  // }
  // Compute the UTM zone.
  var zone = Math.floor((long + 180.0) / 6) + 1;

  zone = latLonToUTMXY(degToRad(lati), degToRad(long), zone, xy);

  return xy;
}
module.exports = btnToUTMOnClick;
