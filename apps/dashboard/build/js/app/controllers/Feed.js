angular.module('do.feed', [])

.config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('feed', {
        url: '/apps/:id/feed',
        views: {
          "main": {
            templateUrl: '/templates/feedmodule/feed.html',
            controller: 'FeedCtrl'
          }
        },
        authenticate: true
      })
  }
])

.controller('FeedCtrl', ['$scope',
  function ($scope) {

  }
])