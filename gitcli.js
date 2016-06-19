var simpleGit = require('./simple-git-factory.js')
var _ = require('underscore')
var fs = require('fs')
var Promise = require('bluebird')

 

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

function getFilesChanged(repoDir, ref1, ref2,cb) {
	simpleGit(repoDir).filesChanged(ref1, ref2, function(err, diff){
	if (err) 
		cb(null);
	
	if (!diff) 
		cb(null);
	var filesMap = _.map(diff.files, function(file){
		return {file: file.file, body: fs.readFileSync(repoDir + '/' + file.file, "utf-8")}
    })
	
	cb(filesMap)
	})	
}

exports.getFilesChangedFromGit = getFilesChangedFromGit
exports.getFilesChanged = getFilesChanged
