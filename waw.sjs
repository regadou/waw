//request={get:{driver:"mysql",user:"root"}};response={write:function(x){system.stdout.writeLine(x)}};
http = require("http");
fs = require("fs");
eval(read(system.getcwd()+"/lib/functions.sjs"));

var basepath = "/var/www";
var mimetypesFile = "res/mime.types";
var defaultCharset = "UTF-8";
var db = null;
var mimetypes = null;
var result = null;
var sql = "";

try {
   var params = http_params(request);
   http_log("params = "+json_encode(params));
   db = params.driver ? sql_open(params) : null;
   if (params.file) {
      var path = file_path(basepath, params.file);
      if (params.info)
         result = file_info(path, params.info);
      else if (params.data) {
         file_save(path, json_decode(params.data));
         result = "OK";
      }
      else if (file_exists(path))
         result = file_stat(path, 0, empty_value(params.folders));
      else
         result = "Cannot find file "+params.file;
   }
   else if (params.mimetypes) {
      file_mimetype();
      result = mimetypes;
   }
   else if (params.query)
      result = sql_query(db, params.query);
   else if (params.data) {
      var select = params.select : json_sql(json_decode(params.select)) : "";
      sql_save(db, json_decode(params.data), params.table, select);
      result = "OK";
   }
   else if (params.table) {
      if (params.info)
         result = sql_info(db, params.table, params.info);
      else {
         sql = "select * from "+params.table;
         if (params.select)
            sql += " where "+json_sql(json_decode(params.select));
         if (params.sort)
            sql += " order by "+params.sort;
         if (params.limit)
            sql += " limit "+params.limit;
         sql += "\n";
         result = sql_query(db, sql);
      }
   }
   else if (params.database)
      result = sql_tables(db);
   else if (params.driver)
      result = sql_databases(db);
   else
      result = sql_drivers();
}
catch (e) {
   result = sql + e.toString();
}
finally {
   sql_close(db);
}

if (result != null)
   response.write(json_encode(result));

function read(path) {
   var file = new fs.File(path);
   file.open("r");
   var txt = file.read().toString("UTF-8");
   file.close();
   return txt;
}

