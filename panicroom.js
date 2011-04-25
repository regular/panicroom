#! /usr/bin/env node

var sys    = require('sys'),
    fs     = require('fs'),
    sqlite = require('sqlite'),
    _ = require("underscore"),
    cli = require('cli');

cli.parse({
    minRating:   ['r', 'minimum rating', "number", undefined],
    rootFolder:  [false, "only process photos stored in this root folder", "path", undefined],
    unpicked:    ['u', 'exclude unpicked and rejected'],
    rejected:    ['x', 'exclude rejected']
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

function getMasterFiles(db, rootFolders, finish, minFlag, minRating) {
    var sql = fs.readFileSync('./query.sql').toString();
 
    db.prepare(sql, function (error, statement) {
        if (error) {
            finish(error, null);
            return;
        }

        // Fill in the placeholders
        statement.bindArray([], function () {
            statement.fetchAll(function (error, rows) {
                if (error) {
                    finish(error, null);
                    return;
                }
                var rowCount = rows.length;
                var totalSize = 0;
                var existingPaths = [];
                var count = 0;
                for (var i=0; i < rows.length; ++i) {
                    var r = rows[i];
                    if (!r.rating) r.rating = 0;
                    if (!r.pick) r.pick = 0;
                    
                    var path = r.absolutePath + r.pathFromRoot + r.lc_idx_filename;
                    r.path = path;

                    (function(r, finish) {
                        
                        var include = r.rating>0 || r.pick>0;
                        if (include && minFlag != undefined) {
                            include = r.pick >= minFlag;
                        }
                        if (include && minRating != undefined) {
                            include = r.rating >= minRating;
                        }
                        
                        if ( include ) {
                            count++;
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
                        } else {
                            if (--rowCount == 0) {
                                finish();
                            }
                        }
                    })(r, function() {
                        var result = {
                              count: count
                            , totalSize: totalSize
                            , existingPaths: existingPaths
                        };
                        finish(null, result);
                    });
                }
                statement.finalize(function (error) {
                    //console.log("All done!");
                });
            });
        });
    });     
}

function backup(catalog, callback, conditions) {
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
              }
              , conditions.minFlag
              , conditions.minRating
              );  
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
        var conditions = {
            minRating: options.minRating,
            minFlag: undefined
        };
        if (options.unpicked) conditions.minFlag = 1;
        if (options.rejected) conditions.minFlag = 0;

        backup(catalog, function(err, result) {
            if (err) {
                cli.fatal(err);
            } else {
                //console.log(JSON.stringify(result.existingPaths));     
                console.log("Processed "+ result.count + " images. Total size of available files is " + result.totalSize / (1024*1024*1024)+" GB");      
            }
        }
        , conditions
        );
    }
});