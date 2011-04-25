#! /usr/bin/env node

var sys    = require('sys'),
    fs     = require('fs'),
    sqlite = require('sqlite'),
    _ = require("underscore"),
    cli = require('cli');

cli.parse({
    minRating:   ['r', 'minimum rating', "number", 0],
    rootFolder:  [false, "only process photos stored in this root folder", "path", undefined],
    unpicked:    ['u', 'include unpicked'],
    rejected:    ['x', 'include rejected']
}, ["listroots", "backup"]);

function stars(rating) {
    var result = [];
    for(var i=0; i<5; ++i) {
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
                      console.log(stars(r.rating), "|", flag(r.pick), "|", err ? "!": " ", r.path);                
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
          console.log("failed to open the Lightroom catalog");
          callback(error, null);
      }
  
      getRootFolders(db, function(err, rootFolders) {
          if (err) {
              finish(err, null);
          } else {
              getMasterFiles(db, rootFolders, function(err, result) {
                  if (err) {
                      finish(err, null);
                  } else {
                      finish(err, result);
                  }
              });  
          }
      });
  });
}

/*backup("./lrdb-totinker.lcat", function(err, result) {
    console.log("Processed",result.rows.length, "images. Total size is", result.totalSize);      
});*/

cli.main(function (args, options) {
    if (args.length < 1) {
        cli.fatal("No catalog file specified.");
    }
    var catalog = args[0];
    if (cli.command=="listroots") {
        cli.info("opening catalog " + catalog);
        var db = new sqlite.Database();
        db.open(catalog, function (error) {
            if (error) cli.fatal("failed to open the Lightroom catalog " + catalog);
            getRootFolders(db, function(err, rootFolders) {
                if (err) cli.fatal(err);
                cli.info("Root folders:");
                for (var k in rootFolders) {     
                    cli.info(rootFolders[k].path + " " + (rootFolders[k].stat ? "(online)" : "(offline)"));
                }    
            });
        });
    } else {
        backup(catalog, function(err, result) {
            if (err) {
                cli.fatal(err);
            } else {
                console.log(JSON.stringify(result.existingPaths));     
                console.log("Processed "+ result.rows.length + " images. Total size of available files is " + result.totalSize);      
            }
        });
    }
});