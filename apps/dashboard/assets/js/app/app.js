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
    'do.signup'
])

.config(function myAppConfig($stateProvider, $urlRouterProvider,
    $locationProvider) {
    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
})

.run(['LoginService', 'ipCookie', '$log',
    function (LoginService, ipCookie, $log) {
    
    // check cookie to set if user is authenticated
    if (ipCookie('loggedin')) {
        // $log.info('app.run setUserAuthenticated');
        LoginService.setUserAuthenticated(true);
    }
}])

.run(['$state', 'LoginService', '$rootScope',
    function ($state, LoginService, $rootScope) {

        // check if user needs to be logged in to view a specific page
        $rootScope.$on("$stateChangeStart", function (event, toState,
            toParams, fromState, fromParams) {
            if (toState.authenticate && !LoginService.getUserAuthenticated()) {
                // User isn’t authenticated
                $state.go("login");
                event.preventDefault();
            }
        });
    }
])

.run(['segment', 'queryMatching',
    function (segment, queryMatching) {

        // FIXME : get data from backend
        var allSegments = [{
            _id: "0",
            name: "Phone Users"
        }, {
            _id: "1",
            name: "Android Users"
        }, {
            _id: "2",
            name: "Paying Customers"
        }];

        var allQueries = [{
            id: "0",
            name: "is"
        }, {
            id: "1",
            name: "is not"
        }, {
            id: "2",
            name: "contains"
        }, {
            id: "3",
            name: "does not contain"
        }];

        segment.set.all(allSegments);

        queryMatching.set.all(allQueries);

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