'use strict';

angular.module('myYoAppApp')
  .controller('MainCtrl', function ($scope, $http, $location, Auth, $rootScope) {
    $scope.awesomeThings = [];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $rootScope.getCurrentUser = Auth.getCurrentUser;

    console.log("USER NAME BELOW THIS");
    console.log($rootScope.getCurrentUser().name);


    var reset = function() {
      $scope.dummyPoll = {
        title: "What is your favorite brand of soda?",
        author: $rootScope.getCurrentUser()._id,
        username: $rootScope.getCurrentUser().name,
        options: [
          {option: "coke", count: 0}, 
          {option: "pepsi", count: 0}
        ]
      };

      $scope.poll = {
        title: "",
        author: $rootScope.getCurrentUser()._id,
        username: $rootScope.getCurrentUser().name,
        options: [
          {option: "", count: 0 },
          {option: "", count: 0 },
        ],
        votedUsers: []
      };      
    };

    // called to populate empty poll on launch
    reset();
    console.log("reset called");
    console.log($scope.poll);

    $scope.newPoll = function() {
      $scope.showGraph = false;
      reset();
    };

    $scope.addPoll = function() {
      $scope.showGraph = false;

      // if an unregistered or not logged in user creates a poll
      if ($scope.poll.name === undefined) {
        $scope.poll.name = 'anonymous';
      }

      $http.post('/api/polls', $scope.poll).success(function(poll){
        $scope.poll = poll;
      });
      $scope.pollPosted = true;
    };

    $scope.getUserPolls = function() {
      $scope.showGraph = false;

      $scope.isUserPoll = true;
      // console.log($scope.getCurrentUser()._id);
      $http.get('/api/polls/userpolls/' + $scope.getCurrentUser()._id).success(function(polls) {
        $scope.polls = polls;
        $scope.showPolls = true;
      });
    };

    $scope.getPolls = function() {
      $scope.showGraph = false;
      $scope.isUserPoll = false;

      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
        $scope.showPolls = true;
      });
    };

    $scope.sharePollPage = function(idPoll) {
      $scope.showPollDetails(idPoll);        
      var url = $location.url('/polls/' + idPoll);
    };

    $scope.deletePoll = function(id) {
      $http.delete('/api/polls/' + id).success(function() {
        $scope.getUserPolls();
      });
    };

    $scope.signUp = function() {
      $location.path('/signup');
    };

    $scope.removeOption = function(index) {      
      if ($scope.poll.options.length > 2) {
        $scope.poll.options.splice(index, 1);
        $scope.dummyPoll.options.splice(index, 1);
      }
    };

    $scope.addOption = function() {
      $scope.poll.options.push({option: "", count: 0});
      $scope.dummyPoll.options.push({option: "new option", count: 0});
    };  

    $scope.addVoteCount = function(index, poll) {
      console.log("addVoteCount called");
      console.log(poll);
      var updatedPoll = poll;
      // check to see if this user has already voted

      if (updatedPoll.votedUsers.indexOf($scope.getCurrentUser()._id) > -1) {
        // user already voted on this poll
        return;
      } else {
        // add username to votedUser array
        updatedPoll.votedUsers.push($scope.getCurrentUser()._id);
        // update count value
        updatedPoll.options[index].count++;
        // update changes to the db 
        $http.put('/api/polls/' + poll._id, updatedPoll).success(function(updatedPoll) { 
          console.log("the poll item has been updated");
          console.log(updatedPoll);
          $scope.poll = updatedPoll;

          $rootScope.sharedPoll = updatedPoll;  // allows user to vote on /polls/:pollid page

          $scope.showPollDetails($scope.poll._id);


          $scope.pollPosted = false;
          $scope.showGraph = true;
        });
      }

    };

    var userHasVoted = function(poll) {
      if (poll.votedUsers.indexOf($rootScope.getCurrentUser()._id) > -1) {
        return true;
      } else {
        return false;
      }
    };

    $scope.showPollDetails = function(id) {
      $rootScope.invalidPoll = false;
      $rootScope.graphLoading = true;
      $scope.showPolls = false; // need a better way, this method of show/hide becomes more confusing as num grows
      // grab the poll matching the given id from the db
      $http.get('/api/polls/' + id).success(function(poll) {
        console.log("GET poll called");
        console.log(poll);
        $scope.poll = poll;
        $rootScope.sharedPoll = poll; // // allows user to vote on /polls/:pollid page

        // check to see if the user has already voted on the poll
        $rootScope.displayVoteChoice = userHasVoted(poll);

        google.load('visualization', '1', {packages: ['corechart', 'bar'],
          callback: function() {

            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Option');
            data.addColumn('number', 'Votes');
            var info = [];

            for (var n in poll.options) { 
              info.push([poll.options[n].option, poll.options[n].count]);
            }

            data.addRows(info);

            // Set chart options
            var options = {'animation': {
                             'startup': true,
                             duration: 1000,
                             easing: 'out', 
                           }
                          };
                           // vAxis: {minValue: 0, maxValue: 10},
                           // 'width': 700,
                           // 'height': 500 };

            // Instantiate and draw our chart, passing in some options
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(data, options);
            window.scrollTo(0, document.body.scrollHeight);
          
          }

        });        
      }).error(function(err) {
        $rootScope.invalidPoll = true;
        console.log(err);
      });
      $scope.showGraph = true;

    };

    // $rootScope.graphLoading = false;
    if ($location.path().indexOf('/polls/') !== -1 && !$rootScope.graphLoading) {
      var idPoll = $location.path().slice(7, $location.path().length);
      console.log("GRAPH NOT LOADING");
      console.log(idPoll);
      $scope.showPollDetails(idPoll);

    } else {
      console.log("no");
    }

  });
