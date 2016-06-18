var http = require('http')
var createHandler = require('github-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: 'myhashsecret' })

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(4567)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('push', function (event) {
  //RECEIVED PUSH EVENT
  var repoName = event.payload.repository.name

  console.log('Received a push event for %s to %s', repoName, event.payload.ref);

  var fs = require('fs');
  var simpleGit = require('simple-git')( workingDirPath );


  //Check if repository is cloned
  fs.access(path, fs.F_OK, function(err) {
      if (!err) {
            // repo exists - pull
            simpleGit.pull(function(err, update) {
              if(update && update.summary.changes) {
                 require('child_process').exec('npm restart');
              }
            });
        } else {
            // repo does not exist - clone
            simpleGit.clone(repoPath, localPath, handlerFn)
        }
    });
  
  
});

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
})

console.log("listening for webhooks...");