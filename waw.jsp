<%@ page import="java.util.*,java.io.*"%><%@ include file="lib/functions.jsp" %><%!
public static String mimetypesFile = "/etc/mime.types";
%><%
String basepath = "/var/www";
Connection db = null;
Object result = null;

try {
   Map<String,String> params = http_params(request);
   http_log(json_encode(params));
   db = empty_value(params.get("driver")) ? null : sql_open(params);
   if (!empty_value(params.get("file"))) {
      File file = file_path(basepath, params.get("file"));
      if (!empty_value(params.get("data"))) {
         file_save(file, json_decode(params.get("data")));
         result = "Document sauvegardé";
      }
      else if (file_exists(file))
         result = file_stat(file, 0, !empty_value(params.get("folders")));
      else
         result = "Cannot find file "+params.get("file");
   }
   else if (!empty_value(params.get("mimetypes"))) {
      file_mimetype(null);   
      result = mimetypes;
   }
   else if (!empty_value(params.get("query")))
      result = sql_query(db, params.get("query"));
   else if (!empty_value(params.get("data"))) {
      String select = empty_value(params.get("select")) ? "" : json_sql(json_decode(params.get("select")));
      sql_save(db, json_decode(params.get("data")), params.get("table"), select);
      result = "OK";
   }
   else if (!empty_value(params.get("table"))) {
      if (!empty_value(params.get("info")))
         result = sql_info(db, params.get("table"), params.get("info"));
      else {
         String sql = "select * from "+params.get("table");
         if (!empty_value(params.get("select")))
            sql += " where "+json_sql(json_decode(params.get("select")));
         if (!empty_value(params.get("sort")))
            sql += " order by "+params.get("sort");
         if (!empty_value(params.get("limit")))
            sql += " limit "+params.get("limit");
         result = sql_query(db, sql);
      }
   }
   else if (!empty_value(params.get("database")))
      result = sql_tables(db, params.get("database"));
   else if (db != null)
      result = sql_databases(db, params.get("folder"));
   else
      result = sql_drivers();
}
catch (Exception e) {
   e.printStackTrace();
   result = e.toString();
}

out.write(json_encode(result));
sql_close(db);
%>
