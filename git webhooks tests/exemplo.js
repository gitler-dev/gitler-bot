var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'myhashsecret' });
var fs = require('fs');
var process = require("process");

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
  //RECEIVED PUSH EVENT
  var reposDir = "repos";
  var repoName = event.payload.repository.name;
  var repoPath = reposDir + "/" + repoName;
  var repoRef = event.payload.ref;
  var repoGitUrl = event.payload.repository.html_url + ".git";
  var repoBranch = repoRef.substr(repoRef.lastIndexOf("/")+1,repoRef.length);

  console.log('Received a push event for %s to %s', repoName, repoRef );

  var simpleGit = require('simple-git')( reposDir );


  //check if repos folder exists
  fs.access(reposDir, fs.F_OK, function(err) {
    if (err) {
          // repos folder doesnt exist, create it
          var mkdirp = require('mkdirp');
          mkdirp(reposDir, function(err) {});
      }
  });
  //chdir to repos dir
  process.chdir(reposDir);

  //Check if repository is clone
  fs.access(repoPath, fs.F_OK, function(err) {
    if (!err) {
          // repo exists
          console.log("git repotory exists");

          //chdir
          process.chdir(repoName);

          //checkout
          console.log("checking out " + repoBranch);
          simpleGit.checkout( repoBranch ,  function(){});

          //pull
          console.log("pulling from origin " + repoBranch)
          simpleGit.pull( "origin" , repoBranch ,  function(){});

      } else {
          // repo does not exist
          console.log("git repotory does not exists");

          //clone
          console.log("cloning repository: " + repoGitUrl);
          simpleGit.clone(repoGitUrl, repoName, function(){});

          //chdir
          process.chdir(repoName);

          //checkout
          console.log("checking out " + repoBranch);
          simpleGit.checkout( repoBranch,  function(){});

          //pull
          console.log("pulling from origin " + repoBranch);
          simpleGit.pull( "origin" , repoBranch ,  function(){});
      }
  });


})

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title);
})

console.log("listening for webhooks...");