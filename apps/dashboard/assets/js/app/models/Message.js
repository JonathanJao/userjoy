angular.module('models.message', ['services'])

.service('MsgService', ['$http', 'config', 'AppService',
    'InboxMsgService', '$modal',
    function ($http, config, AppService, InboxMsgService, $modal) {
        this.sendManualMessage = function (sub, text, uid) {
            console.log("uid: ", uid)
            var data = {
                sName: 'Savinay',
                sub: sub,
                text: text,
                type: 'email',
                uid: '536205285617b6cd4fbd848a'
            }
            console.log("message data: ", data);
            console.log("LIAS", AppService.getCurrentApp());
            var appId = AppService.getCurrentApp()
                ._id;


            $http.post(config.apiUrl + '/apps/' + appId + '/messages',
                data)
                .success(function (data) {
                    console.log("success");

                })
                .error(function () {
                    console.log("error");
                })

        };

        this.getManualMessage = function (appId) {
            console.log("going to fetch msgs");
            $http.get(config.apiUrl + '/apps/' + appId + '/messages')
                .success(function (data) {
                    console.log("success getting messages");
                    InboxMsgService.setInboxMessage(data);
                    console.log("setting msg: ", InboxMsgService.getInboxMessage());
                })
                .error(function () {
                    console.log("error");
                })
        };
    }
])