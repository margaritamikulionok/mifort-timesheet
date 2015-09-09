'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'myApp.login',
    'myApp.timelog',
    'myApp.timesheetManagement',
    'myApp.projectReport',
    'myApp.projectManagement',
    'myApp.peopleReport',
    //'preferences',
    'angularMoment'
])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});
    }])

    .controller('myAppController', ['$scope', '$location', 'loginService', '$cookies', function ($scope, $location, loginService, $cookies) {
        if($cookies.get('user')){
            $scope.isLoggedIn = true;
        }
        else{
            $location.path('/login');
        }

        $scope.logout = function () {
            $cookies.remove('user');
            $location.path('/login');
        }
    }]);