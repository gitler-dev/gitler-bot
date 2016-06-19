var simpleGit = require('simple-git-factory')

simpleGit.filesChangedHead = function(then){
  return this.filesChanged('HEAD','HEAD~1',then);
}

simpleGit.filesChanged = function(sha1, sha2, then) {
  return this.diff(['--stat',sha1,sha2], function (err, data) {
     then && then(err, !err && require('./DiffSummary').parse(data));
  });
}

module.exports = simpleGit;