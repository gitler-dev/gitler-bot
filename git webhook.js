var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'myhashsecret' });
var fs = require('fs');
var process = require("process");
var SimpleGit = require('simple-git');

var reposDir = "repos";

//check if repos folder exists
fs.access(reposDir, fs.F_OK, function(err) {
  if (err) {
      // repos folder doesnt exist, create it
      var mkdirp = require('mkdirp');
      mkdirp(reposDir, function(err) {});
    }
});

//start http server
http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404;
    res.end('no such location');
  })
}).listen(4567);

handler.on('error', function (err) {
  console.error('Error:', err.message);
});

handler.on('push', function (event) {

  //--------------------------------------------- RECEIVED PUSH EVENT -----------------------------------------------------

  var repoName = event.payload.repository.name;
  var repoPath = reposDir + "/" + repoName;
  var repoRef = event.payload.ref;
  var repoGitUrl = event.payload.repository.html_url + ".git";
  var repoBranch = repoRef.substr(repoRef.lastIndexOf("/")+1,repoRef.length);

  console.log('Received a push event for %s to %s', repoName, repoRef );

  var simpleGit = SimpleGit(repoPath);



  //Check if repository is cloned
  fs.access(repoPath, fs.F_OK, function(err) {
    if (!err) {
          // repo exists
          console.log("git repository exists");
          checkout_and_pull();
      } else {
          // repo does not exist
          console.log("git repository does not exists");
          //clone
          console.log("cloning repository: " + repoGitUrl);
          simpleGit.clone(repoGitUrl, repoPath, function(){
              simpleGit = SimpleGit(repoPath);
              checkout_and_pull();
            });
      }
  });
  
  var checkout_and_pull = function(){

    //checkout
    console.log("checking out " + repoBranch);
    simpleGit.checkout( repoBranch,  function(err){
      if(!err){
        //pull
        console.log("pulling from origin " + repoBranch);
        simpleGit.pull( "origin" , repoBranch ,  function(err){
          if(!err){
            console.log("pull finished");
          } else {
            console.log(err);
          }
          
        });
      } else {
        console.log(err);
      }
    });
  }

});



handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title);
})

console.log("listening for webhooks...");