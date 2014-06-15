angular.module('do.install', [])

.config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('onboarding', {
        url: '/onboarding',
        views: {
          "main": {
            templateUrl: '/templates/onboardingAppmodule/installation.onboarding.html',
            controller: 'installOnboardingAppCtrl'
          }
        },
        authenticate: true
      })
      .state('addcode', {
        url: '/apps/:id/addcode',
        views: {
          "main": {
            templateUrl: '/templates/onboardingAppmodule/installation.addcode.html',
            controller: 'installAddcodeAppCtrl'
          }
        },
        authenticate: true
      })

  }
])

.controller('installOnboardingAppCtrl', ['$scope', '$http', 'config', '$state',
  'AppService', '$log', 'AppModel',
  function ($scope, $http, config, $state, AppService, $log, AppModel) {


    $scope.installapp = function () {

      $log.info($scope.name);
      $log.info($scope.url);
      if ($scope.app_form.$valid) {

      } else {
        $scope.submitted = true;
      }

      var data = {
        name: $scope.name,
        url: $scope.url
      };

      AppModel.addNewApp(data);
    }
  }
])

.controller('installAddcodeAppCtrl', ['$scope', '$http', 'AppService',
  '$location', 'CurrentAppService', 'AppModel', '$stateParams', '$rootScope',
  '$timeout',
  function ($scope, $http, AppService, $location, CurrentAppService,
    AppModel, $stateParams, $rootScope, $timeout) {
    CurrentAppService.getCurrentApp()
      .then(function (currentApp) {
        $scope.appId = $stateParams.id;
        // $scope.codeSnippet = '';

        var populateCode = function (err) {
          if (err) {
            console.log("error");
            return;
          }
          console.log("currentApp: ", AppService.getCurrentApp());
          $scope.apiKey = AppService.getCurrentApp()
            ._id;
        }

        AppModel.getSingleApp($scope.appId, populateCode)

        var callback = function (err, data) {
          if (err) {
            console.log("error");
            return;
          }
          if (data.isActive) {
            $location.path('/apps/' + $scope.appId + '/users/list');
          } else {
            $rootScope.info = true;
            $rootScope.infoMsgRootScope =
              'We have not received any data yet. Please check if the UserJoy Code is installed on your app.';
            $timeout(function () {
              $rootScope.info = false;
              $rootScope.infoMsgRootScope = '';
            }, 5000);
          }
        }

        $scope.selectText = function(containerid) {
          if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById(containerid));
            range.select();
          } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(document.getElementById(containerid));
            window.getSelection()
              .addRange(range);
          }
        }

        console.log("$scope.appId ---->>>>>", $scope.appId);
        $scope.startTracking = function () {
          AppModel.checkIfActive($scope.appId, callback);
        }
        console.log("codeSnippet: ", $scope.codeSnippet);
        $scope.getTextToCopy = function () {
          return $scope.codeSnippet;
        }

      })
  }
])