<?php                  

function text_eval($txt) {
   if ($txt == null)
      $txt = "";
   else if (!is_string($txt))
      $txt = strval($txt);
   return explode(" ", trim($txt));
}

function text_session($input, $output, $prompt) {
   if ($prompt == null)
      $prompt = "\n? ";
   $result = null;
   while ($input != null && $output != null) {
      fwrite($output, $prompt);
      $txt = trim(fgets($input));
      if ($txt != null && trim($txt) != "") {
         $result = text_eval($txt);
         fwrite($output, count($result) . " mots: " . json_encode($result) . "\n");
      }
   }
   return $result;
}

?>
