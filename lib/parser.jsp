<%@ page import="java.util.*,java.io.*,java.lang.reflect.Array"%><%!

public Object text_eval(String txt) {
   if (txt == null)
      txt = "";
   return txt.trim().split(" ");
}

public Object text_session(InputStream input, OutputStream output, String prompt) {
   Object result = null;
   try {
      BufferedReader reader = null;
      if (prompt == null)
         prompt = "\n? ";
      while (input != null && output != null) {
         output.write(prompt.getBytes());
         output.flush();
         if (reader == null)
            reader = new BufferedReader(new InputStreamReader(input));
         String txt = reader.readLine();
         if (txt == null)
            break;
         else if (!txt.trim().equals("")) {
            result = text_eval(txt);
            int n = (result == null) ? 0 : (
                     result.getClass().isArray() ? Array.getLength(result) : (
                    (result instanceof Collection) ? ((Collection)result).size() : 1));
            output.write((n+" mots: "+json_encode(result)+"\n").getBytes());
            output.flush();
         }
      }
   }
   catch (Exception e) { result = e; }
   return result;
}

%>
