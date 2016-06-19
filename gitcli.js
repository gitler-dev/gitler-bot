var simpleGit = require('simple-git')
var _ = require('underscore')
var fs = require('fs')
var Promise = require('bluebird')

simpleGit.filesChanged

function getFilesChangedFromGit(repoDir, ref1, ref2) {

	return new Promise(function(res, rej){
		simpleGit(repoDir).filesChanged(ref1, ref2, function(err, diff){
			if (err) return null;
			
			if (!diff) rej("no")
			var filesMap = _.map(diff.files, function(file){
				return {file: file.file, body: fs.readFileSync(repoDir + '/' + file.file, "utf-8")}
	        })
			
			res(filesMap)
		})

	})
		
}




getFilesChangedFromGit(__dirname, "HEAD", "HEAD~10").then(function(files){
	console.log(files + "ngr")
})

exports.getFilesChangedFromGit = getFilesChangedFromGit