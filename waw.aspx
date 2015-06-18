<%@ Page Language="C#" AutoEventWireup="false" Src="lib/functions.cs" Inherits="functions" %><%@ Import namespace="System.IO" %><%@ Import namespace="System.Collections" %><%@ Import namespace="System.Data" %><%

// TODO: should automatically detect this
String basepath = "/var/www";
mimetypesFile = "/var/www/waw/res/mime.types";
IDbConnection db = null;
Object result = null;

try {
   Hashtable param = http_params(Request);
   db = empty_value(param["driver"]) ? null : sql_open(param);
   if (!empty_value(param["file"])) {     
      FileSystemInfo file = file_path(basepath, param["file"].ToString());
      if (!empty_value(param["data"])) {
         file_save(file, json_decode(param["data"].ToString()));
         result = "Document sauvegardé";
      }
      else if (file_exists(file))
         result = file_stat(file, 0, !empty_value(param["folders"]));
      else
         result = "Cannot find file "+param["file"];
   }
   else if (!empty_value(param["mimetypes"])) {
      file_mimetype(null);   
      result = mimetypes;
   }
   else if (!empty_value(param["query"]))
      result = sql_query(db, param["query"].ToString());
   else if (!empty_value(param["data"])) {
      String table = empty_value(param["table"]) ? "" : param["table"].ToString();
      String select = empty_value(param["select"]) ? "" : json_sql(json_decode(param["select"].ToString()));
      sql_save(db, json_decode(param["data"].ToString()), table, select);
      result = "OK";
   }
   else if (!empty_value(param["table"])) {
      if (!empty_value(param["info"]))
         result = sql_info(db, param["table"].ToString(), param["info"].ToString());
      else {
         String sql = "select * from "+param["table"];
         if (!empty_value(param["select"]))
            sql += " where "+json_sql(json_decode(param["select"]));
         if (!empty_value(param["sort"]))
            sql += " order by "+param["sort"];
         if (!empty_value(param["limit"]))
            sql += " limit "+param["limit"];
         result = sql_query(db, sql);
      }
   }
   else if (!empty_value(param["database"]))
      result = sql_tables(db, param["database"].ToString());
   else if (db != null)
      result = sql_databases(db, param["folder"]);
   else
      result = sql_drivers();
}
catch (Exception e) {
   Console.WriteLine(e.StackTrace);
   result = e.ToString(); 
}
finally {
   sql_close(db);
}

Response.Write(json_encode(result));
%>
