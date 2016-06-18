//Check if repository is cloned
var fs = require('fs');
try {
    // Query the entry
    stats = fs.lstatSync('repos');

    // Is it a directory?
    if (stats.isDirectory()) {
        // Yes it is
        console.log("it exists");
    }
}
catch (e) {
    console.log(e.message)
}
