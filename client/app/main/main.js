'use strict';

angular.module('myYoAppApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .when('/polls/:author', {
        templateUrl: 'app/main/polls.html',
        controller: 'MainCtrl'
      });
  });