<?php                  
               
function http_params() {
   return $_GET;
}

function file_path($base, $path) {
   if ($path == null || $path == "")
      $path = "/";
   else if ($path[0] != "/")
      $path = "/" . $path;
   return $base . $path;
}

function file_save($path, $data) {
   if ($data == null) {
      if (!unlink($path))
         die("Cannot delete " . path);
      return;
   }
   else if (is_array($data)) {
      $t = $data["type"];
      $b = $data["bytes"];
      if (empty_value($t) && empty_value($b))
         $bytes = strval($data);
      else if (empty_value($t) || empty_value($b))
         die("Missing type or bytes properties for data");
      else if ($t == "ascii")
         $bytes = strval($b);
/**
      else if ($t == "base64")
         ;
      else if ($t == "hexa")
         ;
      else if ($t == "binary")
         ;
**/
      else
         die("Unknown data type: " . $t);
   }
   else
      $bytes = strval($data);
      
   $fp = fopen($path, 'wb');
   fwrite($fp, $bytes);
   fclose($fp);
}

function file_stat($path, $level, $foldersOnly) {
   $isfolder = is_dir($path);
   if ($foldersOnly) {
      $folders = array();
      if ($isfolder) {
         $files = file_list($path);
         foreach ($files as $file) {
            if (is_dir($path . "/" . $file))
               $folders[] = $file;
         }
      }
      return $folders;
   }
   else if ($isfolder && $level == 0) {
      $files = file_list($path);
      $data = array();
      foreach ($files as $file)
         $data[] = file_stat($path . "/" . $file, 1, $foldersOnly);
      return $data;
   }
   else {
      $parts = explode("/", $path);
      $name = $parts[count($parts)-1];
      if ($isfolder)
         $type = "inode/directory";
      else
         $type = file_mimetype($name);
      return array( 
			"name" => $name, 
			"type" => $type, 
			"size" => filesize($path), 
			"modified" => date ("Y-m-d H:i:s", filemtime($path))
		); 
   }
}

function file_mimetype($name) {
   $mimetypes = $GLOBALS['mimetypes'];
   if ($mimetypes == null) {
      $lines = explode("\n", str_replace("\t", " ", file_get_contents($GLOBALS['mimetypesFile'])));
      $mimetypes = array();
      foreach ($lines as $line) {
         $parts = explode("#", $line);
         $line = trim($parts[0]);
         if ($line == "")
            continue;
         $tokens = explode(" ", $line);
         $type = null;
         foreach ($tokens as $token) {
            if ($token == "")
               continue;
            else if ($type == null)
               $type = $token;
            else if ($mimetypes[$token] == null)
               $mimetypes[$token] = $type;
         }
      }
      $GLOBALS['mimetypes'] = $mimetypes;
   }
   
   $ext = "";
   if ($name != null) {
      $parts = explode("/", $name);
      $parts = explode(".", $parts[count($parts)-1]);
      if (count($parts) > 1)
         $ext = $parts[count($parts)-1];
   }
   $type = $mimetypes[$ext];
   if ($type != null)
      return $type;
   else
      return $mimetypes["txt"];
}

function file_list($path) {
  $files = array();
  $d = dir($path); 
  while(false !== ($entry = $d->read())) { 
  		if ($entry != "." && $entry != "..")
     		$files[] = $entry;
  }
  $d->close();
  usort($files, "list_sort");
  return $files;
}

function json_sql($obj) {
   if ($obj == null)
      return "''";
   else if (is_string($obj) || is_callable($obj))
      return "'" . str_replace("'", "''", $obj) . "'";
   else if (is_numeric($obj))
      return $obj . "";
   else if (is_bool($obj))
      return $obj ? "1" : "0";
   else {
      $txt = "";
      foreach ($obj as $key => $value) {
         if ($txt != "")
            $txt .= " and ";
         $txt .= $key . " = " . json_sql($value);
      }
      return $txt;
   }
}

function sql_open($param) {
   $txt = $param["driver"] . ":host=";
   if ($param["host"] == null)
      $txt .= "localhost";
   else
      $txt .= $param["host"];
   if ($param["port"] != null)
      $txt .= ";port=" . $param["port"];
   if ($param["database"] != null)
      $txt .= ";dbname=" . $param["database"];
   else if ($param["driver"] == "sqlite")
      $txt .= ";dbname=:memory:";
   return new PDO($txt, $param["user"], $param["password"]);
}

function sql_close($db) {
   if ($db != null)
      $db = null;
}

function sql_query($db, $sql) {
   $sql = trim($sql);
   $i = strpos($sql," ");
   $word = strtolower(($i === FALSE) ? $sql : substr($sql, 0, $i));
   if (array_search($word, $GLOBALS["queryVerbs"]) === FALSE)
      return array($db->exec($sql));
      
   $result = $db->query($sql);
   $lst = array();
   foreach($result as $row) {
      $rec = array();
      foreach ($row as $key => $value) {
         if (!is_numeric($key))
            $rec[$key] = $value;
      }
      $lst[] = $rec;
   }
   return $lst;
}

function sql_save($db, $data, $table, $select) {
   $isobject = false;
   if ($data == null && !empty_value($select)) {
      $data = array();
      $isobject = true;
   }
   else if (is_array($data)) {
      foreach (array_keys($data) as $key) {
         if (!is_numeric($key)) {
            $isobject = true;
            break;
         }
      }
      if (!isobject) {
         foreach ($data as $e)
            sql_save($db, $e, $table, $select);
         return;
      }
   }
   else
      return;
      
   $q1 = null;
   $q2 = null;
   $q3 = null;
   foreach ($data as $key => $value) {
      $val = sql_encode($key);
      if ($q1 == null) {
         if (!empty_value($select)) {
            $q1 = "update " . $table . " set " . $key . "=" . $val;
            $q2 = " where " . $select;
            $q3 = "";
         }
         else {
            $q1 = "insert into " . $table . " (" . $key;
            $q2 = ") values (" . $val;
            $q3 = ")";
         }
      }
      else if (!empty_value($select))
         $q1 += ", " . $key . "=" . $val;
      else {
         $q1 += ", " . $key;
         $q2 += ", " . $val;
      }
   }
   if ($q1 != null)
      $db->query($q1 . $q2 . $q3);
   else if (!empty_value($select))
      $db->query("delete from " . $table . " where " . $select);
}

function sql_info($db, $table, $info) {
   $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
   if ($info == "fields") {
      if ($driver == "mysql")
         $sql = "SELECT column_name as name, data_type as type, character_maximum_length as size FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '"
              . $table . "' order by ordinal_position";
      else if ($driver == "pgsql")
         $sql = "SELECT COLUMN_NAME as name, DATA_TYPE as type, CHARACTER_MAXIMUM_LENGTH as size FROM INFORMATION_SCHEMA.COLUMNS WHERE  TABLE_NAME = '"
              . $table . "' ORDER BY ORDINAL_POSITION";
      else if ($driver == "sqlite") {
         $rows = sql_query($db, "pragma table_info(" . $table . ")");
         foreach($rows as $row) {
            $type = $row["type"];
            if (empty_value($type))
               continue;
            $index = strpos($type, "(");
            if ($index === false)
               $row["size"] = "";
            else {
               $row["size"] = intval(substr($type, $index+1));
               $row["type"] = substr($type, 0, $index);
            }
         }
         return $rows;
      }
      else
         return "Unknown driver " . $driver;
      return sql_query($db, $sql);
   }
   else
      return "Unknown information " . $info;
}

function sql_tables($db, $database) {
   $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
   if ($driver == "mysql")
      $sql = "show tables";
   else if ($driver == "pgsql")
      $sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
   else if ($driver == "sqlite")
      $sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
   else
      return "Unknown driver " . $driver;
      
   $lst = array();
   foreach($db->query($sql) as $row) {
      $lst[] = $row[0];
   }
   return $lst;
}

function sql_databases($db, $folder) {
   $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
   if ($driver == "mysql")
      $sql = "show databases";
   else if ($driver == "pgsql")
      $sql = "select datname from pg_database";
   else if ($driver == "sqlite") {
      $lst = array();
      if (!empty_value($folder)) {
         if ($folder[strlen($folder)-1] != '/')
            $folder .= '/';
         $d = dir($folder); 
         while(false !== ($entry = $d->read())) { 
        		if ($entry != "." && $entry != "..") {
        		   $dot = strrpos($entry, ".");
               if ($dot > 0 && strtolower(substr($entry, $dot+1)) == "db")
           		   $lst[] = array("file" => $folder . $entry);
            }
         }
         $d->close();
      }
      return $lst;
   }
   else
      return "Unknown driver " . $driver;
      
   $lst = array();
   foreach($db->query($sql) as $row)
      $lst[] = $row[0];
   return $lst;
}

function sql_drivers() {
   return PDO::getAvailableDrivers();
}

function list_sort($a, $b) {
    $a = strtolower($a);
    $b = strtolower($b);
    if ($a == $b)
        return 0;
    return ($a < $b) ? -1 : 1;
}

function empty_value($val) {
   return ($val == null || $val == "" || empty($val));
}

?>
