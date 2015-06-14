module.exports = function(Pin) {
  var loopback = require('loopback');
  var GeoPoint = require('../../node_modules/loopback/lib/loopback').GeoPoint;
  // var here = new GeoPoint({lat: 49.282123, lng: -123.108421});
  // var there = new GeoPoint({lat: 49.285561, lng: -123.111406});
  
  // Pin.find( {where: {location: {near: here}}, limit:2}, function(err, nearbyPins) {
  //   console.info(nearbyPins);
  // });
  // var close = GeoPoint.distanceBetween(here, there, {type: 'meters'}) < 400;
  // Pin.geo function() {
  //   console.log(GeoPoint.distanceBetween(here, there, {type: 'meters'}));
  // }
  // http://localhost:3000/api/Pins?filter[where][coords][near]=49.282123,-123.108421&filter[limit]=3
  // console.log(close);

  // Pin.distance = function(cb) {
    // var here = {lat: 49.282123, lng: -123.108421};
  //   var there = {lat: 49.285561, lng: -123.111406};

  //   var response = GeoPoint.distanceBetween(here, there, {type: 'meters'});
  //   cb(null, response);
  // };
  // Pin.remoteMethod(
  //   'distance',
  //   {
  //     http: {path: '/geo', verb: 'get'},
  //     returns: {arg: 'distance', type: 'string'}
  //   }
  // );

  Pin.closest = function(cb) {
    var ctx = loopback.getCurrentContext();
    var coords = ctx.get('coords');

    console.log(coords);
    var here = new GeoPoint({lat: coords.A, lng: coords.F});
    Pin.find( {where: {coords: {near: here}}, limit:1}, function (err, nearbyPins) {
      console.info(nearbyPins);
      response = nearbyPins;
      cb(null, response);
    });
  }

  Pin.remoteMethod (
    'closest',
    {
      http: {path: '/closest', verb: 'get'},
      // accepts: {arg: 'id', type: 'string', http: { source: 'query' } },
      returns: {arg: 'coords', type: 'array'}
    }
  );
};
