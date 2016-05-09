var app = angular.module('AsmPortal', ['ui.router','ngMaterial','md.data.table','ngMessages']);

app.config(['$stateProvider','$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('index', {
    url: '/index',
    templateUrl: 'index.html',
    controller: 'MainCtrl',
    onEnter: ['$state', function($state){
      $state.go('policies');
    }]
  })
  .state('policies', {
      url: '/policies',
      templateUrl: 'policies.html',
      controller: 'PoliciesCtrl',
      resolve: {
        policiesPromise: ['policies', function(policies){
          return policies.getAll();
        }],
        signaturesPromise : ['policies', function(policies){
          return policies.allSignatureSet();
        }]
      }
    })
    .state('policies.editpolicy', {
      url: '/{id}',
      templateUrl: '/editpolicy.html',
      controller: 'PolicyCtrl',
      //params : { policyid : "default" },
      resolve: { policiesPromise: ['policies','$stateParams', function(policies,$stateParams){
          return policies.getSignatureSets($stateParams.id);
        }]
      }//resolve
    });

    $urlRouterProvider.otherwise('index');
  }]);

app.controller('PolicyCtrl', [ '$scope','$mdToast','$mdDialog','policies' ,'$stateParams', function($scope,$mdToast,$mdDialog,policies,$stateParams){
  //setting current policy for edit policy page
  $scope.currentpolicy= {};
  $scope.signaturesets= {};
  //policies.getSignatureSet($stateParams.id);
  $scope.currentpolicy=policies.policies[$stateParams.id];
  //console.log(policies.signatureSets);
  $scope.signaturesets=policies.signatureSets;
  //console.log(policies.policies);

  //md-toast function
  showSimpleToast = function(position,message) {
    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .position(position )
        .hideDelay(3000)
    );
  };

  console.log($scope.currentpolicy);

  //md-dialog to push signatures sets to asm
  $scope.showConfirmasmpush = function(ev) {

    var confirm = $mdDialog.confirm()
          .title('Push signatures to ASM')
          .textContent('This will overwrite this policy signatures sets configuration')
          .ariaLabel('Push configuration to ASM')
          .targetEvent(ev)
          .ok("Let's do it!")
          .cancel('Cancel');
      $mdDialog.show(confirm).then(function() {
          //if confirm
          policies.pushsignaturestopolicy($scope.currentpolicy.id,$scope.currentpolicy.signatureSets,$scope.currentpolicy.name) ;
      }, function() {
          //do nothing on cancel
          //$scope.status = 'You decided to keep your debt.';
        });
  };
  //end md-dialog

  //md-dialog to pull signatures sets from asm
  $scope.showConfirmasmpull = function(ev) {

    var confirm = $mdDialog.confirm()
          .title('Pull signatures from ASM')
          .textContent('This will retrieve signatures sets configuration from ASM')
          .ariaLabel('Pull configuration from ASM')
          .targetEvent(ev)
          .ok("Let's do it!")
          .cancel('Cancel');
      $mdDialog.show(confirm).then(function() {
          //if confirm
          policies.updateSignatureSets($stateParams.id) ;
      }, function() {
          //do nothing on cancel
          //$scope.status = 'You decided to keep your debt.';
        });
  };
  //end md-dialog

  $scope.sigactive = function(item) {
    //console.log("sigactive ? "+item);
    if ($scope.currentpolicy.signatureSets != undefined && $scope.currentpolicy.signatureSets.length != 0)  {
      return $scope.currentpolicy.signatureSets.indexOf(item) > -1;
    } else return 0;
  };//end sigactive

  $scope.togglesig = function (item) {
    var idx = $scope.currentpolicy.signatureSets.indexOf(item);
    if (idx > -1) {
      $scope.currentpolicy.signatureSets.splice(idx, 1);
    }
    else {
      $scope.currentpolicy.signatureSets.push(item);
    }
  };//end togglesig
}]); //end controller PolicyCtrl

app.factory('policies', ['$http', function($http){
  var p = {
    signatureSets : [],
    policies : []
  };
  //get all policy names
  p.getAll = function() {
    $http.get('/getpolicies').then(function(data){
      angular.copy(data.data, p.policies);
    });
  };
  //list all systema available sets
  p.allSignatureSet = function () {
    $http.get('/allsignatures/').then(function(data){
      angular.copy(data.data, p.signatureSets);
    });
  }
  //get system-signature assigned to a policy signature-sets
  p.getSignatureSets = function (policyarrayid) {
    if (p.policies[policyarrayid].signatureSets == undefined) {
      console.log("signatureSets is undefined, retrieving")
      $http.get('/getsignatures/'+p.policies[policyarrayid].id).then(function(data){
        p.policies[policyarrayid].signatureSets=[];
        showSimpleToast('top right',"Policy Signatures retrieved successfully from ASM");
        angular.copy(JSON.parse(data.data), p.policies[policyarrayid].signatureSets);
      }, function(data) {
        showSimpleToast('top right',"Error, cannot retrieve policy signatures on ASM");
      })
    }
  };
  p.updateSignatureSets = function (policyarrayid) {
      $http.get('/getsignatures/'+p.policies[policyarrayid].id).then(function(data){
        p.policies[policyarrayid].signatureSets=[];
        showSimpleToast('top right',"Policy Signatures retrieved successfully from ASM");
        angular.copy(JSON.parse(data.data), p.policies[policyarrayid].signatureSets);
      }, function(data) {
        showSimpleToast('top right',"Error, cannot retrieve policy signatures on ASM");
      })
  };
  //update a policy signature sets
  p.pushsignaturestopolicy = function (currentpolicyid,signaturesets,policyname) {
    return $http.put('/pushsignaturestopolicy/'+currentpolicyid,{'newsigset': signaturesets,'policyname' :policyname}).then(function(data){
      if (data.data != "{OK}") {
        showSimpleToast('top right',"Error, cannot update policy signatures on ASM");
      } else {
        showSimpleToast('top right',"Policy Signatures updated successfully on ASM");
      }
    } , function(data) {
      showSimpleToast('top right',"Error, cannot update policy signatures on ASM");
    })
  };

  return p;
}]); //end factory Policies

app.controller('PoliciesCtrl', [ '$scope','$mdToast','policies' , function($scope,$mdToast,policies){
$scope.policies = policies.policies;



}]); //end controller PoliciesCtrl

/*
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
*/
app.controller('MainCtrl', ['$scope', '$mdToast', function($scope,$mdToast){
  $scope.menufabisOpen = true;

  $scope.apm={};
  $scope.apm.name ="myapm";
  $scope.apm.ip="192.168.142.15";
  $scope.apm.username="admin";
  $scope.apm.password="admin";

  //md-toast function
  showSimpleToast = function(position,message) {
    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .position(position )
        .hideDelay(3000)
    );
  };


}]); //end controller MainCtrl
