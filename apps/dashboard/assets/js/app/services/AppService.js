angular.module('services.AppService', [])

.service('AppService', ['$log', '$http', '$q', 'config',

  function ($log, $http, $q, config) {

    var apps = [];
    var defaultApp = {};
    var email = '';

    this.new = function (newApp) {
      apps.push(newApp);
    };

    this.setLoggedInApps = function (value) {
      // if (value instanceof Array) {
      //     angular.forEach(value, function (app) {
      //         apps.push(app);
      //     });
      // }
      apps = value;
    };

    this.getLoggedInApps = function () {
      return apps;
    };

    this.setCurrentApp = function (value) {
      defaultApp = value;
    }

    // return {
    //     getCurrentApp: function () {
    //         var defer = $q.defer();
    //         $http.get(config.apiUrl + '/apps')
    //             .success(function (data) {
    //                 defer.resolve(data[0]);
    //             })
    //         return defer.promise;
    //     }
    // }

    this.getCurrentApp = function () {
      return defaultApp;
    }

    this.setEmail = function (value) {
      email = value;
    }

    this.getEmail = function () {
      return email;
    }

    return this;

  }
])