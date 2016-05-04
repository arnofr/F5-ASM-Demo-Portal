var app = angular.module('AsmPortal', ['ui.router','ngMaterial','md.data.table','ngMessages']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('index', {
    url: '/index',
    templateUrl: 'index.html',
    controller: 'MainCtrl',
    onEnter: ['$state', 'auth', function($state, auth){
      if(auth.isLoggedIn()){
        $state.go('category');
      } else {
        $state.go('login');
      }
    }]
  })
  .state('category', {
      url: '/category',
      templateUrl: 'categories.html',
      controller: 'MainCtrl',
      resolve: {
        categoriesPromise: ['urlcategories', function(urlcategories){
          return urlcategories.getAll();
        }]
      },
      onEnter: ['$state', 'auth', function($state, auth){
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]

    })
    .state('category.urlcategories', {
      url: '/urlcategories/{id}',
      templateUrl: '/urlcategories.html',
      controller: 'UrlcategoriesCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]
    })
    .state('apmmgt', {
      url: '/apmmgt',
      templateUrl: '/apmmgt.html',
      controller: 'APMmgtCtrl',
      resolve: {
        groupsPromise: ['groups', function(groups){
          return groups.getAll();
        }]
      }
    });

    $urlRouterProvider.otherwise('index');
  }]);


app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.currentUser = auth.currentUser;
    //$scope.logOut = auth.logOut;
  }]);

app.factory('urlcategories', ['$http', 'auth', function($http, auth){
  var o = {
    urlcategories: ["{dummy empty}"]
  };
  //create a category ------ to be tested, no functionnal , dont use ...
  o.create = function(urlcategory) {
    return $http.post('/urlcategories', urlcategory, {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
      o.urlcategories.push(data);
    });
  };
  //get all categories
  o.getAll = function() {
      $http.get('/urlcategories', {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
        angular.copy(data.data, o.urlcategories);
    });

  };
  //adding url to a category
  o.addurl = function(urlcategory,arrayid,url) {
    return $http.put('/urlcategories/'+urlcategory._id,{url: url.name}, {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
      angular.copy(data.data.urls,o.urlcategories[arrayid].urls);
    });
  }
  o.removeurl = function(urlcategory,arrayid,urlid) {
    return $http.delete('/urlcategories/'+urlcategory._id+"/"+urlid, {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
      angular.copy(data.data.urls,o.urlcategories[arrayid].urls);
    });
  }
  o.pushcategorytoapm = function(category) {

    return $http.get('/updateapmcategory/'+category, {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
      if (data.data != "{OK}") {
        showSimpleToast('top right',"Error, cannot update category on APM");
      } else {
        showSimpleToast('top right',"Category updated successfully on APM");
      }
    }, function(data){
        showSimpleToast('top right',"Error, Error, cannot update category on APM");
    })
  };
    o.pullcategoryfromapm = function(category,arrayid) {
      return $http.get('/getapmcategory/'+category, {headers: {Authorization: 'Bearer '+auth.getToken()}}).then(function(data){
        if (data.data != "{KO}") {
          angular.copy(data.data,o.urlcategories[arrayid].urls)
          //data is the category.urls part
            showSimpleToast('top right',"Retrieval successfull from APM");
        } else {
          //something bad happened
          //get working but error code back KO
            showSimpleToast('top right',"Cannot retrieve configuration from APM");
        }
      }, function(data){
          // get no working ?
          showSimpleToast('top right',"Cannot retrieve configuration from APM");
      });
    };

  return o;
}]);


app.controller('UrlcategoriesCtrl', [
  '$scope',  '$stateParams',  'urlcategories',  '$animate',  'auth', '$mdDialog','$mdToast',
  function($scope, $stateParams, urlcategories, $animate,auth,$mdDialog,$mdToast){
    $scope.urlcategory = urlcategories.urlcategories[$stateParams.id];
    $scope.newurl={};
    $scope.newurl.urlname="";
    $scope.urlalert="";
    $scope.showhint=false;
    //md-toast function
    showSimpleToast = function(position,message) {
      $mdToast.show(
        $mdToast.simple()
          .textContent(message)
          .position(position )
          .hideDelay(3000)
      );
    };
    //md-dialog to push to apm
    $scope.showConfirmpush = function(ev) {
      var confirm = $mdDialog.confirm()
            .title('Update '+ $scope.urlcategory.name+' to APM')
            .textContent('This will overwrite this APM category configuration')
            .ariaLabel('Push to APM')
            .targetEvent(ev)
            .ok("Let's do it!")
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            //if confirm
            urlcategories.pushcategorytoapm($scope.urlcategory._id);

        }, function() {
            //do nothing on cancel
            //$scope.status = 'You decided to keep your debt.';
          });
    };
    //end md-dialog
    //md-dialog to pull from apm
    $scope.showConfirmpull = function(ev) {

      var confirm = $mdDialog.confirm()
            .title('Update '+ $scope.urlcategory.name+' from APM')
            .textContent('This will overwrite this category configuration')
            .ariaLabel('Pull from APM')
            .targetEvent(ev)
            .ok("Let's do it!")
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            //if confirm
            urlcategories.pullcategoryfromapm($scope.urlcategory._id,$stateParams.id);

        }, function() {
          //do nothing on cancel
          //$scope.status = 'You decided to keep your debt.';
        });
    };
    //end md-dialog


    $scope.addUrl = function(form){
      //checing if requested url already exists
      //blocking to be modified
      function isurlpresent(arrayofjsonurl,lookedurl) {
        for(var k in arrayofjsonurl) {
          if(arrayofjsonurl[k].name == lookedurl) {
            $scope.urlalert="The requested url is already present in this category";
            return 1;
          }
        }

        return 0;
      };// function isurlpresent

      //validation
      if( isurlpresent($scope.urlcategory.urls,$scope.newurl.urlname)) {
        showSimpleToast("top right","Url already present")
        return;
      }

      //we call the function with urlcategory , urlcategory array number in urlcaterories, form parm containing url
      urlcategories.addurl($scope.urlcategory,$stateParams.id,{name:$scope.newurl.urlname });
      $scope.newurl.urlname="";
    //  $scope.newUrlform.$error=null;


    };
    $scope.removeUrl = function(urlid){

      urlcategories.removeurl($scope.urlcategory,$stateParams.id,urlid);
      $scope.newurl.name="";
    };
}]);

app.controller('MainCtrl', [
  '$scope','urlcategories','acls','auth',
  function($scope,urlcategories,acls,auth){

  $scope.urlcategories = urlcategories.urlcategories;
  $scope.menufabisOpen = true;
  $scope.isAdmin = auth.isAdmin;

  $scope.acls = acls.acls;
}]);
