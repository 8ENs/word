module.exports = function(app) {
  app.dataSources.db.automigrate('Pin', function(err) {
    if (err) throw err;
 
    app.models.Pin.create([
      {coords: {lat: 49.282112, lng: -123.108313}, message: 'Vancouver', recipient: 'Jody', type: 'public', status: 'discovered'}
    ], function(err, Pin) {
      if (err) throw err;
 
      console.log('Models created: \n', Pin);
    });
  });
};
