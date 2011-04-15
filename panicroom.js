var sys    = require('sys'),
    fs     = require('fs'),
    sqlite = require('sqlite');

var query = fs.readFileSync('./query.sql').toString();

var db = new sqlite.Database();

function stars(rating) {
    var result = [];
    for(var i=1; i<6; ++i) {
        result.push((rating>i) ? "*": " ");
    }
    return result.join("");
}

function flag(pick) {
    return "X P"[pick + 1];
}

db.open("./lrdb-totinker.lcat", function (error) {
  if (error) {
      console.log("failed to open tha Lightroom catalog");
      throw error;
  }
  db.execute( 
      query
    , []
    , function (error, rows) {
        if (error) throw error;
        //console.log(rows);
        var rowCount = rows.length;
        var totalSize = 0;
        var existingPaths = [];
        for (var i=0; i < rows.length; ++i) {
            var r = rows[i];
            var path = r.absolutePath + r.pathFromRoot + r.lc_idx_filename;
            r.path = path;
            
            (function(r, finish) {
                fs.stat(r.path, function(err, stat) {
                    if (stat) {
                        totalSize += stat.size;
                        existingPaths.push(r.path);
                    }
                    console.log(stars(r.rating), "|", flag(r.pick), "|", err ? "!": " ", r.path);                
                    if (--rowCount == 0) {
                        finish();
                    }
                });
            })(r, function() {
                console.log("Processed",rows.length, "images. Total size is", totalSize);      
                console.log(existingPaths);
            });
        }
        db.close(function(error) {
            if (error) {
                console.log(error);
            }
        });
      }
  );
});
