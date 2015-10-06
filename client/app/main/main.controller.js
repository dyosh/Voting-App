'use strict';

angular.module('myYoAppApp')
  .controller('MainCtrl', function ($scope, $http, $location, Auth, $rootScope) {
    $scope.awesomeThings = [];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    var reset = function() {
      $scope.dummyPoll = {
        title: "What is your favorite brand of soda?",
        options: [
          {option: "coke", count: 0}, 
          {option: "pepsi", count: 0}
        ]
      };

      $scope.poll = {
        title: "",
        options: [
          {option: "", count: 0 },
          {option: "", count: 0 },
        ],
        votedUsers: []
      };      
    };

    // called to populate empty poll on launch
    reset();

    $scope.newPoll = function() {
      $scope.showGraph = false;
      reset();
    };

    $scope.addPoll = function() {
      $scope.showGraph = false;

      $http.post('/api/polls', $scope.poll).success(function(poll){
        $scope.poll = poll;
      });
      $scope.pollPosted = true;
    };

    $scope.getPolls = function() {
      $scope.showGraph = false;

      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
        $scope.showPolls = true;
      });
    };

    $scope.deletePoll = function(id) {
      $http.delete('/api/polls/' + id).success(function() {
        $scope.getPolls();
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

    $scope.addVoteCount = function(index) {
      
      var updatedPoll = $scope.poll;
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
        $http.put('/api/polls/' + $scope.poll._id, updatedPoll).success(function(updatedPoll) { 
          console.log("the poll item has been updated");
          console.log(updatedPoll);
          $scope.poll = updatedPoll;

          $scope.showPollDetails($scope.poll._id);

          $scope.pollPosted = false;
          $scope.showGraph = true;
        });
      }

    };

    var userHasVoted = function(poll) {
      if (poll.votedUsers.indexOf($scope.getCurrentUser()._id) > -1) {
        return true;
      } else {
        return false;
      }
    };

    $scope.showPollDetails = function(id) {
      $scope.showPolls = false; // need a better way, this method of show/hide becomes more confusing as num grows
      // grab the poll matching the given id from the db
      $http.get('/api/polls/' + id).success(function(poll) {
        $scope.poll = poll;

        // check to see if the user has already voted on the poll
        $scope.displayVoteChoice = userHasVoted($scope.poll);

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
                           // vAxis: {minValue:0, maxValue: 10},
                           // 'width': 700,
                           // 'height': 500 };

            // Instantiate and draw our chart, passing in some options
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(data, options);
            window.scrollTo(0, document.body.scrollHeight);
          
          }

        });        
      });
      $scope.showGraph = true;

    };

  });
