var TEXT_TYPE_NONE    = 0x00
var TEXT_TYPE_LETTER  = 0x01
var TEXT_TYPE_DIGIT   = 0x02
var TEXT_TYPE_SYMBOL  = 0x04
var TEXT_TYPE_QUOTED  = 0x08
var TEXT_TYPE_GROUP   = 0x10
var TEXT_TYPE_URI     = 0x20
function text_is_blank(c) { return c <= ' ' || (c >= '\x7F' && c <= '\xA0'); }
function text_is_digit(c) { return c >= '0' && c <= '9'; }
function text_is_letter(c) { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c >= '\xC0'; }
function text_is_group(c) { return "\"`'()[]{}".indexOf(c) >= 0; }
function text_is_symbol(c) { return !text_is_digit(c) && !text_is_letter(c) && !text_is_blank(c) && !text_is_group(c); }
function text_is_hexa(st) { return st.text.substring(st.word, st.word+2) == "0x"; }
function text_is_float(st) { 
   var txt = st.text.substring(st.word, st.pos).toLowerCase(); 
   return txt.indexOf('.') >= 0 || txt.indexOf('e') >= 0;
}
function text_is_exponant(st, c) {
   var txt = st.text.substring(st.word, st.pos).toLowerCase();
   return txt.indexOf('e') > txt.indexOf(c);
}
function text_is_number(st, c) {
   if (text_is_digit(c))
      return true;
   else if (st.word < 0)
      return (c == '-' || c == '+');
   switch (c) {
      case 'e':
      case 'E':
         return !text_is_hexa(st) && !text_is_exponant(st, ' ');
      case 'x':
      case 'X':
         return (st.pos - st.word == 1 && st.text.charAt(st.word) == '0');
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'F':
      case 'a':
      case 'b':
      case 'c':
      case 'd':
      case 'f':
         return text_is_hexa(st);
      case '-':
      case '+':
         return !text_is_hexa(st) && text_is_exponant(st, c);
      case '.':
         return !text_is_hexa(st) && !text_is_float(st);
      default:
         return false;
   }
}

function text_word(txt) {
   return null;
}

function text_uri(txt) {
   return {type:"uri", name:txt};
}

function text_number(txt) {
   if (txt == null)
      return 0;
   else if (txt.indexOf('.') >= 0)
      var n = parseFloat(txt);
   else if (txt.substring(0, 2) == "0x")
      var n = parseInt(txt.substring(2), 16);
   else if (txt.indexOf('e') >= 0 || txt.indexOf('E') >= 0 || txt.length > 9)
      var n = parseFloat(txt);
   else
      var n = parseInt(txt, 10);
   return isNaN(n) ? 0 : n;
}

function text_init(c, status) {
   status.word = status.pos;
   if (text_is_letter(c))
      status.type = TEXT_TYPE_LETTER;
   else if (text_is_digit(c))
      status.type = TEXT_TYPE_DIGIT;
   else if ((c == '-' || c == '+') && status.text.length > status.pos+1) {
      if (text_is_digit(status.text[status.pos+1]) /* and previous token was symbol/action */)
         status.type = TEXT_TYPE_DIGIT;
      else
         status.type = TEXT_TYPE_SYMBOL;
   }
   else if (text_is_symbol(c))
      status.type = TEXT_TYPE_SYMBOL;
   else
      status.type = TEXT_TYPE_URI;
}

function text_add(words, status) {
   if (status.word < 0)
      return;
   var txt = status.text.substring(status.word, status.pos);
   var obj = null;
   if (status.type & TEXT_TYPE_QUOTED)
      obj = txt;
   else if (status.type & TEXT_TYPE_DIGIT)
      obj = text_number(txt);
   else if (status.type & TEXT_TYPE_URI)
      obj = text_uri(txt);
   else if (status.type & TEXT_TYPE_SYMBOL) {
      obj = text_word(txt);
      if (obj == null)
         obj = txt;
   }
   else {
      obj = text_word(txt);
      if (obj == null)
         obj = {type:"word", name:txt};
   }

   words.push(obj);
   status.word = -1;
   status.type = TEXT_TYPE_NONE;
}
/***

syntax elements:
- blank: c <= ' ' || (c >= '\x7F' && c <= '\xA0')
- letter: (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c >= '\xC0'
- digit: c >= '0' && c <= '9'
- openString: c == '"' || c == '`' || c == "'"
- openGroup: "([{".indexOf(c) + 1
- closeGroup: ")]}".indexOf(c) + 1
- punctuation: ",;,!?".indexOf(c) + 1
- symbol: "+-*%/^\\<=>@#:&|~$_".indexOf(c) + 1

literal tokens:
- word: variable function keyword
- number: integer hexadecimal real complex probability
- string: single double or reverse quoted
- timestamp: date time year month weekday century era
- uri: word language-token url urn
- operator: group punctuation symbol

***/


function text_parse(status) {
   var end = status.end;
   var words = [];
   var quote = null;

   for (; status.pos < status.len; status.pos++) {
      var c = status.text.charAt(status.pos);
      if (c == end)
         break;
      else if (quote) {
         if (c == quote) {
            text_add(words, status);
            quote = 0;
         }
      }
      else {
         switch (c) {
            case '"':
            case '`':
            case '\'': // char type T (text)
               text_add(words, status);
               quote = c;
               status.word = status.pos + 1;
               status.type = TEXT_TYPE_QUOTED;
               break;
            case '(':
            case '{':
            case '[': // char type G (group)
               text_add(words, status);
               status.end = (c == '(') ? ')' : String.fromCharCode(c.charCodeAt(0)+2);
               status.pos++;
               val = text_parse(cx, st);
               if (val == null || val instanceof Error)
                  return val;
               words.push(val);
               break;
            case ')':
            case '}':
            case ']': // char type G (group)
               return new Error("Character not expected: "+c);
            case '.': // char type N|U|A (number|uri|action)
               if ((status.type & TEXT_TYPE_DIGIT) && !text_is_hexa(status) && !text_is_float(status))
                  break;
            case ':':
            case ',':
            case ';':
            case '?':
            case '!': // char type U|A (uri|action)
               /*if (status.type & TEXT_TYPE_URI)
                  break;
               else*/ if (status.type & TEXT_TYPE_DIGIT)
                  text_add(words, status);
               else if (status.word >= 0) {
                  c = status.text[status.pos+1];
                  if (text_is_blank(c))
                     text_add(words, status);
                  else {
                     status.type = TEXT_TYPE_URI;
                     break;
                  }
               }
            default:
               if (text_is_blank(c)) // char type _ (blank)
                  text_add(words, status);
               else if (status.word < 0)
                  text_init(c, status);
               else if ((status.type & TEXT_TYPE_SYMBOL) && (text_is_letter(c) || text_is_digit(c))) {
                  text_add(words, status);
                  text_init(c, status);
               }
               // should do better with this numeric check
               else if ((status.type & TEXT_TYPE_DIGIT) && !text_is_number(status, c)) {
                  text_add(words, status);
                  text_init(c, status);
               }
         }
      }
   }

   if (quote)
      return new Error("End of  not found: "+quote);
   else if (end && c != end)
      return new Error("Expected character not found: "+end);
   else
      text_add(words, status);
      
   return words;
}

function text_eval(txt) {
   if (txt == null)
      txt = "";
   else if (typeof(txt) != "string")
      txt = txt.toString();
   var status = {text:txt, len:txt.length, pos:0, end:"", word:-1};
   var tokens = text_parse(status);
   return tokens;
   // return (tokens == null || tokens instanceof Error) ? tokens : text_execute(text_compile(tokens));
}

function text_session(input, output, prompt) {
   if (prompt == null)
      prompt = "\n? ";
   var result = null;
   while (input && output) {
      output.write(prompt);
      output.flush();
      var txt = input.readLine().toString("UTF-8").trim();
      if (txt) {
         result = text_eval(txt);
         if (result instanceof Error)            
            output.write("Erreur: "+result+"\n");
         else if (result != null)
            output.write(result.length+" mots: "+json_encode(result)+"\n");
         output.flush();
      }
   }
   return result;
}


