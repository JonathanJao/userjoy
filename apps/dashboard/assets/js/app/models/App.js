angular
    .module('models.apps', ['services'])
    .service('AppModel', ['$http', 'config', '$state', 'AppService',
        '$location',
        function ($http, config, $state, AppService, $location) {

            this.get = function (cb) {

                $http
                    .get(config.apiUrl + '/apps')
                    .success(function (data) {
                        cb(null, data);
                    })
                    .error(cb);

            };

            this.getSingleApp = function (appId, cb) {
                $http.get(config.apiUrl + '/apps/' + appId)
                    .success(function(data) {
                        console.log("current App: --> from App Model: ", data);
                        AppService.setCurrentApp(data);
                        cb();
                    })
                    .error(cb);
            }


            this.updateName = function (name, appId, cb) {

                var data = {
                    name: name
                };

                var putUrl = config.apiUrl + '/apps/' + appId + '/name';

                $http
                    .put(putUrl, data)
                    .success(function (data) {
                        cb(null, data);
                    })
                    .error(cb)

            }

            this.addNewApp = function (data) {
                $http
                    .post(config.apiUrl + '/apps', data)
                    .success(function (savedApp) {
                        $state.transitionTo('addcode');
                        AppService.new(savedApp);
                        AppService.setCurrentApp(savedApp);
                        console.log("apps created: ", AppService.getLoggedInApps(),
                            savedApp);
                    })
            }

            this.addNewMember = function (data, appId, cb) {
                $http.post(config.apiUrl + '/apps/' + appId + '/invites',
                    data)
                    .success(function (data) {
                        console.log("success");
                        cb();
                    })
                    .error(cb);

            }

            this.redirectUser = function (appId, inviteId, cb) {
                $http.get(config.apiUrl + '/apps/' + appId + '/invites/' +
                    inviteId)
                    .success(function (data) {
                        console.log("data: ", data);
                        AppService.setEmail(data.email);
                        if (data.message == 'REDIRECT_TO_SIGNUP') {
                            $location.path('/signup');
                        }

                        if (data.message == 'IS_TEAM_MEMBER') {
                            $location.path('/login');
                        }

                        if (data.message == 'REDIRECT_TO_LOGIN') {
                            $location.path('/login');
                        }
                        cb();
                    })
                    .error(cb);
            }
        }
    ])