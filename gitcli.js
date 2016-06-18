var simpleGit = require('simple-git')( __dirname ).filesChangedHead(function(err, diff) {
		diff.files.forEach(function(file){
        	console.log(file.file)
        })
      });


hebhook.onPr(function(pr,ref){
	git.filesChanged(ref,'master',function(err,diff)
	{
		diff.files.forEach(function(file){
        	console.log(file.file)
        })
	});
});