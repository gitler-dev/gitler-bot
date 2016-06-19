var simpleGit = require('simple-git')

var diffSummary = require('./node_modules/simple-git/src/DiffSummary.js')

var repoDir



var filesChangedHead = function(then){
  return this.filesChanged('HEAD','HEAD~1',then);
}

var filesChanged = function(sha1, sha2, then) {
  return this.diff(['--stat',sha1,sha2], function (err, data) {
     then && then(err, !err && diffSummary.parse(data));
  });
}

function init(_repoDir) {
	repoDir = _repoDir
	var me = simpleGit(repoDir)
	me.filesChangedFromGit = filesChangedHead
	me.filesChanged = filesChanged

	debugger

	return me
}


module.exports = init;
