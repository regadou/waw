<?php

$basepath = $_SERVER["DOCUMENT_ROOT"];
$mimetypesFile = "/etc/mime.types";
$queryVerbs = array("select", "show", "pragma");
$db = null;
$mimetypes = null;
$result = null;

try {
   require_once("lib/functions.php");
   $param = http_params();
   $db = (empty_value($param["driver"])) ? null : sql_open($param);
   if ($param["file"] != null) {
      $file = file_path($basepath, $param["file"]);
      if (!empty_value($param["data"])) {
         file_save($file, json_decode($param["data"]));
         $result = "Document sauvegardé";
      }
      else if (file_exists($file))
         $result = file_stat($file, 0, !empty_value($param["folders"]));
      else
         $result = "Cannot find file " . $param["file"];
   }
   else if (!empty_value($param["mimetypes"])) {
      file_mimetype(null);   
      $result = $mimetypes;
   }
   else if (!empty_value($param["query"]))
      $result = sql_query($db, $param["query"]);
   else if (!empty_value($param["data"])) {
      $select = ($param["select"] == null) ? "" : json_sql(json_decode($param["select"]));
      sql_save($db, json_decode($param["data"]), $param["table"], $select);
      $result = "OK";
   }
   else if (!empty_value($param["table"])) {
      if ($param["info"] != null)
         $result = sql_info($db, $param["table"], $param["info"]);
      else {
         $sql = "select * from " . $param["table"];
         if ($param["select"] != null)
            $sql .= " where " . json_sql(json_decode($param["select"]));
         if ($param["sort"] != null)
            $sql .= " order by " . $param["sort"];
         if ($param["sort"] != null)
            $sql .= " limit " . $param["limit"];
         $result = sql_query($db, $sql);
      }
   }
   else if (!empty_value($param["database"]))
      $result = sql_tables($db, $param["database"]);
   else if (!empty_value($db))
      $result = sql_databases($db, $param["folder"]);
   else
      $result = sql_drivers();
} catch (Exception $e) {
   $result = $e->getMessage();
}

echo json_encode($result);
sql_close($db);
?>
