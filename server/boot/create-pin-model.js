module.exports = function(app) {
  
  // **ONLY FOR SEEDING DATA FIRST TIME...WILL DELETE EXISTING TABLE IF RUN**
  // **CURRENTLY THE 'wUserId' is hard-coded but will be wrong...so run first time with just User, then update Pin**
  // app.dataSources.db.automigrate('Pin', function(err) {
  //   if (err) throw err;

  //   // RUN FIRST
  //   app.models.wUser.create([
  //     {username: 'ben', password: 'yukon', email: 'ben@coderush.ca', firstname: 'Ben', lastname: 'Sanders'},
  //     {username: 'james', password: 'yukon', email: 'james.matsuba@gmail.com', firstname: 'James', lastname: 'Matsuba'}
  //   ], function(err, wUser) {
  //     if (err) throw err;
 
  //     console.log('Models created: \n', wUser);
  //   });

  //   // RUN SECOND
  //   app.models.Pin.create([
  //     {coords: {lat: 49.282112, lng: -123.108313}, message: 'Winnipeg', recipient: 'Jody', type: 'private', status: 'discovered', wUserId: '557a0acb5882524e6a621195'}
  //   ], function(err, Pin) {
  //     if (err) throw err;
 
  //     console.log('Models created: \n', Pin);
  //   });
  // });

};
