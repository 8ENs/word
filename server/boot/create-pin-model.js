module.exports = function(app) {
  app.dataSources.db.automigrate('Pin', function(err) {
    if (err) throw err;
 
    app.models.Pin.create([
      {coords: {lat: 49.282112, lng: -123.108313}, message: 'Winnipeg', recipient: 'Jody', type: 'public', status: 'discovered', wUserId: '5579e3e46d4f43db547fea8d'}
    ], function(err, Pin) {
      if (err) throw err;
 
      console.log('Models created: \n', Pin);
    });


  });
};
