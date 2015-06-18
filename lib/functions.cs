using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Data;
using System.IO;
using System.Reflection;
using System.Text;
using System.Web;

public class functions : System.Web.UI.Page {
 
   protected static String basepath = "/";
   protected static String mimetypesFile = "res/mime.types";
   protected static Hashtable mimetypes = null;
   private static IList sqlDrivers = null;
   private static IList queryVerbs = Array.AsReadOnly<String>("select,show,pragma".Split(new char[]{','}));

   public class FileComparer : IComparer {
      public int Compare(Object o1, Object o2)  {
         String n1 = (String)(map_value(o1)["name"]);
         String n2 = (String)(map_value(o2)["name"]);
         return(new CaseInsensitiveComparer().Compare(n1, n2));
      }
   }

   public Hashtable http_params(HttpRequest request) {
      NameValueCollection col = request.QueryString;
      Hashtable map = new Hashtable();
      String[] keys = col.AllKeys; 
      for (int i = 0; i < keys.Length; i++) {
         String key = keys[i];
         Object value = col[key];
         if (value != null && value.GetType().IsArray)
            value = ((Object[])value)[0];
         map[Server.HtmlEncode(key)] = value;
      }
      return map;
   }

   public bool empty_value(Object value) {
      if (value == null)
         return true;
      if (value.GetType().IsArray)
         return ((Object[])value).Length == 0;
      else if (value is ICollection)
         return ((ICollection)value).Count == 0;
      else
         return value.ToString().Trim().Equals("");
   }
   
   public Object file_stat(FileSystemInfo file, int level, bool foldersOnly) {
      bool isfolder = (file.Attributes & FileAttributes.Directory) == FileAttributes.Directory;
      if (foldersOnly) {
         ArrayList folders = new ArrayList();
         if (isfolder) {
            DirectoryInfo dir = (file is DirectoryInfo) ? (DirectoryInfo)file : new DirectoryInfo(file.FullName);
            foreach (DirectoryInfo d in dir.GetDirectories())
               folders.Add(d.Name);
         }
         folders.Sort();
         return folders;
      }
      else if (isfolder && level == 0) {
         ArrayList data = new ArrayList();
         DirectoryInfo dir = (file is DirectoryInfo) ? (DirectoryInfo)file : new DirectoryInfo(file.FullName);
         foreach (DirectoryInfo d in dir.GetDirectories())
            data.Add(file_stat(d, 1, foldersOnly));
         foreach (FileInfo f in dir.GetFiles())
            data.Add(file_stat(f, 1, foldersOnly));
         data.Sort(new FileComparer());
         return data;
      }
      else {
         String name = file.Name;
         String type = isfolder ? "inode/directory" : file_mimetype(name);
         Hashtable map = new Hashtable();
         map["name"] = name;
         map["modified"]  = file.LastWriteTime;
         map["type"] = type;
         if (file is FileInfo) {
            try { map["size"] = ((FileInfo)file).Length; } 
            catch (Exception e) {}
         }
         return map;
      }
   }

   public String file_read(String path) {
      FileInfo file = new FileInfo(path);
      if (!file.Exists)
         return "Cannot read "+path+" because it does not exists";
      else if ((file.Attributes & FileAttributes.Directory) == FileAttributes.Directory)
         return "Cannot read "+path+" because it is a directory";
      else {
         try {
            int size = (int)file.Length;
            byte[] buffer = new byte[size];
            FileStream input = file.OpenRead();
            input.Read(buffer, 0, size);
            input.Close();
            return System.Text.Encoding.UTF8.GetString(buffer);
         }
         catch (Exception e) { return e.ToString(); }
      }
   }

   public String file_mimetype(String name) {
      if (mimetypes == null) {
         String[] lines = file_read(mimetypesFile).Replace('\t', ' ').Split("\n".ToCharArray());
         mimetypes = new Hashtable();
         foreach (String ln in lines) {
            int i = ln.IndexOf('#');
            String line = ((i >= 0) ? ln.Substring(0, i) : ln).Trim();
            if (line.Equals(""))
               continue;
            String[] tokens = line.Split(" ".ToCharArray());
            String type = null;
            foreach (String token in tokens) {
               if (token.Equals(""))
                  continue;
               else if (type == null)
                  type = token;
               else if (mimetypes[token] == null)
                  mimetypes[token] = type;
            }
         }
      }
      
      String ext = "";
      if (name != null && !name.Equals("")) {
         String[] parts = name.Split((""+Path.DirectorySeparatorChar).ToCharArray());
         parts = parts[parts.Length-1].Split(".".ToCharArray());
         if (parts.Length > 1)
            ext = parts[parts.Length-1];
      }
      String t = (String)mimetypes[ext];
      return (t == null) ? (String)mimetypes["txt"] : t;
   }
   
   private FileSystemInfo file_value(Object path) {
      if (path is FileSystemInfo)
         return (FileSystemInfo)path;
      else if (path == null)
         path = "";
      FileInfo f = new FileInfo(path.ToString());
      if (f.Exists) return f;
      DirectoryInfo d = new DirectoryInfo(path.ToString());
      if (d.Exists) return d;
      return f;
   }

   public FileSystemInfo file_path(String basepath, String path) {
      if (path[0] != Path.DirectorySeparatorChar)
         path = Path.DirectorySeparatorChar + path;
      return file_value(basepath + path);
   }

   public bool file_exists(Object path) {
      return file_value(path).Exists;
   }
   
   public void file_save(Object path, Object data) {
      byte[] bytes;
      if (data == null) {
         File.Delete(path.ToString());
         return;
      }
      else if (data is IDictionary) {
         IDictionary map = (IDictionary)data;
         Object t = map["type"];
         Object b = map["bytes"];
         if (t == null || b == null)
            throw new ApplicationException("Missing type or bytes properties for data");
         else if (t.Equals("ascii"))
            bytes = new System.Text.UTF8Encoding().GetBytes(b.ToString());
   /**
         else if (t.Equals("base64"))
            ;
         else if (t.Equals("hexa"))
            ;
         else if (t.Equals("binary"))
            ;
   **/
         else
            throw new ApplicationException("Unknown data type: "+t);
      }
      else
         bytes = new System.Text.UTF8Encoding().GetBytes(data.ToString());
         
      FileStream output = new FileStream(path.ToString(), FileMode.Create, FileAccess.Write);   
      output.Write(bytes, 0, bytes.Length);
      output.Close();
   }
    
   public IDbConnection sql_open(Hashtable param) {
      String driver = (String)param["driver"];
      if (driver == null || driver.Equals(""))
         throw new ApplicationException("Driver not specified");
      String host = (String)param["host"];
      if (host == null || host.Equals(""))
         host = "localhost";
      String password = (String)param["password"];
      if (password == null || password.Equals(""))
         password = "";
      
      IDbConnection db = null;
      if (driver.Equals("mysql")) {
         String database = (String)param["database"];
         if (database == null || database.Equals(""))
            database = "mysql";
          db = new MySql.Data.MySqlClient.MySqlConnection();
          db.ConnectionString = "server="+host+";database="+database+";uid="+param["user"]+";password="+password+";";
      }
      else if (driver.Equals("pgsql")) {
         String database = (String)param["database"];
         if (database == null || database.Equals(""))
            database = "postgres";
         String txt = "Server="+host+";Database="+database+";User ID="+param["user"]+";Password="+password+";";
         db = new Npgsql.NpgsqlConnection(txt);
      }
      else if (driver.Equals("sqlite")) {
         String database = (String)param["database"];
         if (database == null || database.Equals(""))
            database = ":memory:";
         else if (!database.StartsWith("file:"))
            database = "file:" + database;
         db = new Mono.Data.Sqlite.SqliteConnection("Data Source="+database+";version=3"); 
      }
      else
         throw new ApplicationException("Unknown driver "+driver);
         
      db.Open();
      return db;
   }
   
   public void sql_close(IDbConnection db) {
      if (db != null) {
         try { db.Close(); }
         catch (Exception e) {}
      }
   }
   
   public IList sql_query(IDbConnection db, String sql) {
      IList rows = new ArrayList();
      IDbCommand cmd = db.CreateCommand();
      cmd.CommandText = sql;
      if (!queryVerbs.Contains(sql_verb(sql))) {
         rows.Add(cmd.ExecuteNonQuery());
         return rows;
      }
      
      IDataReader rs = cmd.ExecuteReader();
      int nf = rs.FieldCount;
      while (rs.Read()) {
         IDictionary row = new Hashtable();
         rows.Add(row);
         for (int f = 0; f < nf; f++)
            row.Add(rs.GetName(f), rs.GetValue(f));
      }
      
      rs.Close();
      return rows;
   }
   
   public void sql_save(IDbConnection db, Object data, String table, String select) {
      if (data is IDictionary)
         ;
      else if (data is ICollection) {
         foreach (Object e in (ICollection)data)
            sql_save(db, e, table, select);
         return;
      }
      else if (data == null && !empty_value(select))
         data = new Hashtable();
      else
         return;
         
      IDictionary map = (IDictionary)data;
      String q1 = null;
      String q2 = null;
      String q3 = null;
      foreach (DictionaryEntry e in map) {
         String key = e.Key.ToString();
         Object val = sql_encode(e.Value);
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
         sql_query(db, q1 + q2 + q3);
      else if (!empty_value(select))
         sql_query(db, "delete from "+table+" where "+select);
   }
   
   public IList sql_info(IDbConnection db, String table, String info) {
      if (db == null)
         throw new ApplicationException("Database object is empty");
      else if (info.Equals("fields")) {
         String sql = null;
         if (db.GetType().Name.ToLower().IndexOf("mysql") >= 0)
            sql = "SELECT column_name as name, data_type as type, character_maximum_length as size FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '"
                + table +"' order by ordinal_position";
         else if (db.GetType().Name.ToLower().IndexOf("pgsql") >= 0)
            sql = "SELECT COLUMN_NAME as name, DATA_TYPE as type, CHARACTER_MAXIMUM_LENGTH as size FROM INFORMATION_SCHEMA.COLUMNS WHERE  TABLE_NAME = '" 
                + table + "' ORDER BY ORDINAL_POSITION";
         else if (db.GetType().Name.ToLower().IndexOf("sqlite") >= 0) {
            IList rows = sql_query(db, "pragma table_info(" + table + ")");
            foreach (Object e in rows) {
               IDictionary row = (IDictionary)e;
               String type = (String)row["type"];
               if (type == null || type.Trim().Equals(""))
                  continue;
               int index = type.IndexOf("(");
               if (index < 0)
                  row["size"] = "";
               else {
                  row["size"] = int.Parse(type.Substring(index+1));
                  row["type"] = type.Substring(0, index);
               }
            }
            return rows;
         }
         else
            throw new ApplicationException("Unknown database driver: "+db.GetType());      
         return sql_query(db, sql);
      }
      else
         throw new ApplicationException("Unknown table info: "+info);
   }
   
   public IList sql_tables(IDbConnection db, String dbname) {
      String sql = null;
      if (db == null)
         throw new ApplicationException("Database object is empty");
      else if (db.GetType().Name.ToLower().IndexOf("mysql") >= 0)
         sql = "show tables";
      else if (db.GetType().Name.ToLower().IndexOf("pgsql") >= 0)
         sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
      else if (db.GetType().Name.ToLower().IndexOf("sqlite") >= 0)
         sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
      else
         throw new ApplicationException("Unknown database driver: "+db.GetType());
      
      IList rows = sql_query(db, sql);
      IList names = new ArrayList();
      foreach (Object row in rows) {
         IEnumerator i = ((IDictionary)row).Values.GetEnumerator();
         if (i.MoveNext())
            names.Add(i.Current);
      }
      return names;
   }
   
   public IList sql_databases(IDbConnection db, Object folder) {
      String sql = null;
      if (db == null)
         throw new ApplicationException("Database object is empty");
      else if (db.GetType().Name.ToLower().IndexOf("mysql") >= 0)
         sql = "show databases";
      else if (db.GetType().Name.ToLower().IndexOf("pgsql") >= 0)
         sql = "select datname from pg_database";
      else if (db.GetType().Name.ToLower().IndexOf("sqlite") >= 0) {
         IList lst = new ArrayList();
         if (!empty_value(folder)) {
            String path = folder.ToString();
            if (path[path.Length-1] != '/')
               path += '/';
            DirectoryInfo dir = new DirectoryInfo(path);
            if (dir.Exists) {
               foreach (FileInfo f in dir.GetFiles()) {
                  int dot = f.Name.LastIndexOf('.');
                  if (dot > 0 && f.Name.Substring(dot+1).ToLower().Equals("db")) {
                     Hashtable row = new Hashtable();
                     row["file"] = path + f.Name;
                     lst.Add(row);
                  }
               }
            }
         }
         return lst;
      }
      else
         throw new ApplicationException("Unknown database driver: "+db.GetType());
      
      IList rows = sql_query(db, sql);
      IList names = new ArrayList();
      foreach (Object row in rows) {
         IEnumerator i = ((IDictionary)row).Values.GetEnumerator();
         if (i.MoveNext())
            names.Add(i.Current);
      }
      return names;
   }
   
   public IList sql_drivers() {
      if (sqlDrivers == null) {
         sqlDrivers = new ArrayList();
         sqlDrivers.Add("mysql");
         sqlDrivers.Add("pgsql");
         sqlDrivers.Add("sqlite");
      }
      return sqlDrivers;
   }

   private String sql_verb(String sql) {
      if (sql == null)
         return null;
      sql = sql.Trim();
      int i, n = sql.Length;
      for (i = 0; i < n; i++) {
         if (sql[i] <= 32)
            break;
      }
      if (i == 0)
         return null;
      else
         return sql.Substring(0, i).ToLower();
   }

   private String sql_encode(Object val) {
      if (val == null)
         return "''";
      if (val is bool)
         return (bool)val ? "1" : "0";
      String txt = val.ToString();
      try { return long.Parse(txt).ToString(); }
      catch (Exception e) {
          try { return double.Parse(txt).ToString(); }
          catch (Exception e2) { return "'" + txt.Replace("'", "''") + "'"; }
      }
   }

   public static IDictionary map_value(Object src) {
      if (src is IDictionary)
         return (IDictionary)src;
      IDictionary map = new Dictionary<String,Object>();
      if (src == null)
         return map;
      foreach (PropertyInfo p in src.GetType().GetProperties()) {
         if (p.CanRead)
            map.Add(p.Name, p.GetValue(src, null));
      }
      return map;
   }
   
   public Object json_decode(String txt) {
      if (txt == null)
         return null;
      try {
         char[] chars = txt.Trim().ToCharArray();
         if (chars.Length == 0)
            return null;
         Object data = json_value(chars, new int[]{0, 0, 0});
         return data;
      }
      catch (Exception e) {
         return e.Message;
      }
   }

   public String json_encode(Object src) {
      return json_encode(src, 5);
   }

   public String json_encode(Object src, int level) {
      try {
         if (src == null || src is Void || src is DBNull) //empty
            return "null";
         else if (src is String) //text
            return json_escape(src.ToString());
         else if (src is char[]) //text
            return json_encode(new String((char[])src), level);
         else if (src is char) //text
            return json_encode(src+"", level);
         else if (src is byte[]) //text
            return json_encode(System.Text.Encoding.ASCII.GetString((byte[])src), level);
         else if (src is sbyte[]) //text
            return json_encode(System.Text.Encoding.ASCII.GetString((byte[])src), level);
         else if (src.GetType().IsEnum) //text
            return json_encode(src.ToString(), level);
         else if (src is bool) //number
            return src.Equals(true) ? "true" : "false";
         else if (src is DateTime) //entity
             return json_encode(String.Format("{0:yyyy-MM-dd HH:mm:ss}", src), level);
         else if (src is IConvertible) //number
            return src.ToString();
         else if (src is Uri) //text
             return json_encode(src.ToString(), level);
         else if (src is FileInfo) //text
             return json_encode(src.ToString(), level);
         else if (src is DirectoryInfo) //text
             return json_encode(src.ToString(), level);
         else if (src is Type)
             return json_encode(src.ToString(), level);
         else if (src is Exception) {
             String txt = ((Exception)src).Message;
             if (txt == null || txt.Trim().Equals(""))
                txt = src.GetType().ToString();
             return json_encode(txt, level);
         }
         // all the others can provoke stack overflow
         else if (level <= 0)
            return "\"...\"";
         else if (src is IDictionary) { //entity
            level--;
            String txt = "";
            foreach (DictionaryEntry e in (IDictionary)src) {
               if (!txt.Equals(""))
                   txt += ", ";
               txt += json_encode(e.Key.ToString(), level) + ":" + json_encode(e.Value, level);
            }
            return "{"+txt+"}";
         }
         else if (src is ICollection) { //group
            level--;
            String txt = "";
            foreach (Object e in (ICollection)src) {
	          if (!txt.Equals(""))
                  txt += ", ";
               txt += json_encode(e, level);
            }
            return "["+txt+"]";
         }
         else
            return json_encode(map_value(src), level);
      }
      catch (Exception e) { return json_encode(e, level); }
   }

   private String json_escape(String src) {
      String txt = "\"";
      int nb = src.Length;
      for (int i = 0; i < nb; i++) {
         char c = src[i];
         if (c == '\\')
            txt += "\\\\";
         else if (c == '"')
            txt += "\\\"";
         else if (c >= ' ' && c < 0x7f)
            txt += c;
         else
            txt += json_escape(c);
      }
      return txt + "\"";
   }

   private String json_escape(char c) {
      return "\\u"+string.Format("{0:x}", 0x10000+c).Substring(1);
   }

   private Object json_value(char[] chars, int[] status) {
      Object elem = null;
      StringBuilder buffer = null;
      int start = status[0];
      char end1 = (char)status[1];
      char end2 = (char)status[2];
      bool gotSpace = false;

      for (; status[0] < chars.Length; status[0]++) {
         char c = chars[status[0]];
         if (c == end1 || c == end2)
            break;
         else if (c <= ' ') {
            gotSpace = true;
            continue;
         }
         else if (buffer != null) {
            if (gotSpace)
               throw new ApplicationException("Syntax error (space in identifier) after "+new String(chars, start, status[0]-start));
            else if (!json_identifier(c) && c != '.')
               throw new ApplicationException("Syntax error (not an identifier character) after "+new String(chars, start, status[0]-start));
            buffer.Append(c);
         }
         else if (elem != null)
            throw new ApplicationException("Syntax error (element already found) after "+new String(chars, start, status[0]-start));
         else {
            switch (c) {
               case '"':
                  goto case '\'';
               case '\'':
                  status[0]++;
                  status[1] = status[2] = c;
                  elem = json_string(chars, status);
                  break;
               case '(':
                  status[0]++;
                  status[1] = status[2] = ')';
                  elem = json_value(chars, status);
                  break;
               case '[':
                  status[0]++;
                  elem = json_array(chars, status);
                  break;
               case '{':
                  status[0]++;
                  elem = json_object(chars, status);
                  break;
               default:
                  if (Char.IsDigit(c) || c == '-' || c == '+' || c == '.')
                     elem = json_number(chars, status);
                  else if (!json_identifier(c))
                     throw new ApplicationException("Syntax error (not an identifier starting character) after "+new String(chars, start, status[0]-start));
                  else {
                     buffer = new StringBuilder();
                     buffer.Append(c);
                  }
                  break;
            }
         }
      }

      if (end1 != 0 && status[0] >= chars.Length) {
         String endchars = ""+((char)status[1]);
         if (status[1] != status[2])
            endchars += ((char)status[1]);
         throw new ApplicationException("Syntax error (end character "+endchars+" not found) after "+new String(chars, start, status[0]-start));
      }
      else if (buffer != null) {
         String txt = buffer.ToString();
         if (txt.Equals("null"))
            return null;
         else if (txt.Equals("true"))
            return true;
         else if (txt.Equals("false"))
            return false;
         else
            throw new ApplicationException("Syntax error (invalid sequence "+txt+") after "+new String(chars, start, status[0]-start));
      }
      else
         return elem;
   }

   private String json_string(char[] chars, int[] status) {
      StringBuilder buffer = new StringBuilder();
      int start = status[0];
      char end1 = (char)status[1];
      char end2 = (char)status[2];

      for (; status[0] < chars.Length; status[0]++) {
         char c = chars[status[0]];
         if (c == end1 || c == end2)
            return buffer.ToString();
         else if (c == '\\') {
            status[0]++;
            if (status[0] >= chars.Length)
               break;
            c = chars[status[0]];
            switch (c) {
               case 'b':
                  buffer.Append('\b');
                  break;
               case 'f':
                  buffer.Append('\f');
                  break;
               case 'n':
                  buffer.Append('\n');
                  break;
               case 'r':
                  buffer.Append('\r');
                  break;
               case 't':
                  buffer.Append('\t');
                  break;
               case 'x':
                  try {
                     int ascii = Convert.ToInt32(new String(chars,status[0]+1, 2), 16);
                     buffer.Append((char)ascii);
                     status[0] += 2;
                  } catch (Exception e) {
                     throw new ApplicationException("Invalid ascii escape: "+e);
                  }
                  break;
               case 'u':
                  try {
                     int ascii = Convert.ToInt32(new String(chars,status[0]+1, 4), 16);
                     buffer.Append((char)ascii);
                     status[0] += 4;
                  } catch (Exception e) {
                     throw new ApplicationException("Invalid unicode escape: "+e);
                  }
                  break;
               case '"':
                  goto case '\\';
               case '\'':
                  goto case '\\';
               case '\\':
                  buffer.Append(c);
                  break;
               default:
                  throw new ApplicationException("Invalid escape \\"+c);
            }
         }
         else
            buffer.Append(c);
      }

      throw new ApplicationException("End of string not found after "+new String(chars, start, status[0]-start));
   }

   private Object json_number(char[] chars, int[] status) {
      StringBuilder buffer = new StringBuilder();
      int start = status[0];

      for (; status[0] < chars.Length; status[0]++) {
         char c = chars[status[0]];
         if ("0123456789+-.eExX".IndexOf(c) >= 0)
            buffer.Append(c);
         else {
            status[0]--;
            break;
         }
      }

      String txt = buffer.ToString().ToLower();
      if (txt.StartsWith("0x"))
         return Convert.ToInt32(txt.Substring(2), 16);
      else if (txt.IndexOf(".") >= 0 || txt.IndexOf("e") > 0)
         return double.Parse(txt);
      else if (txt.Length < 10)
         return int.Parse(txt);
      else
         return long.Parse(txt);
   }

   private IList json_array(char[] chars, int[] status) {
      IList lst = new ArrayList();
      int start = status[0];
      char c = '\0';

      for (; status[0] < chars.Length; status[0]++) {
         c = chars[status[0]];
         if (c == ']')
            break;
         else if (c > ' ') {
            status[1] = ',';
            status[2] = ']';
            lst.Add(json_value(chars, status));
            c = chars[status[0]];
            if (c == ']')
               break;
         }
      }

      if (c != ']')
         throw new ApplicationException("Missing end of array ]");
      return lst;
   }

   private IDictionary json_object(char[] chars, int[] status) {
      IDictionary obj = new Hashtable();
      String key = null;
      char c = '\0';

      for (; status[0] < chars.Length; status[0]++) {
         c = chars[status[0]];
         if (c == '}')
            break;
         else if (c > ' ') {
            status[1] = (key == null) ? ':' : ',';
            status[2] = '}';
            int current = status[0];
            Object elem = json_value(chars, status);
            if (key == null) {
               if (elem is String)
                  key = elem.ToString();
               else
                  throw new ApplicationException(elem+" is not a valid object key");
            } else {
               obj.Add(key, elem);
               key = null;
            }
            c = chars[status[0]];
            if (c == '}')
               break;
         }
      }

      if (key != null)
         throw new ApplicationException("key "+key+" does not have a value");
      else if (c != '}')
         throw new ApplicationException("Missing end of object }");
      return obj;
   }
   
   private bool json_identifier(char c) {
     return Char.IsLetter(c) || Char.IsDigit(c) || c == '_';
   }
}

