var app = angular.module('dodatado', [
  'ui.bootstrap',
  'ui.router',
  // 'ngSails',
  'ivpusic.cookie',
  'angularMoment',
  'lodash',
  'services',
  'models',
  'ngTable',
  // 'mgcrea.ngStrap',
  // 'templates-dev',

  'do.navbar',
  'do.home',
  'do.register',
  'do.users',
  'ngSanitize',
  'do.message',
  'textAngular',
  'do.popupmessage',
  'nvd3ChartDirectives',
  'do.login',
  'do.signup',
  'do.install',
  'do.settings',
  'do.feed',
  'http-auth-interceptor',
  'angular-momentjs',
  'do.automate',
  'toggle-switch',
  'angular-tour',
  'flash',
  'do.demo',
])

.directive('fallbackSrc', function () {
  var fallbackSrc = {
    link: function postLink(scope, iElement, iAttrs) {
      iElement.bind('error', function () {
        angular.element(this)
          .attr("src", iAttrs.fallbackSrc);
      });
    }
  }
  return fallbackSrc;
})

.directive('compileData', ['$compile',
  function ($compile) {
    return {
      scope: true,
      link: function (scope, element, attrs) {

        var elmnt;

        attrs.$observe('template', function (myTemplate) {
          var myTemplate =
            '<span>Email is not Verified. Click <a ng-click="resendEmailVerification()" style="cursor: pointer">here</a> to resend Email</span>';
          if (angular.isDefined(myTemplate)) {
            // compile the provided template against the current scope
            elmnt = $compile(myTemplate)(scope);

            element.html(""); // dummy "clear"

            element.append(elmnt);
          }
        });
      }
    };
  }
])


.provider('appIdProvider', [

  function () {

    var appId = '';

    this.$get = [

      function () {
        return {
          setAppId: function (value) {
            appId = value;
          },
          getAppId: function () {
            return appId;
          }
        };
      }
    ];
  }
])

.provider('login', [

  function () {

    var userIsAuthenticated = false;

    this.$get = [

      function () {
        return {
          setLoggedIn: function (value) {
            userIsAuthenticated = value;
          },
          getLoggedIn: function () {
            return userIsAuthenticated;
          }
        };
      }
    ];
  }
])

.provider('error', [

  function () {

    var showError = false;

    this.$get = [

      function () {
        return {
          setError: function (value) {
            showError = value;
          },
          getError: function () {
            return showError;
          }
        };
      }
    ];
  }
])

.filter('startFrom', function () {
  return function (input, start) {
    start = +start; //parse to int
    return input.slice(start);
  }
})

.filter('newlines', function () {
  return function (text) {
    return text.replace(/\n/g, '<br/>');
  }
})

.filter('unsafe', ['$sce',
  function ($sce) {
    return function (val) {
      return $sce.trustAsHtml(val);
    }
  }
])

.config(['$stateProvider', '$urlRouterProvider',
  '$locationProvider', '$httpProvider', '$provide', '$momentProvider',
  'loginProvider', '$logProvider',
  function ($stateProvider, $urlRouterProvider,
    $locationProvider, $httpProvider, $provide, $momentProvider,
    loginProvider, $logProvider) {


    $logProvider.debugEnabled(false);

    // errorProvider.setError(false);
    // $rootScope.error = false;
    $momentProvider.asyncLoading(false)
      .scriptUrl(
        '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.1/moment.min.js'
    );

    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
    console.log('\n\n setting authcredentials');
    // for making cross domain authentication requests
    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $httpProvider.interceptors.push(['$rootScope', '$location', '$q',
      '$timeout', 'flash',
      function ($rootScope, $location, $q,
        $timeout, flash) {
        $rootScope.error = false;
        $rootScope.success = false;
        $rootScope.errMsgRootScope = '';
        $rootScope.successMsgRootScope = '';
        console.log("$rootScope.errMsgRootScope: app.js: ", $rootScope
          .errMsgRootScope);
        return {
          'request': function (config, response) {
            // do something on success
            console.log("success config: ", config, response);
            return config;
          },
          'response': function (response) {
            console.log("response: ", response);
            if (response.status === 200 && response.config.method != 'PUT') {
              $rootScope.error = false;
              $rootScope.success = false;
              $rootScope.errMsgRootScope = '';
              $rootScope.successMsgRootScope = '';
            }
            if (response.status === 200 && response.config.method ===
              'PUT') {
              $rootScope.successMsgRootScope = 'Success';
              $rootScope.errorMsgRootScope = '';
              $rootScope.error = false;
              $rootScope.success = true;
              $timeout(function () {
                $rootScope.success = false;
              }, 3000);
            }
            if (response.status === 201) {
              console.log("success: ", response);
              $rootScope.successMsgRootScope = 'Success';
              $rootScope.errorMsgRootScope = '';
              $rootScope.error = false;
              $rootScope.success = true;
              $timeout(function () {
                $rootScope.success = false;
                $rootScope.successMsgRootScope = '';
              }, 3000);
            }
            return response;
          },
          'responseError': function (rejection) {
            console.log("rejection: ", rejection);
            if (rejection.status === 400 || rejection.status ===
              500 || rejection.status === 404) {
              console.log("error: ", rejection.data.error);
              $rootScope.error = true;
              if (_.isArray(rejection.data.error)) {
                $rootScope.errMsgRootScope = rejection.data.error[
                  0];
              } else {
                $rootScope.errMsgRootScope = rejection.data.error;
              }
              $rootScope.successMsgRootScope = '';
              $rootScope.success = false;
              console.log("$rootScope errMSg: ", $rootScope.errMsgRootScope);
              $timeout(function () {
                $rootScope.error = false;
              }, 5000);
            }
            if (rejection.status === 401 && $location.path() === '/login' &&
              rejection.config.method === 'POST') {
              console.log("rejection loggin in : ", rejection);
              $rootScope.errMsgRootScope = rejection.data.error;
              $rootScope.error = true;
              $rootScope.success = false;
              $rootScope.successMsgRootScope = '';
              $timeout(function () {
                $rootScope.error = false;
              }, 5000);
            }

            if (rejection.status === 403 && rejection.data.error ===
              'EMAIL_NOT_VERIFIED' &&
              rejection.config.method === 'POST') {
              console.log("inside 403");
              $rootScope.errMsgRootScope = '';
              $rootScope.error = true;
              $rootScope.errMsgRootScope =
                '<span>Email is not Verified. Click here<a href="#"></a> to resend Email</span>';
              console.log("errMsgRootScope: ", $rootScope.errMsgRootScope);
            }
            var url = $location.path()
              .split('/');
            console.log("url: ", url);
            var checkUrl = url[1];
            console.log("url 1: ", url[1]);
            var inviteUrl = url[3] ? url[3] : '';
            console.log("invite Url: ", inviteUrl);
            // if we're not logged-in to the web service, redirect to login page
            if (rejection.status === 401 && checkUrl !=
              'login' && checkUrl != 'forgot-password' && checkUrl !=
              'signup' && inviteUrl != 'invite' && inviteUrl !=
              'verify-email' && checkUrl != 'demo') {
              console.log("401 status logout");
              loginProvider.setLoggedIn = false;
              $rootScope.loggedIn = false;
              $location.path('/login');
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);

    // adding custom tool to textAngular
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', 'config',
      '$http', 'AppService', 'CurrentAppService', '$location',
      function (taRegisterTool, taOptions, config, $http, AppService,
        CurrentAppService, $location) {
        // $delegate is the taOptions we are decorating
        // register the tool with textAngular
        console.log("$location.path(): in app.js: ", $location.path());
        var appId = $location.path()
          .split('/')[2];
        var attributes = [];
        $http.get(config.apiUrl + '/apps/' + appId +
          '/automessages/attributes')
          .success(function (data) {
            console.log("success in getting automsg attributes", _.keys(
              data.userAttributes));
            var keys = _.keys(data.userAttributes);
            for (var i = 0; i < keys.length; i++) {
              var prop = keys[i]
              value = data.userAttributes[prop];
              console.log("user attributes value: ", value);
              if (value == 'user.plan') {
                attributes.push({
                  name: value,
                  value: '{{= ' + value + ' || "CHANGE THIS" }}'
                })
              } else {
                attributes.push({
                  name: value,
                  value: '{{= ' + value + ' || "there" }}'
                })
              }
            };
            console.log("user attributes: ", attributes);
            // for (var i = 0; i < data.userAttributes.length; i++) {
            //   options.push({
            //     name: _.key
            //   })
            // };
            // options.push({
            //   name:
            // })
          })
          .error(function () {
            console.log("error in getting automsg attributes");
          })
        taRegisterTool('dropdown', {
          display: "<span class='dropdown' style='height: 33px;'>" +
            "<button class='dropdown-toggle' type='button' ng-disabled='showHtml()' style='background-color: #fff; border: 0px solid #fff;'><i class='fa fa-caret-down'></i>&nbsp;User Data</button>" +
            "<ul class='dropdown-menu'><li ng-repeat='o in options' ng-model='o.value' ng-click='action(o.value)'>{{o.name}}</li></ul>" +
            "</span>",
          action: function (size) {
            if (size !== '' && typeof (size) === "string") {
              size = size;
              return this.$editor()
                .wrapSelection('insertText', size);
            }
          },
          options: attributes
          // TODO: Get data from backend
          // options: [{
          //     name: 'Email',
          //     value: '{{= email || "there"}}'
          //   }
          //   // ,
          //   {
          //             name: 'App Name',
          //             value: '{{app_name}}'
          //         }, {
          //             name: 'Last Name',
          //             value: '{{last_name}}'
          //         }, {
          //             name: 'Email',
          //             value: '{{email}}'
          //         }, {
          //             name: 'User Id',
          //             value: '{{user_id}}'
          //         }, {
          //             name: 'status',
          //             value: '{{status}}'
          //         }
          // ]
        });

        // add the button to the default toolbar definition
        taOptions.toolbar[1].push('dropdown');
        return taOptions;
      }
    ]);


  }
])



.run(['LoginService', 'ipCookie', '$log', 'login', '$rootScope',
  function (LoginService, ipCookie, $log, login, $rootScope) {

    // check cookie to set if user is authenticated
    if (ipCookie('loggedin')) {
      $log.info('loggedin cookie found to be true');
      // $log.info('app.run setUserAuthenticated');
      LoginService.setUserAuthenticated(true);
      login.setLoggedIn(true);
      $rootScope.loggedIn = true;
    }
  }
])

.run(['AccountService', 'AccountModel', '$log', '$rootScope',
  function (AccountService, AccountModel, $log, $rootScope) {
    AccountModel.get(function (err, acc) {
      if (err) {
        return;
      }
      console.log("accounts", acc);
      AccountService.set(acc);
    });
  }
])

// .run(['AppService', 'AppModel', '$log', 'appIdProvider', '$rootScope',
//     function (AppService, AppModel, $log, appIdProvider, $rootScope) {
//         if ($rootScope.loggedIn) {
//             AppModel.get(function (err, apps) {
//                 console.log("Run App", err, apps);
//                 if (err) {
//                     return;
//                 }
//                 AppService.setLoggedInApps(apps);
//                 // console.log("apps[0]: ", apps[0]);
//                 AppService.setCurrentApp(apps[0]);
//                 appIdProvider.setAppId(apps[0]._id);
//                 // console.log("AppIdProvider: ", appIdProvider.getAppId());
//                 // console.log("default app:", AppService.getCurrentApp());

//             });
//         }
//     }
// ])
.run(['$state', 'LoginService', '$rootScope',
  function ($state, LoginService, $rootScope) {

    // check if user needs to be logged in to view a specific page
    $rootScope.$on("$stateChangeStart", function (event,
      toState,
      toParams, fromState, fromParams) {
      if (toState.authenticate && !LoginService.getUserAuthenticated()) {
        // User isn’t authenticated
        $state.go("login");
        event.preventDefault();
      }
    });
  }
])

/*.run(['ThreadService', 'MsgService',
    function (ThreadService, MsgService) {
        window.location.pathname
    }
])*/

.run(['segment', 'queryMatching', 'countOfActions', 'hasNotDone',
  'hasDoneActions', 'modelsQuery', 'AppService',
  function (segment, queryMatching, countOfActions, hasNotDone,
    hasDoneActions, modelsQuery, AppService) {

    // FIXME : get data from backend


    var allSegments = [{
        _id: "0",
        name: "Users"
      }
      // , {
      //     _id: "1",
      //     name: "Phone Users"
      // }, {
      //     _id: "2",
      //     name: "Android Users"
      // }, {
      //     _id: "3",
      //     name: "Paying Customers"
      // }
    ];

    var allQueries = [{
      id: "0",
      name: "equal",
      key: 'eq'
    }, {
      id: "1",
      name: "contains",
      key: 'contains'
    }, {
      id: "2",
      name: 'more than',
      key: 'gt'
    }, {
      id: "4",
      name: 'less than',
      key: 'lt'
    }];



    var actions = [{
      name: 'Watched Intro Video'
    }, {
      name: 'Verified Email'
    }, {
      name: 'Integrated Google Analytics'
    }, {
      name: 'Visited dashboard more than 5 times'
    }, {
      name: 'Received their first email'
    }];


    // TODO: Get Data from Backend HTTP Request
    var allHasDoneActions = [{
      name: 'Watched Intro Video'
    }, {
      name: 'Verified Email'
    }, {
      name: 'Integrated Google Analytics'
    }, {
      name: 'Visited dashboard more than 5 times'
    }, {
      name: 'Received their first email'
    }];

    // TODO: Get Data from Backend HTTP Request
    var allHasNotDoneActions = [{
      name: 'Watched Intro Video'
    }, {
      name: 'Verified Email'
    }, {
      name: 'Integrated Google Analytics'
    }, {
      name: 'Visited dashboard more than 5 times'
    }, {
      name: 'Received their first email'
    }];

    // TODO: Get Data from Backend HTTP Request
    var allCountOfActions = [{
      name: 'Watched Intro Video'
    }, {
      name: 'Verified Email'
    }, {
      name: 'Integrated Google Analytics'
    }, {
      name: 'Visited dashboard more than 5 times'
    }, {
      name: 'Received their first email'
    }, {
      name: 'Page Views'
    }, {
      name: 'Session'
    }];

    segment.set.all(allSegments);

    queryMatching.set.all(allQueries);

    countOfActions.setCountOfActions(allCountOfActions);

    hasNotDone.setAllHasNotDoneActions(allHasNotDoneActions);
    // console.log("not has done: ", hasNotDone.getAllHasNotDoneActions());

    hasDoneActions.setAllHasDoneActions(allHasDoneActions);
    // console.log("has done: ", hasDoneActions.getAllHasDoneActions());
    // console.log("count of: ", countOfActions.getCountOfActions());

    /**
     * Set the first segmentation as the default selected segmentation
     */

    segment.set.selected(allSegments[0]);
    /**
     * Set the first query as the default selected query
     */

    queryMatching.set.selected(allQueries[0]);
  }
])

angular.element(document)
  .ready(function () {
    angular.bootstrap(document, ['dodatado']);
  });
