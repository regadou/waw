var defaultCharset = "UTF-8";
var queryVerbs = "select,show,pragma".split(",");

function empty_value(val) {
   return val ? true : false;
}

function http_params(request) {
   var params = {};
   for (var p in request.get)
      params[p] = request.get[p];
   for (var p in request.post)
      params[p] = request.post[p];
   return params;
}

function http_log(txt) {
   system.stdout.writeLine(txt + "\n");
}

function file_exists(path) {
   return file_value(path).exists();
}

function file_value(path) {
   if (path instanceof fs.File || path instanceof fs.Directory)
      return path;
   else if (path == null)
      return new File(system.getcwd());
   else
      return new fs.File(path);
}

function file_path(base, path) {
   if (path.charAt(0) != "/")
      path = "/" + path;
   return base + path;
}

function file_info(path, info) {
   var data = {};
   var parts = info.split("-");
   var include = (parts[0] == "" || parts[0] == "*") ? null : parts[0].split(",");
   if (parts.length < 2)
      var exclude = null;
   else if (parts[1] == "*")
      return data;
   else
      var include = (parts[1] == "") ? null : parts[1].split(",");

   Process = require("process").Process;
   var lines = new Process().exec("exiftool "+file_value(path)).split("\n");
   for (var i = 0; i < lines.length; i++) {
      var line = lines[i].split(":");
      var name = line[0].trim().toLowerCase();
      if (exclude != null && exclude.indexOf(name) >= 0)
         continue;
      else if (include == null || include.indexOf(name) >= 0)
         data[name] = line[1].trim();
   }
   return data;
}

function file_save(path, data) {
   var file = file_value(path);
   if (data == null)
      file.remove();
   else if (data instanceof Array)
      var bytes = new Buffer(data.toString(), defaultCharset); 
   else if (typeof(data) == "object") {
      var t = data.type;
      var b = data.bytes;
      if (!t || !b)
         throw new Error("Missing type or bytes properties for data");
      else if (t == "ascii")
         var bytes = new Buffer(b.toString(), defaultCharset);
      else if (t == "base64")
         ;
      else if (t == "hexa")
         ;
      else if (t == "binary")
         ;
      else
         throw new Error("Unknown data type: "+t);
   }
   else
      var bytes = new Buffer(data.toString(), defaultCharset);
   file.open("w");
   file.write(bytes);
   file.close();
}

function file_stat(path, level, foldersOnly) {
   if (level == null)
      level = 0;
   var file = file_value(path);
   var isfolder = (file.isDirectory && file.isDirectory()) || (file.exists() && !file.isFile());
   if (foldersOnly) {
      var folders = [];
      if (isfolder) {
         var files = new fs.Directory(path).listDirectories();
         for (var f in files)
            folders.push(files[f]);
         folders.sort(function(a,b){
            var a = a.toLowerCase();
            var b = b.toLowerCase();
            return (a > b) ? 1 : ((b > a) ? -1 : 0); 
         });
      }
      return folders
   }
   else if (isfolder && level == 0) {
      var data = [];
      var dir = new fs.Directory(path);
      var files = dir.listDirectories();
      for (var f in files)
         data.push(file_stat(path+"/"+files[f], 1));
      var files = dir.listFiles();
      for (var f in files)
         data.push(file_stat(path+"/"+files[f], 1));
      data.sort(function(a,b){
         var a = a.name.toLowerCase();
         var b = b.name.toLowerCase();
         return (a > b) ? 1 : ((b > a) ? -1 : 0); 
      });
      return data;
   }
   else {
      var parts = path.split("/");
      var name = parts[parts.length-1];
      var type = isfolder ? "inode/directory" : file_mimetype(name);
      var stat = file.stat();
      return {name:name, size:stat.size, modified:date_print(new Date(stat.mtime*1000)), type:type};
   }
}

function file_read(path, charset) {
   if (!charset)
      charset = defaultCharset;
   var file = file_value(path);
   file.open("r");
   var txt = file.read().toString(charset);
   file.close();
   return txt;
}

function file_mimetype(name) {
   if (mimetypes == null) {
      var lines = file_read(mimetypesFile).replace(/\t/g, " ").split("\n");
      mimetypes = {};
      for (var i in lines) {
         var line = lines[i].split("#")[0].trim();
         if (line == "")
            continue;
         var tokens = line.split(" ");
         var type = null;
         for (var t in tokens) {
            var token = tokens[t];
            if (token == "")
               continue;
            else if (type == null)
               type = token;
            else if (mimetypes[token] == null)
               mimetypes[token] = type;
         }
      }
   }
   
   var ext = "";
   if (name) {
      var parts = name.toString().split("/");
      parts = parts[parts.length-1].split(".");
      if (parts.length > 1)
         ext = parts[parts.length-1];
   }
   return mimetypes[ext] || mimetypes.txt;
}

function date_print(date) {
   if (date == null)
      return "";
   else if (date instanceof Date)
      ;
   else if (!isNaN(date))
      date = new Date(parseInt(date));
   else
      return date.toString();
      
   return date.getFullYear() + "-" + (date.getMonth()+101).toString().substr(1) + "-" + (date.getDate()+100).toString().substr(1)
                             + " " + (date.getHours()+100).toString().substr(1) + ":" + (date.getMinutes()+100).toString().substr(1) 
                             + ":" + (date.getSeconds()+100).toString().substr(1);
}

function json_decode(txt) {
   return JSON.parse(txt);
}

function json_encode(obj) {
   return JSON.stringify(obj);
}

function json_sql(obj) {
   if (obj == null)
      return "''";
   switch (typeof(obj)) {
      case 'string':
      case 'function':
         return "'" + obj.toString().replace(/'/g, "''") + "'";
      case 'number':
         return obj.toString();
      case 'boolean':
         return obj ? "1" : "0";
      default:
         if (obj instanceof Date)
            return "'" + date_print(obj) + "'";
         else if (obj instanceof RegExp)
            return json_sql(obj.toString());
         else if (obj instanceof Array) {
            var txt = "";
            for (var i = 0; i < obj.length; i++) {
               var e = obj[i];
               if (e == null || typeof(obj) != "object")
                  continue;
               else if (txt != "")
                  txt += " or ";
               txt += "("+json_sql(e)+")";
            }
            return txt;
         }
         else {
            var txt = "";
            for (var p in obj) {
               if (txt != "")
                  txt += " and ";
               var value = obj[p];
               if (value instanceof Array) {
                  switch (value.length) {
                     case 0:
                        txt += p + " = " + json_sql(null);
                        break;
                     case 1:
                        txt += p + " = " + json_sql(value[0]);
                        break;
                     case 2:
                        if (sql_value(value[0]) && sql_value(value[1])) {
                           txt += p + " >= " + json_sql(value[0]) + " and " + p + " <= " + json_sql(value[1]);
                           break;
                        }
                     default:
                        var sub = "";
                        for (var i = 0; i < value.length; i++) {
                           if (sub != "")
                              sub += " or ";
                           var e = value[i];
                           if (sql_value(e))
                              sub += p + " = ";
                           sub += json_sql(e)
                        }
                        txt += "(" + sub + ")";
                  }
               }
               else
                  txt += p + " = " + json_sql(value);
            }
            return txt;
         }
   }
}

function sql_value(value) {
   return value == null || typeof(value) != "object" || value instanceof Date || value instanceof RegExp;
}

function sql_open(params) {
   if (!params.driver)
      throw new Error("Driver not specified");
   if (!params.host)
      params.host = "localhost";
   if (!params.password)
      params.password = "";
   switch (params.driver) {
      case 'mysql':
         var dbname = params.database || "mysql";
         var m = require('mysql');
         var db = new m.MySQL();
         db.connect(params.host, params.user, params.password, dbname);
         return db;
      case 'pgsql':
         var dbname = params.database || "postgres";
         var m = require('pgsql');
         var txt = "";
         for (var p in params) {
            switch (p) {
               case 'host':
                  txt += ' host='+params[p];
                  break;
               case 'port':
                  txt += ' port='+params[p];
                  break;
               case 'user':
                  txt += ' user='+params[p];
                  break;
               case 'password':
                  txt += ' password='+params[p];
                  break;
            }
         }
         return new m.PostgreSQL(txt+' dbname='+dbname);
      case 'sqlite':
         var m = require('sqlite');
         var db = new m.SQLite();
         if (params.database)
            db.open(params.database);
         db.folder = params.folder;
         return db;
      default:
         throw new Error("Unknown driver "+params.driver);
   }
}

function sql_close(db) {
   if (db && typeof(db.close) == "function")
      db.close();
}

function sql_query(db, sql) {
   if (!db)
      throw new Error("Database object is empty");
//   else if (queryVerbs.indexOf(sql.trim().split(" ")[0].toLowerCase()) < 0)
//      return [db.execute(sql)];
      
   switch (db.constructor.name) {
      case 'MySQL':
         var r = db.query(sql);
         return (r == null || typeof(r) != "object") ? [r] : r.fetchObjects();
      case 'PostgreSQL':
         var r = db.query(sql)
         return (r == null || typeof(r) != "object") ? [r] : r.rows;
      case 'SQLite':
         var r = db.query(sql)
         return (r == null || typeof(r) != "object") ? [r] : r.fetchObjects();
      default:
         throw new Error("Unknown database driver: "+db.constructor.name);
   }
}

function sql_save(db, data, table, select) {
   if (!db)
      throw new Error("Database object is empty");
   else if (data instanceof Array) {
      for (var i = 0; i < data.length; i++)
         sql_save(db, data[i], table, select);
      return;
   }
   else if (data == null) {
      if (empty_value(select))
         return;
      data = {};
   }
   else if (typeof(data) != "object")
      return;
      
   var q1 = null;
   var q2 = null;
   var q3 = null;
   for (var key in data) {
      var val = sql_encode(data[key]);
      if (q1 == null) {
         if (!empty_value(select)) {
            q1 = "update "+table+" set "+key+"="+val;
            q2 = " where "+select;
            q3 = "";
         }
         else {
            q1 = "insert into "+table+" ("+key;
            q2 = ") values ("+val;
            q3 = ")";
         }
      }
      else if (!empty_value(select))
         q1 += ", "+key+"="+val;
      else {
         q1 += ", "+key;
         q2 += ", "+val;
      }
   }
   if (q1 != null)
      sql = q1 + q2 + q3;
   else if (!empty_value(select))
      sql = "delete from "+table+" where "+select;
   else
      return;
   return sql_query(db, sql);
}

function sql_encode(val) {
   if (val == null)
      return "''";
   if (typeof(val) == "boolean")
      return val ? "1" : "0";
   var txt = val.toString();
   if (txt.trim() == "")
      return "'" + txt + "'";
   else if (isNaN(txt))
      return "'" + txt.replace(/'/g, "''") + "'";
   else
      return txt;
}

function sql_info(db, table, info) {
   if (!db)
      throw new Error("Database object is empty");
   if (info == "fields") {
      switch (db.constructor.name) {
         case 'MySQL':
            var sql = "SELECT column_name as name, data_type as type, character_maximum_length as size FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '"
                    + table +"' order by ordinal_position";
            break;
         case 'PostgreSQL':
            var sql = "SELECT COLUMN_NAME as name, DATA_TYPE as type, CHARACTER_MAXIMUM_LENGTH as size FROM INFORMATION_SCHEMA.COLUMNS WHERE  TABLE_NAME = '" 
                    + table + "' ORDER BY ORDINAL_POSITION";
            break;
         case 'SQLite':
            var rows = sql_query(db, "pragma table_info(" + table + ")");
            for (var r in rows) {
               var row = rows[r];
               var type = row.type;
               if (!type)
                  continue;
               var index = type.indexOf("(");
               if (index < 0)
                  row.size = "";
               else {
                  row.size = parseInt(type.substring(index+1));
                  row.type = type.substring(0, index);
               }
            }
            return rows;
         default:
            throw new Error("Unknown database driver: "+db.constructor.name);
      }
      return sql_query(db, sql);
   }
   else
      throw new Error("Unknown table info: "+info);
}

function sql_tables(db) {
   if (!db)
      throw new Error("Database object is empty");
   switch (db.constructor.name) {
      case 'MySQL':
         var sql = "show tables";
         break;
      case 'PostgreSQL':
         var sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
         break;
      case 'SQLite':
         var sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
         break;
      default:
         throw new Error("Unknown database driver: "+db.constructor.name);
   }
   
   var rows = sql_query(db, sql);
   var names = [];
   for (var r in rows) {
      var row = rows[r];
      for (var f in row) {
         names.push(row[f]);
         break;
      }
   }
   return names;
}

function sql_databases(db) {
   if (!db)
      throw new Error("Database object is empty");
   switch (db.constructor.name) {
      case 'MySQL':
         var sql = "show databases";
         break;
      case 'PostgreSQL':
         var sql = "select datname from pg_database";
         break;
      case 'SQLite':
         var lst = [];
         if (db.folder) {
            if (db.folder.charAt(db.folder.length-1) != '/')
               db.folder += '/';
            var files = new fs.Directory(db.folder).listFiles();
            for (f in files) {
               var name = files[f];
               var dot = name.lastIndexOf('.');
               if (dot > 0 && name.substring(dot+1).toLowerCase() == "db")
                  lst.push({file:db.folder + name});
            }
         }
         return lst;
      default:
         throw new Error("Unknown database driver: "+db.constructor.name);
   }
   
   var rows = sql_query(db, sql);
   var names = [];
   for (var r in rows) {
      var row = rows[r];
      for (var f in row) {
         names.push(row[f]);
         break;
      }
   }
   return names;
}

function sql_drivers() {
   return "mysql,pgsql,sqlite".split(",");
}



