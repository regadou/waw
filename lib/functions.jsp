<%@ page import="java.util.*,java.io.*,java.sql.*,java.text.SimpleDateFormat,java.lang.reflect.Array"%><%!

private static Map<String,String> mimetypes = null;
private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

private static final List<String> queryVerbs = Arrays.asList("select,show,pragma".split(","));
//private static enum MetaData { PRODUCT, CATALOG, TABLE, COLUMN, PRIMARY, IMPORTED, EXPORTED };
private static final String[][] drivers = {
   {"derby",      "org.apache.derby.jdbc.EmbeddedDriver"},
   {"hsqldb",     "org.hsqldb.jdbcDriver"},
   {"mysql",      "com.mysql.jdbc.Driver", "mysql"},
   {"odbc",       "sun.jdbc.odbc.JdbcOdbcDriver"},
   {"oracle",     "oracle.jdbc.driver.OracleDriver"},
   {"postgresql", "org.postgresql.Driver", "postgres"},
   {"access",     "org.regadou.jmdb.MDBDriver"},
   {"sqlserver",  "com.microsoft.sqlserver.jdbc.SQLServerDriver"},
   {"sqlite",     "org.sqlite.JDBC"}
};


public void http_log(Object obj) {
   System.out.println(obj);
}

public Map<String,String> http_params(javax.servlet.ServletRequest request) {
   Map<String,String> map = new LinkedHashMap<String,String>();
   Enumeration e = request.getParameterNames();
   while (e.hasMoreElements()) {
      String key = e.nextElement().toString();
      map.put(key, request.getParameter(key));
   }
   return map;
}

public boolean empty_value(Object obj) {
   if (obj == null)
      return true;
   else if (obj.getClass().isArray())
      return Array.getLength(obj) == 0;
   else if (obj instanceof Collection)
      return ((Collection)obj).isEmpty();
   else if (obj instanceof Map)
      return ((Map)obj).isEmpty();
   else
      return obj.toString().trim().equals("");
}

public File file_path(String base, String path) {
   if (File.separatorChar != '/')
      path = path.replace('/', File.separatorChar);
   if (path == null)
      path = File.separator;
   if (path.charAt(0) != File.separatorChar)
      path = File.separator + path;
   if (base == null)
      base = "";
   return new File(base + path);
} 

public void file_save(Object path, Object data) throws Exception {
   File file = file_value(path);
   byte bytes[];
   if (data == null) {
      if (!file.delete())
         throw new RuntimeException("Cannot delete "+file);
      return;
   }
   else if (data.getClass().isArray())
      bytes = Arrays.asList((Object[])data).toString().getBytes();
   else if (data instanceof Map) {
      Map map = (Map)data;
      Object t = map.get("type");
      Object b = map.get("bytes");
      if (t == null || b == null)
         throw new RuntimeException("Missing type or bytes properties for data");
      else if (t.equals("ascii"))
         bytes = b.toString().getBytes();
/**
      else if (t.equals("base64"))
         ;
      else if (t.equals("hexa"))
         ;
      else if (t.equals("binary"))
         ;
**/
      else
         throw new RuntimeException("Unknown data type: "+t);
   }
   else
      bytes = data.toString().getBytes();
   FileOutputStream out = new FileOutputStream(file);   
   out.write(bytes);
   out.close();
}

public boolean file_exists(Object file) {
   return file_value(file).exists();
}

public Object file_stat(Object path, int level, boolean foldersOnly) throws Exception {
   File file = file_value(path);
   boolean isfolder = file.isDirectory();
   if (foldersOnly) {
      List folders = new ArrayList();
      if (isfolder) {
         List<File> files = file_list(file);
         for (File f : files) {
            if (f.isDirectory())
               folders.add(f.getName());
         }
      }
      return folders;
   }
   else if (isfolder && level == 0) {
      List<File> files = file_list(file);
      List data = new ArrayList();
      for (File f : files)
         data.add(file_stat(f, 1, foldersOnly));
      return data;
   }
   else {
      String name = file.getName();
      String type = isfolder ? "inode/directory" : file_mimetype(name);
      Map map = new LinkedHashMap();
      map.put("name", name);
      map.put("size", file.length());
      map.put("modified", new java.util.Date(file.lastModified()));
      map.put("type", type);
      return map;
   }
}

public List<File> file_list(Object path) {
   File file = file_value(path);
   if (!file.isDirectory())
      return new ArrayList<File>();
   List<File> files = Arrays.asList(file.listFiles());
   Collections.sort(files, new Comparator<File>() {
      public boolean equals(Object o) { return this.equals(o); }
      public int compare(File f1, File f2) { return f1.getName().compareToIgnoreCase(f2.getName()); }
   });
   return files;
}

public String file_read(String path) throws Exception {
   File file = new File(path);
   if (file.isDirectory()) {
      String txt = "";
      for (String name : file.list())
         txt += name + "\n";
      return txt;
   }
   else if (!file.exists())
      return "";
   else {
      byte[] buffer = new byte[(int)file.length()];
      FileInputStream input = new FileInputStream(path);
      input.read(buffer);
      return new String(buffer);
   }
}

public String file_mimetype(String name) throws Exception {
   if (mimetypes == null) {
      String[] lines = file_read(mimetypesFile).replace('\t', ' ').split("\n");
      mimetypes = new LinkedHashMap();
      for (String line : lines) {
         int i = line.indexOf('#');
         if (i >= 0)
            line = line.substring(0, i);
         line = line.trim();
         if (line.equals(""))
            continue;
         String[] tokens = line.split(" ");
         String type = null;
         for (String token : tokens) {
            if (token.equals(""))
               continue;
            else if (type == null)
               type = token;
            else if (mimetypes.get(token) == null)
               mimetypes.put(token, type);
         }
      }
   }
   
   String ext = "";
   if (name != null && !name.equals("")) {
      String[] parts = name.split("/");
      parts = parts[parts.length-1].split("\\.");
      if (parts.length > 1)
         ext = parts[parts.length-1];
   }
   String type = mimetypes.get(ext);
   return (type == null) ? mimetypes.get("txt") : type;
}

public File file_value(Object src) {
   if (src instanceof File)
      return (File)src;
   else if (src == null)
      return new File("");
   else
      return new File(src.toString());
}

public Connection sql_open(Map<String,String> param) {
   String driver = param.get("driver");
   if (empty_value(driver))
      throw new RuntimeException("No database driver specified");
   String url = "jdbc:" + driver + ":";
   String dbname = param.get("database");
   if (driver.equals("sqlite"))
      url += empty_value(dbname) ? "/:memory:" : "/"+dbname;
   else {
      String host = empty_value(param.get("host")) ? "localhost" : param.get("host");
      if (!empty_value(param.get("port")))
         host += ":" + param.get("host");
      url += "//" + host;
      if (!empty_value(dbname))
         url += "/" + dbname;
   }
   String user = empty_value(param.get("user")) ? "" : param.get("user");
   String pass = empty_value(param.get("pass")) ? "" : param.get("pass");
   try {
      for (String[] d : drivers) {
         if (d[0].equals(driver)) {
            Class.forName(d[1]).newInstance();
            if (empty_value(dbname) && d.length > 2)
               url += "/" + d[2];
            return DriverManager.getConnection(url, user, pass);
         }
      }
   }
   catch (Exception e) {
      throw new RuntimeException("Could not load JDBC driver for "+url+": "+e.getMessage(), e);
   }
   throw new RuntimeException("Cannot find driver for "+url);
}

public void sql_close(Connection db) {
   if (db != null) {
      try { db.close(); }
      catch (Exception e) {}
   }
}

public List<Map<String,Object>> sql_query(Connection db, String sql) throws Exception {
   if (sql == null)
      return new ArrayList<Map<String,Object>>();
   Statement st = db.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
   List<Map<String,Object>> lst;
   String verb = sql_verb(sql);
   if (queryVerbs.contains(verb)) {
      ResultSet rs = st.executeQuery(sql);
      lst = sql_rows(rs);
   }
   else if (verb != null) {
      int n = st.executeUpdate(sql);
      lst = Collections.singletonList(Collections.singletonMap(verb, (Object)new Integer(n)));
   }
   else
      lst = new ArrayList<Map<String,Object>>();
   try { st.close(); }
   catch (Exception e) {}
   return lst;
}

public void sql_save(Connection db, Object data, String table, String select) throws Exception {
   if (data instanceof Map)
      ;
   else if (data instanceof Collection) {
      for (Object e : (Collection)data)
         sql_save(db, e, table, select);
      return;
   }
   else if (data == null && !empty_value(select))
      data = Collections.EMPTY_MAP;
   else
      return;
      
   Map map = (Map)data;
   String q1 = null;
   String q2 = null;
   String q3 = null;
   for (Object key : map.keySet()) {
      Object val = sql_encode(map.get(key));
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

public Object sql_info(Connection db, String table, String info) throws Exception {
   if (info.equals("fields")) {
      List lst = new ArrayList();
	   String[] parts = db.getMetaData().getURL().split("/");
	   String dbname = parts[parts.length-1].split("\\?")[0];
      for (Map col : sql_rows(db.getMetaData().getColumns(dbname, null, table, null))) {
         Map field = new LinkedHashMap();
         lst.add(field);
         field.put("name", col.get("column_name"));
         field.put("type", col.get("type_name"));
         field.put("size", col.get("column_size"));
      }
      return lst;
   }
   else if (info.equals("primary"))
      return sql_rows(db.getMetaData().getPrimaryKeys(null, null, table));
   else if (info.equals("imported"))
      return sql_rows(db.getMetaData().getImportedKeys(null, null, table));
   else if (info.equals("exported"))
      return sql_rows(db.getMetaData().getExportedKeys(null, null, table));
   else
      return "Unknown table information "+info;
}

public List<String> sql_tables(Connection db, String dbname) throws Exception {
   List<String> lst = new ArrayList<String>();
   for (Map obj : sql_rows(db.getMetaData().getTables(dbname, null, null, null))) {
      String type = obj.get("table_type").toString().toLowerCase();
      if (type.equals("table"))
         lst.add(obj.get("table_name").toString());
   }
   return lst;
}

public List<String> sql_databases(Connection db, Object folder) throws Exception {
// accept folder parameter for sqlite folder listing
   List<String> lst = new ArrayList<String>();
   for (Map obj : sql_rows(db.getMetaData().getCatalogs()))
      lst.add(obj.get("table_cat").toString());
   return lst;
}

public List<String> sql_drivers() {
   List<String> lst = new ArrayList<String>();
   for (String[] driver : drivers) {
      try {
         Class.forName(driver[1]);
         lst.add(driver[0]);
      }
      catch (Exception e) {}
   }
   return lst;
}

public Object json_decode(String txt) {
   if (txt == null)
      return null;
   try {
      char[] chars = txt.trim().toCharArray();
      if (chars.length == 0)
         return null;
      return json_value(chars, new int[]{0, 0, 0});
   }
   catch (Exception e) {
      return e;
   }
}

public String json_encode(Object src) {
   return json_encode(src, 5);
}

public String json_encode(Object src, int level) {
   try {
      if (src == null || src instanceof Void) //empty
         return "null";
      else if (src instanceof CharSequence) //text
         return json_escape(src.toString());
      else if (src instanceof char[]) //text
         return json_encode(new String((char[])src), level);
      else if (src instanceof byte[]) //text
         return json_encode(new String((byte[])src), level);
      else if (src.getClass().isEnum()) //text
         return json_encode(src.toString(), level);
      else if (src instanceof Boolean) //number
         return ((Boolean)src).booleanValue() ? "true" : "false";
      else if (src instanceof Number) //number
         return src.toString();
      else if (src instanceof java.util.Date) //entity
          return '"' + dateFormat.format((java.util.Date)src) + '"';
      else if (src instanceof Calendar) //entity
          return json_encode(((Calendar)src).getTime());
      else if (src instanceof java.net.URL) //text
          return json_encode(src.toString(), level);
      else if (src instanceof java.net.URI) //text
          return json_encode(src.toString(), level);
      else if (src instanceof java.io.File) //text
          return json_encode(((java.io.File)src).getCanonicalPath(), level);
      else if (src instanceof Class)
          return json_encode(((Class)src).getName(), level);
      else if (src instanceof Throwable) {
          String txt = ((Throwable)src).getMessage();
          if (txt == null || txt.trim().equals(""))
             txt = src.getClass().getName();
          return json_encode(txt, level);
      }

      // these 2 are placed before the stack overflow protection because class property makes no sense for them
      else if (src instanceof Collection) { //group
         level--;
         String txt = "";
         for (Object e : (Collection)src) {
	       if (!txt.equals(""))
               txt += ", ";
            txt += json_encode(e, level);
         }
         return "["+txt+"]";
      }
      else if (src.getClass().isArray()
            || src instanceof Iterator
            || src instanceof Iterable
            || src instanceof Enumeration) //group
          return json_encode(list_value(src), level);

      // all the others can provoke stack overflow
      else if (level <= 0)
         return "\"...\"";
      else if (src instanceof Map) { //entity
         level--;
         String txt = "";
         for (Map.Entry e : (Collection<Map.Entry>)((Map)src).entrySet()) {
            if (!txt.equals(""))
                txt += ", ";
            txt += json_encode(String.valueOf(e.getKey()), level) + ":" + json_encode(e.getValue(), level);
         }
         return "{"+txt+"}";
      }
      else
         return json_encode(new org.apache.commons.beanutils.BeanMap(src), level);
   }
   catch (Exception e) { return json_encode(e, level); }
}

public String json_sql(Object obj) {
   if (obj == null)
      return "''";
   else if (obj instanceof CharSequence)
      return "'" + obj.toString().replace("'", "''") + "'";
   else if (obj instanceof Number)
      return obj.toString();
   else if (obj instanceof Boolean)
      return ((Boolean)obj).booleanValue() ? "1" : "0";
   else if (obj instanceof java.util.Date)
      return "'" + dateFormat.format((java.util.Date)obj) + "'";
   else if (obj instanceof Object[])
      return json_sql(Arrays.asList((Object[])obj));
   else if (obj instanceof Collection) {
      String txt = "";
      for (Object e : (Collection)obj) {
         if (sql_value(e))
            continue;
         else if (!txt.equals(""))
            txt += " or ";
         txt += "("+json_sql(e)+")";
      }
      return txt;
   }
   else {
      Map map = (obj instanceof Map) ? (Map)obj : new org.apache.commons.beanutils.BeanMap(obj);
      String txt = "";
      for (Object key : map.keySet()) {         
         if (!txt.equals(""))
            txt += " and ";
         Object value = map.get(key);
         if (value instanceof Object[] || value instanceof Collection) {
            Collection lst = (value instanceof Collection) ? (Collection)value : Arrays.asList((Object[])value);
            switch (lst.size()) {
               case 0:
                  txt += key + " = " + json_sql(null);
                  break;
               case 1:
                  txt += key + " = " + json_sql(lst.iterator().next());
                  break;
               case 2:
                  Object[] values = lst.toArray();
                  if (sql_value(values[0]) && sql_value(values[1])) {
                     txt += key + " >= " + json_sql(values[0]) + " and " + key + " <= " + json_sql(values[1]);
                     break;
                  }
               default:
                  String sub = "";
                  for (Object e : lst) {
                     if (!sub.equals(""))
                        sub += " or ";
                     if (sql_value(e))
                        sub += key + " = ";
                     sub += json_sql(e);
                  }
                  txt += "(" + sub + ")";
            }
         }
         else
            txt += key + " = " + json_sql(value);
      }
      return txt;
   }
}

public boolean sql_value(Object value) {
   return value == null || value instanceof CharSequence || value instanceof Number || value instanceof Boolean || value instanceof java.util.Date;
}

private List<Map<String,Object>> sql_rows(ResultSet rs) throws Exception {
   ResultSetMetaData meta = rs.getMetaData();
   int nc = meta.getColumnCount();
   List<Map<String,Object>> lst = new ArrayList<Map<String,Object>>();
   while (rs.next()) {
      Map map = new LinkedHashMap<String,Object>();
      for (int c = 1; c <= nc; c++) {
         String col = meta.getColumnName(c).toLowerCase();
         Object val = rs.getObject(c);
         map.put(col, val);
      }
      lst.add(map);
   }
   return lst;
}

private String sql_encode(Object val) {
   if (val == null)
      return "''";
   if (val instanceof Boolean)
      return ((Boolean)val).booleanValue() ? "1" : "0";
   String txt = val.toString();
   try { return new Long(txt).toString(); }
   catch (Exception e) {
       try { return new Double(txt).toString(); }
       catch (Exception e2) { return "'" + txt.replace("'", "''") + "'"; }
   }
}

private String sql_verb(String sql) {
   if (sql == null)
      return null;
   sql = sql.trim();
   int i, n = sql.length();
   for (i = 0; i < n; i++) {
      if (sql.charAt(i) <= 32)
         break;
   }
   if (i == 0)
      return null;
   else
      return sql.substring(0, i).toLowerCase();
}

private Object json_value(char[] chars, int[] status) throws Exception {
   Object elem = null;
   StringBuilder buffer = null;
   int start = status[0];
   char end1 = (char)status[1];
   char end2 = (char)status[2];
   boolean gotSpace = false;

   for (; status[0] < chars.length; status[0]++) {
      char c = chars[status[0]];
      if (c == end1 || c == end2)
         break;
      else if (c <= ' ') {
         gotSpace = true;
         continue;
      }
      else if (buffer != null) {
         if (gotSpace)
            throw new RuntimeException("Syntax error (space in identifier) after "+new String(chars, start, status[0]-start));
         else if (!json_identifier(c) && c != '.')
            throw new RuntimeException("Syntax error (not an identifier character) after "+new String(chars, start, status[0]-start));
         buffer.append(c);
      }
      else if (elem != null)
         throw new RuntimeException("Syntax error (element already found) after "+new String(chars, start, status[0]-start));
      else {
         switch (c) {
            case '"':
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
               if (Character.isDigit(c) || c == '-' || c == '+' || c == '.')
                  elem = json_number(chars, status);
               else if (!json_identifier(c))
                  throw new RuntimeException("Syntax error (not an identifier starting character) after "+new String(chars, start, status[0]-start));
               else {
                  buffer = new StringBuilder();
                  buffer.append(c);
               }
         }
      }
   }

   if (end1 != 0 && status[0] >= chars.length) {
      String endchars = ""+((char)status[1]);
      if (status[1] != status[2])
         endchars += ((char)status[1]);
      throw new RuntimeException("Syntax error (end character "+endchars+" not found) after "+new String(chars, start, status[0]-start));
   }
   else if (buffer != null) {
      String txt = buffer.toString();
      if (txt.equals("null"))
         return null;
      else if (txt.equals("true"))
         return true;
      else if (txt.equals("false"))
         return false;
      else
         throw new RuntimeException("Syntax error (invalid sequence "+txt+") after "+new String(chars, start, status[0]-start));
   }
   else
      return elem;
}

private String json_string(char[] chars, int[] status) throws Exception {
   StringBuilder buffer = new StringBuilder();
   int start = status[0];
   char end1 = (char)status[1];
   char end2 = (char)status[2];

   for (; status[0] < chars.length; status[0]++) {
      char c = chars[status[0]];
      if (c == end1 || c == end2)
         return buffer.toString();
      else if (c == '\\') {
         status[0]++;
         if (status[0] >= chars.length)
            break;
         c = chars[status[0]];
         switch (c) {
            case 'b':
               buffer.append('\b');
               break;
            case 'f':
               buffer.append('\f');
               break;
            case 'n':
               buffer.append('\n');
               break;
            case 'r':
               buffer.append('\r');
               break;
            case 't':
               buffer.append('\t');
               break;
            case 'x':
               try {
                  int ascii = Integer.parseInt(new String(chars,status[0]+1, 2), 16);
                  buffer.append((char)ascii);
                  status[0] += 2;
               } catch (Exception e) {
                  throw new RuntimeException("Invalid ascii escape: "+e.getMessage());
               }
               break;
            case 'u':
               try {
                  int ascii = Integer.parseInt(new String(chars,status[0]+1, 4), 16);
                  buffer.append((char)ascii);
                  status[0] += 4;
               } catch (Exception e) {
                  throw new RuntimeException("Invalid unicode escape: "+e.getMessage());
               }
               break;
            case '"':
            case '\'':
            case '\\':
               buffer.append(c);
               break;
             default:
               throw new RuntimeException("Invalid escape \\"+c);
         }
      }
      else
         buffer.append(c);
   }

   throw new RuntimeException("End of string not found after "+new String(chars, start, status[0]-start));
}

private Number json_number(char[] chars, int[] status) throws Exception {
   StringBuilder buffer = new StringBuilder();
   int start = status[0];
   boolean end = false;

   for (; status[0] < chars.length; status[0]++) {
      char c = chars[status[0]];
      switch (c) {
         case '0':
         case '1':
         case '2':
         case '3':
         case '4':
         case '5':
         case '6':
         case '7':
         case '8':
         case '9':
         case '+':
         case '-':
         case '.':
         case '%':
         case 'e':
         case 'E':
         case 'x':
         case 'X':
         case 'i':
         case 'I':
            buffer.append(c);
            break;
         default:
            end = true;
            status[0]--;
      }
      if (end) break;
   }

   String txt = buffer.toString().toLowerCase();
   if (txt.startsWith("0x"))
      return new Integer(Integer.parseInt(txt.substring(2), 16));
   else if (txt.indexOf(".") >= 0 || txt.indexOf("e") > 0)
      return new Double(txt);
   else if (txt.length() < 10)
      return new Integer(txt);
   else
      return new Long(txt);
}

private List json_array(char[] chars, int[] status) throws Exception {
   List lst = new ArrayList();
   int start = status[0];
   char c = 0;

   for (; status[0] < chars.length; status[0]++) {
      c = chars[status[0]];
      if (c == ']')
         break;
      else if (c > ' ') {
         status[1] = ',';
         status[2] = ']';
         lst.add(json_value(chars, status));
         c = chars[status[0]];
         if (c == ']')
            break;
      }
   }

   if (c != ']')
      throw new RuntimeException("Missing end of array ]");
   return lst;
}

private Map json_object(char[] chars, int[] status) throws Exception {
   Map obj = new LinkedHashMap();
   String key = null;
   char c = 0;

   for (; status[0] < chars.length; status[0]++) {
      c = chars[status[0]];
      if (c == '}')
         break;
      else if (c > ' ') {
         status[1] = (key == null) ? ':' : ',';
         status[2] = '}';
         int current = status[0];
         Object elem = json_value(chars, status);
         if (key == null) {
            if (elem instanceof String)
               key = elem.toString();
            else
               throw new RuntimeException(elem+" is not a valid object key");
         } else {
            obj.put(key, elem);
            key = null;
         }
         c = chars[status[0]];
         if (c == '}')
            break;
      }
   }

   if (key != null)
      throw new RuntimeException("key "+key+" does not have a value");
   else if (c != '}')
      throw new RuntimeException("Missing end of object }");
   return obj;
}

private boolean json_identifier(char c) {
   return Character.isJavaIdentifierPart(c);
}

private String json_escape(String src) {
   StringBuilder txt = new StringBuilder("\"");
   int nb = src.length();
   for (int i = 0; i < nb; i++) {
      char c = src.charAt(i);
      if (c == '\\')
         txt.append("\\\\");
      else if (c == '"')
         txt.append("\\\"");
      else if (c >= ' ' && c < 0x7f)
         txt.append(c);
      else
         txt.append(json_escape(c));
   }
   return txt.append("\"").toString();
}

private String json_escape(char c) {
   return "\\u"+Integer.toHexString(c+0x10000).substring(1);
}

public List list_value(Object src) {
   List lst = new ArrayList();
   if (src == null)
      return lst;
   else if (src.getClass().isArray()) {
      int n = Array.getLength(src);
      for (int i = 0; i < n; i++)
         lst.add(Array.get(src, i));
   }
   else if (src instanceof Iterator) {
      Iterator i = (Iterator)src;
      while (i.hasNext())
         lst.add(i.next());
   }
   else if (src instanceof Iterable) {
      Iterator i = ((Iterable)src).iterator();
      while (i.hasNext())
         lst.add(i.next());
   }
   else if (src instanceof Enumeration) {
      Enumeration e = (Enumeration)src;
      while (e.hasMoreElements())
         lst.add(e.nextElement());
   }
   else if (src instanceof Map) {
      for (Object e : ((Map)src).entrySet())
         lst.add(e);
   }
   else
      lst.add(src);
   return lst;
}

%>
