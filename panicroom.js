var sys    = require('sys'),
    fs     = require('fs'),
    sqlite = require('sqlite'),
    _ = require("underscore");

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

function getRootFolders(db, finish) {
    db.execute( 
        "select id_local, absolutePath from AgLibraryRootFolder;"
      , []
      , function (error, rows) {
          if (error) {
              finish(error, null);
          } else {
              var rowCount = rows.length;
              var result = {};
              for (var i=0; i < rows.length; ++i) {
                  (function(r) {
                      fs.stat(r.absolutePath, function(err, stat) {
                          result[r.id_local] = {
                              stat: stat,
                              path: r.absolutePath
                          };
                          if (--rowCount == 0) {
                              finish(null, result);
                          }
                      });
                  })(rows[i]);
              }
        }
    });
}

function getMasterFiles(db, rootFolders, finish) {
    var query = fs.readFileSync('./query.sql').toString();
    
    db.execute( 
        query
      , []
      , function (error, rows) {
          if (error) {
              finish(error, null);
              return;
          }
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
                      //console.log(stars(r.rating), "|", flag(r.pick), "|", err ? "!": " ", r.path);                
                      if (--rowCount == 0) {
                          finish();
                      }
                  });
              })(r, function() {
                  var result = {
                        rows: rows
                      , totalSize: totalSize
                      , existingPaths: existingPaths
                  };
                  finish(null, result);
              });
          }
        }
    );
}

function backup(catalog, callback) {
    var db = new sqlite.Database();
    
    function finish(err, result) {
        db.close(function(error) {
            if (error) {
                console.log(error);
            }
            callback(err, result);
        });
    }
    db.open(catalog, function (error) {
      if (error) {
          console.log("failed to open tha Lightroom catalog");
          callback(error, null);
      }
  
      getRootFolders(db, function(err, rootFolders) {
          if (err) {
              finish(err, null);
          } else {
              console.log("Root folders:");
              _.each(_.keys(rootFolders), function(k) {
                 console.log(rootFolders[k].path, rootFolders[k].stat ? "(online)" : "(offline)") 
              });
              getMasterFiles(db, rootFolders, function(err, result) {
                  if (err) {
                      finish(err, null);
                  } else {
                      console.log(result.existingPaths);     
                      finish(err, result);
                  }
              });  
          }
      });
    });
}

backup("./lrdb-totinker.lcat", function(err, result) {
    console.log("Processed",result.rows.length, "images. Total size is", result.totalSize);      
});
