(function() {
  window.API_HOST = '';
  
  var app = angular.module('starter', ['ionic', 'starter.controllers', 'starter.directives'])

  app.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider.state('welcome', {
      url: '/welcome',
      templateUrl: 'templates/welcome.html'
    })

    $stateProvider.state('register', {
      url: '/register',
      templateUrl: 'templates/register.html'
    })

    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'templates/login.html'
    })

    $stateProvider.state('main', {
      url: '/main',
      templateUrl: 'templates/main.html'
    })

    $stateProvider.state('droppin', {
      url: '/droppin',
      templateUrl: 'templates/droppin.html'
    })

    $stateProvider.state('explore', {
      url: '/explore',
      templateUrl: 'templates/explore.html'
    })

    $urlRouterProvider.otherwise('/welcome');
  })

  app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })


}());