angular.module('dodatado', [
    'ui.bootstrap',
    'ui.router',
    // 'ngSails',
    'ivpusic.cookie',
    'angularMoment',
    'lodash',
    'services',
    'models',
    'ngTable',
    'mgcrea.ngStrap',
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
    'do.automate'
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

.config(function ($stateProvider, $urlRouterProvider,
    $locationProvider, $httpProvider, $provide, $momentProvider,
    loginProvider) {

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

    $httpProvider.interceptors.push(function ($rootScope, $location, $q) {
        return {
            'responseError': function (rejection) {
                // if we're not logged-in to the web service, redirect to login page
                if (rejection.status === 401 && $location.path() !=
                    '/login') {
                    console.log("401 status logout");
                    loginProvider.setLoggedIn = false;
                    $location.path('/login');
                }
                return $q.reject(rejection);
            }
        };
    });

    // adding custom tool to textAngular
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate',
        function (taRegisterTool, taOptions) {
            // $delegate is the taOptions we are decorating
            // register the tool with textAngular
            taRegisterTool('dropdown', {
                display: "<span class='dropdown'>" +
                    "<button class='btn btn-default dropdown-toggle' type='button' ng-disabled='showHtml()'><i class='fa fa-caret-down'></i></button>" +
                    "<ul class='dropdown-menu'><li ng-repeat='o in options' ng-model='o.value' ng-click='action(o.value)'>{{o.name}}</li></ul>" +
                    "</span>",
                action: function (size) {
                    if (size !== '' && typeof (size) === "string") {
                        size = size + " ";
                        return this.$editor()
                            .wrapSelection('insertText', size);
                    }
                },
                // TODO: Get data from backend
                options: [{
                    name: 'App Name',
                    value: '{{app_name}}'
                }, {
                    name: 'First Name',
                    value: '{{first_name}}'
                }, {
                    name: 'Last Name',
                    value: '{{last_name}}'
                }, {
                    name: 'Email',
                    value: '{{email}}'
                }, {
                    name: 'User Id',
                    value: '{{user_id}}'
                }, {
                    name: 'status',
                    value: '{{status}}'
                }]
            });

            // add the button to the default toolbar definition
            taOptions.toolbar[1].push('dropdown');
            return taOptions;
        }
    ]);


})

/*.service('api', ['authService', '$rootScope', '$location',
    function () {
        $rootScope.$on('event: auth-loginRequired', function () {
            $location.path('/login');
        })
    }
])*/

.run(['LoginService', 'ipCookie', '$log',
    function (LoginService, ipCookie, $log) {

        // check cookie to set if user is authenticated
        if (ipCookie('loggedin')) {
            // $log.info('app.run setUserAuthenticated');
            LoginService.setUserAuthenticated(true);
        }
    }
])

.run(['AccountService', 'AccountModel', '$log',
    function (AccountService, AccountModel, $log) {
        AccountModel.get(function (err, acc) {
            if (err) {
                return;
            }
            console.log("accounts", acc);
            AccountService.set(acc);
        });
    }
])

.run(['AppService', 'AppModel', '$log',
    function (AppService, AppModel, $log) {
        AppModel.get(function (err, apps) {
            console.log("apps log", err, apps);
            if (err) {
                console.log("err apps: ", err);
                return;
            }
            AppService.setLoggedInApps(apps);
            AppService.setCurrentApp(apps[0]);
            console.log("default app:", AppService.getCurrentApp());
        });
    }
])
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

.run(['ThreadService', 'MsgService',
    function (ThreadService, MsgService) {
        window.location.pathname
    }
])

.run(['segment', 'queryMatching', 'countOfActions', 'hasNotDone',
    'hasDoneActions',
    function (segment, queryMatching, countOfActions, hasNotDone,
        hasDoneActions) {

        // FIXME : get data from backend
        var allSegments = [{
            _id: "0",
            name: "Users"
        }, {
            _id: "1",
            name: "Phone Users"
        }, {
            _id: "2",
            name: "Android Users"
        }, {
            _id: "3",
            name: "Paying Customers"
        }];

        var allQueries = [{
            id: "0",
            name: "equal",
            key: 'eq'
        }, {
            id: "1",
            name: "does not equal",
            key: 'any'
        }, {
            id: "2",
            name: "contains",
            key: 'cn'
        }, {
            id: "3",
            name: "does not contain",
            key: 'ncn'
        }, {
            id: "4",
            name: 'greater than',
            key: 'gt'
        }, {
            id: "5",
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
        console.log("not has done: ", hasNotDone.getAllHasNotDoneActions());

        hasDoneActions.setAllHasDoneActions(allHasDoneActions);
        console.log("has done: ", hasDoneActions.getAllHasDoneActions());
        console.log("count of: ", countOfActions.getCountOfActions());

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


.controller('AppCtrl', function AppCtrl($scope) {

});