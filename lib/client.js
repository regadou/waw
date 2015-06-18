 var dhtmlxForm = false;
 var dbSeparator = "#";
 var agendaPrefix = "_agenda_";
 var dataUrls = {
    images: "dhtmlx/imgs/",
    addIcon: "res/add.png",
    delIcon: "res/del.png",
    editIcon: "res/edit.png",
    intro: "res/intro.html",
    config: ["data/config.json", "res/config.json"],
    script: "waw.*",
    test: "lib/test."
 };
 var configMenuChoices = [
    "&nbsp;<img src='"+dataUrls.addIcon+"' height='20'>&nbsp;Ajouter",
    "&nbsp;<img src='"+dataUrls.editIcon+"' height='20'>&nbsp;Modifier",
    "&nbsp;<img src='"+dataUrls.delIcon+"' height='20'>&nbsp;Supprimer",
    "<hr style='color:c7d4df'>",
    "&nbsp;<img src='"+dataUrls.images+"/leaf.gif' height='20'>&nbsp;Autre choix"
 ];
 var fileHeaders = "name,size,modified,type".split(",");
 var dbProperties = "driver,database,table".split(",");
 var buttonSpacer = " &nbsp; ";
 var loadedData = {cache:{}, menuPanel:null, contentPanel:null, editorContent:{}, agendaEvents:{}};
 var windowFactory = null;
 var configData = null;
 var configMenu = null;
 var mainLayout = null;
 var inited = false;
 var debug = false;
 document.adminForms = {};

 function init(target) {
    if (inited) return true;
    if (!windowFactory) {
       windowFactory = initWindowFactory();
       if (!windowFactory) return false;
    }
    initEditor();
    if (!loadConfigData(target)) return false;
    initMainLayout(target);
    initLeftPanel(loadedData.menuPanel);
    loadFolder("/");
    inited = true;
    return true;
 }

 function toJson(obj) {
    if (obj == null)
       return "null";
    switch (typeof(obj)) {
       case 'number':
       case 'boolean':
          return obj.toString();
       case 'function':
          return '"function '+obj.name+'"';
       case 'string':
          return '"'+replace(obj,'"','\\"')+'"';
       default:
          if (obj instanceof Array) {
             var txt = null;
             for (var p in obj) {
                if (txt)
                   txt += ", ";
                else
                   txt = "[";
                txt += toJson(obj[p]);
             }
             return txt ? txt+"]" : "[]";
          }
          else if (obj instanceof Date)
             return '"' + printDate(obj) + '"';
          else if (obj instanceof RegExp)
             return toJson(obj.toString());
          else {
             var txt = null;
             for (var p in obj) {
                if (txt)
                   txt += ", ";
                else
                   txt = "{";
                txt += toJson(p) + ":" + toJson(obj[p]);
             }
             return txt ? txt+"}" : "{}";
          }
    }
 }

 function toSql(obj) {
    if (obj == null)
       return "''";
    switch (typeof(obj)) {
       case 'string':
       case 'function':
          return "'" + replace(obj.toString(), "'", "''") + "'";
       case 'number':
          return obj.toString();
       case 'boolean':
          return obj ? "1" : "0";
       default:
          if (obj instanceof Date)
             return "'" + printDate(obj) + "'";
          else if (obj instanceof RegExp)
             return toSql(obj.toString());
          else if (obj instanceof Array) {
             var txt = "";
             for (var i = 0; i < obj.length; i++) {
                var e = obj[i];
                if (e == null || typeof(obj) != "object")
                   continue;
                else if (txt != "")
                   txt += " or ";
                txt += "("+toSql(e)+")";
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
                         txt += p + " = " + toSql(null);
                         break;
                      case 1:
                         txt += p + " = " + toSql(value[0]);
                         break;
                      case 2:
                         if (isSqlValue(value[0]) && isSqlValue(value[1])) {
                            txt += p + " >= " + toSql(value[0]) + " and " + p + " <= " + toSql(value[1]);
                            break;
                         }
                      default:
                         var sub = "";
                         for (var i = 0; i < value.length; i++) {
                            if (sub != "")
                               sub += " or ";
                            var e = value[i];
                            if (isSqlValue(e))
                               sub += p + " = ";
                            sub += toSql(e)
                         }
                         txt += "(" + sub + ")";
                   }
                }
                else
                   txt += p + " = " + toSql(value);
             }
             return txt;
          }
    }
 }

 function isSqlValue(value) {
    return value == null || typeof(value) != "object" || value instanceof Date || value instanceof RegExp;
 }

 function printDate(date) {
    if (date == null)
       return "";
    else if (date instanceof Date)
       ;
    else if (!isNaN(date))
       date = new Date(date);
    else
       return date.toString();

    return date.getFullYear() + "-" + (date.getMonth()+101).toString().substring(1) + "-" + (date.getDate()+100).toString().substring(1)
                              + ' ' + (date.getHours()+100).toString().substring(1) + "-" + (date.getMinutes()+100).toString().substring(1)
                              + "-" + (date.getSeconds()+100).toString().substring(1);
 }

 function loadList(url) {
    try {
       var lst = eval(load(url));
       return (lst instanceof Array) ? lst : [lst];
    }
    catch (e) { return [e.toString()]; }
 }

 function getUserData(parent, id, fields) {
    var obj = {};
    for (var f in fields) {
       var field = fields[f];
       obj[field] = parent.getUserData(id, field);
    }
    return obj;
 }

 function toFormData(data) {
    lst = [];
    if (data instanceof Array)
       data = data[0];
    for (var p in data)
       lst.push({type:"input", name:p, label:p, value:data[p]});
    return lst;
 }

 function extractFields(src, flds) {
    var dst = {};
    if (flds == null)
       return dst;
    else if (!(flds instanceof Array)) {
       var old = flds;
       var flds = [];
       for (var f in old)
          flds.push(f);
    }
    for (var f in flds) {
       var fld = flds[f];
       dst[fld] = (src == null) ? null : src[fld];
    }
    return dst;
 }

 function encodeUri(obj) {
    if (obj == null)
       return "";
    else if (typeof(obj) != "object")
       return typeof(obj)+"="+encodeURIComponent(obj);
    else if (obj instanceof Array)
       return "array=["+encodeURIComponent(obj)+"]";

    var uri = [];
    for (var p in obj) {
       var value = obj[p];
       if (value == null)
          value = "";
       uri.push(encodeURIComponent(p)+"="+encodeURIComponent(value));
    }
    return uri.join("&");
 }

 function getValueType(value) {
    if (value == null)
       return "null";
    else if (value instanceof Array)
       return "array";
    else if (value instanceof Date)
       return "date";
    else
       return typeof(value);
 }

 function getDate(src) {
   if (src instanceof Date)
      return src;
   else if (src == null)
      return null;

   var d = src.toString().split("-");
   if (d.length != 3)
      return null;
   var h = d[2].toLowerCase().split(":");
   if (h.length > 1 && h.length <= 3) {
      var i = h[0].indexOf(' ');
      if (i < 0)
         var i = h[0].indexOf('t');
      h[0] = h[0].substring(i+1);
   }
   else
      h = [0,0,0];

   d = new Date(parseInt(d[0],10),parseInt(d[1],10)-1,parseInt(d[2],10),parseInt(h[0],10),parseInt(h[1],10),parseInt(h[2],10));
   return isNaN(d) ? null : d;
 }

 function replace(txt, src, dst) {
    if (txt == null || txt == "" || !src)
       return txt;
    if (!dst)
       dst = "";
    if (typeof(txt) != "string")
       txt = txt.toString();
    for (var index = 0; index >= 0;) {
       index = txt.indexOf(src);
       if (index >= 0)
          txt = txt.substring(0, index) + dst + txt.substring(index + src.length);
    }
    return txt;
 }

 function renderText(txt) {
    if (txt == null)
       return "";
    else if (typeof(txt) != "string")
       txt = txt.toString();
    var index = 0;
    while (index >= 0) {
       index = txt.indexOf("${");
       if (index >= 0) {
          var start = txt.substring(0, index);
          var end = txt.substring(index+2);
          var index2 = end.indexOf("}");
          if (index2 < 0)
             index2 = end.length;
          try { var value = eval(end.substring(0,index2)); }
          catch (e) { var value = e; }
          txt = start + value + end.substring(index2+1);
       }
    }
    return txt;
 }

 function getDocumentRoot() {
    if (loadedData.documentRoot == null)
       loadedData.documentRoot = load(dataUrls.script+"?root=true");
    return loadedData.documentRoot;
 }

 function getDatabaseParameters(id) {
    var params = [];
    var parts = id.split(dbSeparator);
    if (configData.database) {
       var cfg = configData.database[parts[0]];
       if (cfg) {
          for (var p in cfg)
             params.push(p+"="+cfg[p]);
       }
       var limit = configData.database.limit;
       if (limit)
          params.push("limit="+limit);
    }
    for (var p in parts)
       params.push(dbProperties[p]+"="+parts[p]);
    return params;
 }

 function getValueDisplay(value) {
    if (value == null)
       return "";
    else if (value instanceof Array) {
       var txt = "[";
       for (var i = 0; i < value.length; i++) {
          if (i > 0)
             txt += " ";
          txt += getValueDisplay(value[i]);
       }
       return txt+"]";
    }
    else if (value instanceof Date)
       return value.getFullYear() + "-" + (value.getMonth()+101).toString().substr(1) + "-" + (value.getDate()+100).toString().substr(1)
                                  + " " + (value.getHours()+100).toString().substr(1) + ":" + (value.getMinutes()+100).toString().substr(1)
                                  + ":" + (value.getSeconds()+100).toString().substr(1);
    else if (typeof(value) == "object") {
       for (var p in value)
          return p + " " + getValueDisplay(value[p]);
    }
    else
       return value.toString();
 }

 function getPathValue(obj, keys) {
    if (obj == null || keys == null)
       return null;
    else if (typeof(keys) != "object")
       keys = [keys];
    else if (keys instanceof Array)
       ;
    else {
       var src = keys;
       keys = [];
       for (var p in src)
          keys.push(p);
    }

    for (var k = 0; k < keys.length; k++) {
       var key = keys[k]
       if (!key) continue;
       obj = obj[key];
       if (obj == null)
          return null;
    }
    return obj;
 }

 function setPathValue(obj, keys, value) {
    if (obj == null || keys == null)
       return null;
    else if (typeof(keys) != "object")
       keys = [keys];
    else if (keys instanceof Array)
       ;
    else {
       var src = keys;
       keys = [];
       for (var p in src)
          keys.push(p);
    }

    for (var lastkey = keys.length-1; lastkey >= 0; lastkey--)
       ;
    if (lastkey < 0)
       return obj;

    for (var k = 0; k < lastkey; k++) {
       var key = keys[k]
       if (!key) continue;
       var sub = obj[key];
       if (sub == null)
          sub = obj[key] = {};
       obj = sub;
    }
    return (obj[keys[lastkey]] = value);
 }

 function setContentPanel(cfg) {
    if (loadedData.currentEditor) {
       tinyMCE.execCommand('mceRemoveControl', false, 'web-site-editor');
       loadedData.currentEditor = null;
    }

    loadedData.ContentPanel.setText(cfg.text||"");
    if (cfg.header)
       loadedData.ContentPanel.showHeader();
    else
       loadedData.ContentPanel.hideHeader();

    loadedData.ContentPanel.detachToolbar();
    if (cfg.toolbar) {
       var tb = loadedData.ContentPanel.attachToolbar();
       var items = (cfg.toolbar instanceof Array) ? cfg.toolbar : [cfg.toolbar];
       var pos = 0;
       for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (!item)
             continue;
          else if (item instanceof Array) {
             if (typeof(item[1]) != "number") {
                item.splice(1, 0, pos);
                pos++;
             }
             tb.addButton(item[0], item[1], item[2], item[3], item[4]);
          }
          else if (typeof(item) == "object") {
             for (var p in item) {
                var val = item[p];
                if (!val)
                   continue;
                else if (typeof(val) == "function")
                   tb.attachEvent(p, val);
                else {
                   tb.addText(p, pos, val);
                   pos++;
                }
             }
          }
          else {
             tb.addText("#"+pos, pos, item.toString());
             pos++;
          }
       }
    }

    var result = null;
    if (cfg.url)
       result = loadedData.ContentPanel.attachURL(cfg.url);
    else if (cfg.html)
       result = loadedData.ContentPanel.attachHTMLString(cfg.html);
    else if (cfg.object)
       result = loadedData.ContentPanel.attachObject(cfg.object);
    else if (cfg.grid) {
       result = loadedData.ContentPanel.attachGrid();
       result.setImagePath(dataUrls.images);
       result.setIconsPath(dataUrls.images);
    }

    return result;
 }

 function initWindowFactory() {
    try {
       var factory = new dhtmlXWindows();
       factory.setImagePath(dataUrls.images);
       return factory;
    }
    catch (e) {
       alert("Problem with dhtmlx path: "+e);
       return null;
    }
 }

 function initMainLayout(target) {
    mainLayout = new dhtmlXLayoutObject(target, "2U");
    loadedData.menuPanel = mainLayout.cells("a");
    loadedData.menuPanel.setText("");
    loadedData.menuPanel.setWidth(250);
    loadedData.menuPanel.hideHeader();
    loadedData.ContentPanel = mainLayout.cells("b");
//    setContentPanel({text:"", url:dataUrls.intro, header:false});
    setContentPanel({text:"", html:renderText(load(dataUrls.intro)), header:false});
 }

 function initLeftPanel(parent) {
      var dhxAccord = parent.attachAccordion();
      dhxAccord.addItem("file", "Fichiers");
      dhxAccord.addItem("db", "Bases de donn&eacute;es");
      dhxAccord.addItem("time", "Agenda");
//      dhxAccord.addItem("email", "Courrier &eacute;lectronique");
      dhxAccord.addItem("web", "Sites web");
      dhxAccord.addItem("conf", "Configuration");

      loadedData.config = initConfig(dhxAccord.cells("conf"));
      loadedData.folders = initFolders(dhxAccord.cells("file"));
      loadedData.database = initDatabase(dhxAccord.cells("db"));
      loadedData.agendas = initAgendas(dhxAccord.cells("time"));
      loadedData.websites = initWebsites(dhxAccord.cells("web"));
 }

 function initAgendas(parent) {
      var tree = parent.attachTree();
      tree.setImagePath(dataUrls.images);
      tree.setIconPath(dataUrls.images);
      var agendas = configData.agendas;
      if (agendas != null || agendas instanceof Array && agendas.length > 0) {
         for (var a = 0; a < agendas.length; a++) {
            var agenda = agendas[a];
            var name = agenda.name || ("Agenda #"+(a+1));
            var table = agenda.table || ("agenda_"+(a+1));
            var parts = table.split(dbSeparator);
            if (parts.length != dbProperties.length) {
            //TODO: we could auto-detect missing parts by taking first of driver and database
               alert("Missing elements for agenda "+name+": "+table+" should have "+dbProperties.length+" parts separated by "+dbSeparator);
               continue;
            }
            tree.insertNewChild(0, name, name);
         }
      }
      tree.attachEvent("onClick", function(id) {
         var agenda = null;
         var parts = id.split("#");
         if (parts.length == 2 && parts[0] == "")
            agenda = configData.agendas[parseInt(parts[1])];
         else {
            for (var a = 0; a < agendas.length; a++) {
               if (agendas[a].name == id) {
                  agenda = agendas[a];
                  break;
               }
            }
         }
         if (agenda == null)
            alert("Pas trouve l'agenda "+id);
         else
            showAgenda(agenda);
      });
      return tree;
 }

 function initWebsites(parent) {
      var tree = parent.attachTree();
      tree.setImagePath(dataUrls.images);
      tree.setIconPath(dataUrls.images);

      var update = false;
      var sites = configData.websites;
      if (sites == null || typeof(sites) != 'object') {
         update = true;
         sites = {};
      }
      else if (sites instanceof Array) {
         update = true;
         var lst = sites;
         sites = {};
         for (var s = 0; s < lst.length; s++) {
            var site = sites[s];
            if (!site.name)
               site.name = "site #"+(s+1);
            sites[site.name] = site;
         }
      }

      var empty = true;
      for (var s in sites) {
         empty = false;
         break;
      }
      if (empty) {
         update = true;
         sites["default"] = {name:"default", url:"http://localhost/", folder:"/", file:"index.html"};
      }

      if (update) {
         setConfigTree(0, {websites:sites});
         loadedData.config.closeAllItems();
         configData.websites = sites;
      }
      for (var s in sites)
         tree.insertNewChild(0, s, s);

      tree.attachEvent("onClick", function(id) {
          var site = configData.websites[id];
          if (site == null)
             return alert("Error loading web site "+id+": not found");

          var uri = site.folder || "/";
          if (uri.charAt(uri.length-1) != '/')
             uri += '/';
          if (site.file)
             uri += site.file;
          if (loadedData.currentEditor == uri)
             return;

          var content = loadedData.editorContent[uri] || load(uri);
          var html = '<form method="POST" action="javascript:saveEditorContent()"><div id="web-site-editor" name="data" style="width:100%;height:100%;">'+content+'</div></form>';
          setContentPanel({
             text: "Edition du site "+site.name+" &agrave; l'adresse "+uri,
             header: true,
             html: html
          });
          loadedData.currentEditor = uri;
          loadedData.editorContent[uri] = null;
          tinyMCE.execCommand("mceAddControl", false, "web-site-editor");
      });

      return tree;
 }

 function saveEditorContent() {
    var url = dataUrls.script + "?file=" + encodeURIComponent(loadedData.currentEditor)
                              + "&data=" + encodeURIComponent(toJson(document.getElementById("web-site-editor").innerHTML));
    load(url, function(txt) {
       try {
          var reply = eval("("+txt+")");
          if (reply != "OK")
             alert(reply);
       }
       catch (e) { alert("Problem with server reply: "+e); }
    });
 }

 function initEditor() {
	tinyMCE.init({
		mode: "none",
		theme : "advanced",
		skin : "o2k7",
		plugins : "lists,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template,inlinepopups,autosave",

      remove_instance_callback : "removeTinyMceCallback",

		// Theme options
		theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,styleselect,formatselect,fontselect,fontsizeselect",
		theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code,|,insertdate,inserttime,preview,|,forecolor,backcolor",
		theme_advanced_buttons3 : "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen",
		theme_advanced_buttons4 : "insertlayer,moveforward,movebackward,absolute,|,styleprops,|,cite,abbr,acronym,del,ins,attribs,|,visualchars,nonbreaking,template,pagebreak,restoredraft",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "none",
		theme_advanced_resizing : false,

		// Example content CSS (should be your site CSS)
		content_css : "css/content.css",

		// Drop lists for link/image/media/template dialogs
		template_external_list_url : "lists/template_list.js",
		external_link_list_url : "lists/link_list.js",
		external_image_list_url : "lists/image_list.js",
		media_external_list_url : "lists/media_list.js"
	});
 }

 function removeTinyMceCallback(i) {
/***
    var props = [];
    for (var p in i)
       props.push(p+"("+typeof(i[p])+")");
    alert("Removing tinyMCE instance "+i+":\n"+props.join(" "));
    alert("Removing tinyMCE instance "+i+" with following content:\n"+i.getContent());
***/
    loadedData.editorContent[loadedData.currentEditor] = i.getContent();
 }

 function initConfig(parent) {
      var tree = parent.attachTree();
      tree.setImagePath(dataUrls.images);
      tree.setIconPath(dataUrls.images);
      loadedData.config = tree;
      setConfigTree(0, configData);
      tree.closeAllItems();
/***
      tree.attachEvent("onClick", function(id) {
         alert("You clicked on "+id+"\nHere is the serialized data:\n"+tree.serializeTreeToJson());
      });
/***
      tree.attachEvent("onClick", function(id) {
          var keys = id.substring(2).split("/");
          var value = getPathValue(configData, keys);
          var key = keys[keys.length-1];
          var parentType = isNaN(key) ? "object" : "array";
          var valueType = getValueType(value);
          var form = createForm("Choisissez votre syst&egrave;me parmi les suivants:", detected, function(choice) {
             configData.system.current = detected[choice];
             init();
          });
          form.window = createWindow(form.div, "Choix du syst&egrave;me", [400,150]);
     });
***/
      tree.attachEvent("onRightClick", function(id, e) {
         if (configMenu == null) {
            var html = "<table border='0' cellpadding='2' cellspacing='2'>";
            var trtd = "<tr><td style='font-size:10pt;vertical-align:middle;' onmouseover='this.style.backgroundColor=\"#ffe5ae\"' onmouseout='this.style.backgroundColor=\"#eaf2fb\"'>";
            for (var i = 0; i < configMenuChoices.length; i++) {
               var txt = configMenuChoices[i].trim();
               if (txt.substring(0,3).toLowerCase() != '<hr') {
                  txt = "<a href='javascript:selectMenu("+i+")' style='text-decoration:none;color:black;'>"+txt+"</a>";
               }
               html += trtd+txt+"</td></tr>";
            }
            configMenu = document.createElement("DIV");
            configMenu.style.position = "absolute";
            configMenu.style.display = "none";
            configMenu.style.border = "1px #a4bed4 solid";
            configMenu.style.backgroundColor = "#eaf2fb";
            configMenu.style.overflow = "auto";
            configMenu.onblur = "selectMenu(-1)";
            configMenu.innerHTML = html+'</table>';
            document.body.appendChild(configMenu);
         }
         document.currentMenuTarget = [tree, id];
         configMenu.style.left = e.clientX+"px";
         configMenu.style.top = e.clientY+"px";
         configMenu.style.display = "block";
       });
/***/
      return tree;
 }
/***/
 function selectMenu(no) {
    configMenu.style.display = "none";
    var tree = document.currentMenuTarget[0];
    var id = document.currentMenuTarget[1];
    var keys = id.substring(2).split("/");
    var value = getPathValue(configData, keys);
    var key = keys[keys.length-1];
    var displayKey = isNaN(key) ? key : "";

    switch (no) {
       case 0:
          var title = "Ajouter une nouvelle valeur";
          break;
       case 1:
          var title = "Modifier la valeur";
          break;
       case 2:
          var title = "Supprimer la valeur ";
          break;
       default:
          return;
    }
    var txt = configMenuChoices[no].split(";")[2];
    alert("Vous avez choisi "+txt+" "+id+":\n"+displayKey+" "+value);
 }
/***/
 function initFolders(parent) {
    var tree = parent.attachTree();
    tree.setImagePath(dataUrls.images);
    tree.setIconPath(dataUrls.images);
    tree.insertNewChild(0, "/", "/", 0, 0, 0, 0, "CHILD");
    tree.closeAllItems();
    tree.attachEvent("onClick", function(id) {
        loadFolder(id);
        loadContent(id);
    });
    return tree;
 }

 function loadFolder(path) {
    var parent = path || "/";
    if (path == null)
       path = "/";
    else if (path.charAt(path.length-1) != "/")
       path += "/";
    if (loadedData.cache[path])
       return loadContent(path);
    var folders = loadList(dataUrls.script+"?file="+path+"&folders=true");
    for (var f in folders) {
       var name = folders[f];
       var id = path+name;
       loadedData.folders.insertNewChild(parent, id, name, 0, 0, 0, 0, "CHILD");
    }
    loadedData.cache[path] = folders;
 }

 function loadContent(path) {
    var grid = setContentPanel({
      text: path,
      header: true,
      grid: true
    });
    grid.setHeader(fileHeaders);
    grid.setInitWidths("400,100,150,*");
    grid.setColAlign("left,right,left,left");
    grid.init();
    var files = loadList(dataUrls.script+"?file="+path);
    if (path.charAt(path.length-1) != "/")
       path += "/";
    for (var f in files) {
       var file = files[f];
       var data = [];
       var id = path+file.name;
       for (var h in fileHeaders) {
          var field = fileHeaders[h];
          var value = file[field];
          data.push(value);
          grid.setUserData(id, field, value);
       }
       grid.addRow(id, data);
    }
    grid.attachEvent("onRowSelect", function(id,ind){
       var type = grid.getUserData(id, "type");
       if (type == null)
          loadFile(id, "text/plain");
       else if (type.indexOf("directory") >= 0) {
          loadFolder(id);
          loadContent(id);
       }
       else
          loadFile(id, type);
    });
 }

 function loadFile(path, type) {
     var parts = type.split("/");
     var maintype = parts[0];
     loader = (maintype == "text" || maintype == "application") ? parts[1].split("+")[0] : maintype;
     if (loader.substring(0,2) == "x-")
        loader = type.substring(2);
     switch (loader) {
        case 'image':
           createWindow(loadMedia(path, {type:type}), path);
           break;
        case 'plain':
        case 'html':
        case 'shockwave-flash':
        case 'javascript':
        case 'json':
        case 'csv':
           createWindow(path);
           break;
        case 'audio':
           createWindow(loadMedia(path, {width:400, height:25, type:type}), path);
           break;
        case 'video':
           createWindow(loadMedia(path, {type:type}), path);
           break;
        case 'model':
        default:
           downloadFile(path);
     }
 }

 function loadMedia(path, options) {
   if (!options)
      var size = {width:screen.width/2, height:screen.height/2};
   else if (options.width && options.height)
      var size = {width:options.width, height:options.height};
   else if (options.width)
      var size = {width:options.width, height:options.width};
   else if (options.height)
      var size = {width:options.height, height:options.height};
   else
      var size = {width:screen.width/2, height:screen.height/2};

   var maintype = options.type ? options.type.split("/")[0] : "";
   switch (maintype) {
      case 'image':
         var infos = getFileInfos(path);
         var html = '<img src="' + path + '" border="0">';
         break;
      case 'audio':
      case 'video':
         var cfg = "{playList:[{url:'" + path + "'}],autoBuffering:true,autoPlay:false,autoRewind:true,loop:false,initialScale:'fit',showMenu:false,progressBarColor1:0xFFBBBB,progressBarColor2:0xFF5555,bufferBarColor1:0x5555FF,bufferingAnimationColor:0xFF0000}";
         var html = '<' + maintype + ' width="' + size.width + '" height="' + size.height + '" controls preload>'
	               + '<source src="' + path + '" type="' + options.type + '"/>'
                  + '<object type="application/x-shockwave-flash" data="/tools/FlowPlayer.swf" width="' + size.width + '" height="' + size.height + '">'
                  + '<param name="movie" value="/tools/FlowPlayer.swf"/>'
                  + '<param name="flashVars" value="config=' + cfg + '"/>'
                  + 'You need Flash Player or an HTML5 browser to play this content.<br/>'
                  + 'You can also <a href="' + path + '" target="_blank">download</a> the file to play locally.'
                  + '</object></' + maintype + '>';
         break;
      case 'text':
      default:
         return params.src;
   }
   var div = document.createElement("DIV");
   div.innerHTML = html;
   return div;
 }

 function loadConfigData(target) {
   try {
       if (configData == null) {
          if (!(dataUrls.config instanceof Array))
             dataUrls.config = [dataUrls.config];
          for (var cfg in dataUrls.config) {
             try {
                configData = eval("("+load(dataUrls.config[cfg])+")");
                if (configData && typeof(configData) == "object")
                   break;
             } catch (e) { configData = e.toString(); }
          }
          if (configData == null || typeof(configData) != "object") {
             var txt = "Warning: no valid config data found: "+configData;
             configData = {};
             alert(txt);
          }
       }

       var system = configData.system ? configData.system.current : null;
       if (system == null) {
          system = detectSystem(configData.system ? configData.system.supported : [], target);
          if (system == null)
             return false;
       }

       if (system != "") {
          var src = "*";
          var dst = system;
       }
       else {
          var src = ".*";
          var dst = "";
          system = "?";
       }
       for (var u in dataUrls)
          dataUrls[u] = replace(dataUrls[u], src, dst);
       if (configData.system)
          configData.system.current = system;
       else
          configData.system = {supported: [system], current:system};
       return true;
   } catch (e) {
       if (configData)
          configData.error = e.toString();
       alert(e);
       return configData != null;
   }
 }

 function setConfigTree(parent, obj) {
    for (var name in obj) {
       var id = parent+"/"+name;
       var content = obj[name];
       var sub = false;
       if (obj instanceof Array)
          var value = getValueDisplay(content);
       else if (content && typeof(content) == "object")
          var value = name;
       else if (name == "password")
          var value = name + " = ********";
       else
          var value = name + " = "+ getValueDisplay(content);
       loadedData.config.insertNewChild(parent, id, value, 0, 0, 0, 0, "CHILD");
       if (content && typeof(content) == "object")
          setConfigTree(id, content);
    }
 }

 function detectSystem(supported, target) {
    var detected = [];
    for (var i in supported) {
       var system = supported[i];
       if (load(dataUrls.test+system).trim() == "test")
          detected.push(system);
    }

    switch (detected.length) {
       case 0:
          alert("No supported system was detected");
          return "";
       case 1:
          return detected[0];
       default:
          var prompt = "<div style='text-align:center;'>Choisissez votre syst&egrave;me parmi les suivants:<br>&nbsp;</div>";
          var form = createForm(prompt, detected, function(choice) {
             configData.system.current = detected[choice];
             init(target);
          });
          form.window = createWindow(form.div, "Choix du syst&egrave;me", [450,150]);
          return null;
    }
 }

 function createWindow(content,id,size) {
     var maxw = document.body.clientWidth;
     var maxh = document.body.clientHeight;
     var title = id || content;
     var w = null, h = null;
     if (size instanceof Array) {
        w = size[0];
        h = size[1];
     }
     else if (typeof(size) == "number") {
        w = size;
        h = size;
     }
     else if (size != null) {
        w = size.width || size.w;
        h = size.height || size.h;
     }

     // we could check for content is an object and has size info
     if (w == null)
        w = maxw * 2 / 3;
     if (h == null)
        h = maxh * 4 / 5;

     var win = windowFactory.createWindow(title, (maxw-w)/2, (maxh-h)/2, w, h);
     win.setText(title);
     win.allowResize();
     win.allowMove();
     if (content) {
        switch (typeof(content)) {
           case 'string':
              win.attachURL(content);
              break;
           case 'object':
              win.attachObject(content);
              break;
        }
     }
     return win;
 }

 function createForm() {
    var form = {callback:null, data:null, id:createRandomId(document.adminForms)};
    document.adminForms[form.id] = form;
    var html = '<form onSubmit="return false"><div>&nbsp;</div><table border="0" align="center">';
    var buttons = 0;
    for (var a in arguments) {
      var arg = arguments[a];
      var type = typeof(arg);
      if (!arg)
         ;
      else if (arg instanceof Array) {
         html += '<tr><td colspan="2" style="text-align:center;">\n' + buttonSpacer;
         for (var b in arg) {
            html += '<input type="button" class="btn_txt" value="'+arg[b]+'" onclick="submitForm('+form.id+','+buttons+')">' + buttonSpacer;
            buttons++;
         }
         html += '</td></tr>\n';
      }
      else if (type == "function")
         form.callback = arg;
      else if (type == "object") {
         for (var p in arg) {
            var value = arg[p];
            if (value == null)
               arg[p] = value = "";
            if (typeof(value) != "object")
               var txt = '<input name="'+p+'" value="'+value+'" class="dhxform_textarea">';
            else {
               var txt = '<input';
               var obj = value;
               value = "";
               if (!obj.name)
                  obj.name = p;
               for (var x in obj) {
                  var v = obj[x];
                  txt += ' '+x+'="'+v+'"';
                  if (x == "value")
                     value = v;
               }
               txt += '>';
               arg[p] = value;
            }
            if (form.data != null)
               form.data[p] = arg[p];
            html += '<tr><td style="text-align:left">' + p + '</td><td style="text-align:left">' + txt + '</td></tr>\n';
         }
         if (form.data == null)
            form.data = arg;
      }
      else
         html += '<tr><td colspan="2" style="text-align:left">' + arg + '</td></tr>\n';
    }
    form.div = document.createElement("DIV");
    form.div.style = "text-align:center; vertical-align:middle;";
    form.div.innerHTML = html + "</table></form>";
    return form;
 }

 function createRandomId(obj, length) {
    if (!length)
       length = 1000000000;
    var left = 10;
    do {
       left--;
       if (left <= 0)
          throw new Error("Too many tries for creating a random id");
       var id = Math.round(Math.random() * length);
    } while (obj[id]);
    return id;
 }

 function submitForm(formId, buttonId) {
    var form = document.adminForms[formId];
    if (form) {
       var callback = form.callback;
       var elements = form.div.children[0].elements;
       var data = form.data;
       for (var p in data) {
          if (elements[p])
             data[p] = elements[p].value;
       }
       if (form.div)
          form.div.innerHTML = "";
       var win = form.window;
       form = null;
       if (win)
          win.close();
       delete document.adminForms[formId];
       return callback ? callback(buttonId, data) : data;
    }
    else
       return false;
 }

 function downloadFile(uri) {
    window.open(uri);
 }

 function initDatabase(parent) {
    var tree = parent.attachTree();
    tree.setImagePath(dataUrls.images);
    tree.setIconPath(dataUrls.images);
    var drivers = loadList(dataUrls.script);
    for (var d in drivers)
       tree.insertNewChild(0, drivers[d], drivers[d], 0, 0, 0, 0, "CHILD");
    tree.attachEvent("onClick", function(id) {
        loadDatabase(id);
    });
    return tree;
 }

 function loadDatabase(parent) {
    var loaded = false;
    var params = getDatabaseParameters(parent);
    var elements = loadedData.cache[parent];
    if (!elements)
       elements = loadList(dataUrls.script+"?"+params.join("&"));
    else
       loaded = true;

    var records = [];
    var fields = [];
    for (var e in elements) {
       var obj = elements[e];
       if (typeof(obj) != "string") {
          for (var f in obj) {
             if (fields.indexOf(f) < 0)
                fields.push(f);
          }
          records.push(obj);
       }
       else if (!loaded)
          loadedData.database.insertNewChild(parent, parent+dbSeparator+obj, obj, 0, 0, 0, 0, "CHILD");
    }

    var lastParts = params[params.length-1].split("=");
    if (fields.length)
       showTable(parent, fields, records);
    else if (lastParts[0] == "table") {
       elements = loadList(dataUrls.script+"?"+params.join("&")+"&info=fields");
       for (var e in elements)
          fields.push(elements[e].name);
       showTable(parent, fields, []);
    }
    else if (!loaded)
       loadedData.cache[parent] = elements;
    if (lastParts[0] == "database") {
       var tablemsg = '"Adding or deleting table is not supported yet"';
       var dbname = lastParts[1];
       var div = document.createElement("DIV");
       div.style.overflow = "auto";
       div.innerHTML = "<div>&nbsp;<br>&nbsp;</div><table align='center' border='0' cellpadding='5' cellspacing='5'>"
                     + "<tr><td align='center'><input type='button' value='Executer la requ&ecirc;te' onclick='runQuery(\""+parent+"\")'></td>"
                     + "<td align='center'><input type='button' value='Ajouter une table' onclick='alert("+tablemsg+")'></td>"
                     + "<td align='center'><input type='button' value='Supprimer la base de donn&eacute;es' onclick='alert("+tablemsg+")'></td></tr>"
                     + "<tr><td align='center' colspan='3'><textarea id='queryText' rows='15' cols='100'></textarea></td></tr>"
                     + "</table><div id='queryResult'></div>";
       setContentPanel({
          text: "Base de donn&eacute;es "+dbname,
          header: true,
          object: div
       });
    }
 }

 function runQuery(dbpath) {
    var query = document.getElementById("queryText").value.trim();
    if (query == "")
       return alert("Nothing to do");
    var url = dataUrls.script+"?"+getDatabaseParameters(dbpath).join("&")+"&query="+encodeURIComponent(query);
    load(url, function(txt) {
       try {
          var obj = eval(txt);
          if (obj == null || typeof(obj) != "object")
             var html = "result = "+obj;
          else {
             var lst = (obj instanceof Array) ? obj : [obj];
             var fields = [];
             var html = '<table style="border:1px solid black" align="center" width="90%" cellpadding="2" cellspacing="0">\n   <tr>\n';
             var body = "   </tr>\n";
             for (var i = 0; i < lst.length; i++) {
                body += "   <tr>\n";
                obj = lst[i];
                for (var f in obj) {
                   if (fields.indexOf(f) < 0) {
                      fields.push(f);
                      html += '      <th style="text-align:center;font-weight:bold;background-color:#a4bed4;border:1px solid black;">'+f+'</th>\n';
                   }
                }
                var color = (i % 2 == 0) ? "#ffffff" : "#a4bed4";
                for (var f = 0; f < fields.length; f++) {
                   var align = "left";
                   var val = obj[fields[f]];
                   if (val == null || val.toString().trim() == "")
                      val = "&nbsp;";
                   else if (!isNaN(val))
                      align = "right";
                   body += '      <td style="background-color:'+color+';text-align:'+align+';border:1px solid black;">'+val+'</td>\n';
                }
                body += "   </tr>\n";
             }
             html += body + "</table>\n";
          }
          document.getElementById("queryResult").innerHTML = html;
       }
       catch (e) { alert("Error while receiving result set: "+e); }
    });
 }

 function showTable(tableId, fields, records) {
    var idfld = (records.length && records[0].id) ? "id" : fields[0];
    var parts = tableId.split(dbSeparator);
    var title = "Table "+parts[parts.length-1];
    if (parts.length > 1)
       title += " dans " + parts[parts.length-2];
    var grid = setContentPanel({
       header: false,
       grid: true,
       toolbar: [{title: title},
                 ["add", "Nouvel enregistrement", dataUrls.addIcon, dataUrls.addIcon],
                 ["del", "Supprimer table", dataUrls.delIcon, dataUrls.delIcon],
                 ["edit", "Modifier table", dataUrls.editIcon, dataUrls.editIcon],
                 {onClick: function(id) {
                    switch (id) {
                       case "add":
                          var url = dataUrls.script+"?"+getDatabaseParameters(tableId).join("&");
                          var fields = eval(load(url+"&info=fields"));
                          var data = {};
                          for (var f in fields)
                             data[fields[f].name] = "";
                          var form = createForm(data, ["Enregistrer", "Annuler"], function(button, data) {
                             if (button != 0)
                                return;
                             var reply = eval(load(url+"&data="+toJson(data)));
                             if (reply && reply.toString().toLowerCase() != "ok")
                                alert("Reply from server: "+reply);
                             else {
                                var id = data[idfld];
                                var idval = id;
                                var select = {};
                                select[idfld] = idval;
                                data = eval(load(url+"&select="+encodeURIComponent(toJson(select))));
                                if (data instanceof Array && data[0]) {
                                   grid.addRow(id, []);
                                   updateGridRow(grid, id, null, fields, data[0]);
                                }
                                else
                                   alert("Reply from server after ok update: "+data);
                             }
                          });
                          form.window = createWindow(form.div, "Ajout "+title);
                          break;
                       case "del":
                          alert("Deleting table is not supported yet");
                          break;
                       case "edit":
                          alert("Editing table is not supported yet");
                          break;
                    }
                }}]
    });

    grid.setHeader(fields);
//    grid.setInitWidths("400,100,150,*");
//    grid.setColAlign("left,right,left,left");
    grid.init();
    var order = null;
    for (var r in records) {
       var id = records[r][idfld];
       grid.addRow(id, []);
       updateGridRow(grid, id, null, fields, records[r]);
    }

    grid.sortRows(fields.indexOf(idfld), "int", "asc");
    grid.attachEvent("onHeaderClick", function(fld,ev) {
       order = (order == "asc") ? "des" : "asc";
       grid.sortRows(fld, "str", order);
    });
    grid.attachEvent("onRowSelect", function(id,ind) {
       var idval = id;
       var select = {};
       select[idfld] = idval;
       var url = dataUrls.script+"?"+getDatabaseParameters(tableId).join("&")+"&select="+encodeURIComponent(toJson(select));
       var data = eval(load(url));
       if (!data)
          alert("Empty reply from the server");
       else if (typeof(data) != "object")
          alert("Reply from server: "+data);
       else {
          var title = parts[parts.length-1] + " " + idfld + " = " + idval;
          if (data instanceof Array)
             data = data[0];
          data[idfld] = {name:idfld, value:id, readonly:true, disabled:true};
          var form = createForm(data, ["Enregistrer", "Supprimer"], function(button, data) {
             switch (button) {
                case 0: // enregistrer
                   var reply = eval(load(url+"&data="+toJson(data)));
                   if (reply && reply.toString().toLowerCase() != "ok")
                      alert("Reply from server: "+reply);
                   else
                      updateGridRow(grid, id, url, fields);
                   break;
                case 1: // supprimer
                   if (confirm("Ets-vous sur de vouloir supprimer "+title+" ?")) {
                      var reply = eval(load(url+"&data={}"));
                      if (reply && reply.toString().toLowerCase() != "ok")
                         alert("Reply from server: "+reply);
                      else
                         updateGridRow(grid, id);
                   }
                   break;
             }
          });
          form.window = createWindow(form.div, title);
/***
          form.window.attachEvent("onClose", function(win){
              for (var id in document.adminForms) {
                 if (document.adminForms[id].window == win) {
                    delete document.adminForms[id];
                    break;
                 }
              }
          });
***/
       }
    });
 }

 function updateGridRow(grid, id, url, fields, record) {
    if (url) {
       var reply = eval(load(url));
       if (!reply)
          alert("Empty reply from the server");
       else if (typeof(reply) != "object")
          alert("Reply from server: "+reply);
       else
          record = reply;
    }
    else if (!record)
       return grid.deleteRow(id);

    if (record instanceof Array)
       record = record[0];
    grid.forEachCell(id, function(cell, f) {
       cell.setValue(record[fields[f]]);
       cell.cell.wasChanged = true;
    });
 }

 function showAgenda(agenda) {
    if (loadedData.agendaNode == null) {
       var div = loadedData.agendaNode = document.createElement("DIV");
       div.id = agendaPrefix + agenda.name;
       div["class"] = "dhx_cal_container";
       div.style.width = "100%";
       div.style.height = "100%";
       div.innerHTML = '<div class="dhx_cal_navline">' +
                       '  <div class="dhx_cal_prev_button">&nbsp;</div>' +
                       '  <div class="dhx_cal_next_button">&nbsp;</div>' +
                       '  <div class="dhx_cal_today_button"></div>' +
                       '  <div class="dhx_cal_date"></div>' +
                       '  <div class="dhx_cal_tab" name="day_tab" style="right:204px;"></div>' +
                       '  <div class="dhx_cal_tab" name="week_tab" style="right:140px;"></div>' +
                       '  <div class="dhx_cal_tab" name="month_tab" style="right:76px;"></div>' +
                       '</div>' +
                       '<div class="dhx_cal_header"></div>' +
                       '<div class="dhx_cal_data"></div>';
       scheduler.config.xml_date="%Y-%m-%d %H:%i";
       scheduler.config.first_hour = 6;
       scheduler.config.last_hour = 21;
       scheduler.config.start_on_monday = false;
       setAgendaEvents(agenda.table);
       var inited = false;
    }
    else
       var inited = true;

    setContentPanel({
       text: "Agenda: "+agenda.name,
       header: true,
       object: loadedData.agendaNode
    });
    if (inited)
       loadedData.agendaNode.style.display = "block";
    else {
       scheduler.init(div.id, null, 'month');
       var url = dataUrls.script+"?"+getDatabaseParameters(agenda.table).join("&");
       scheduler.load(url, 'json');
    }
 }

 function updateAgenda(obj, table, action) {
    var url = dataUrls.script+"?"+getDatabaseParameters(table).join("&");
    switch (action) {
       case 'm':
          url += "&select="+encodeURIComponent(toJson({id:obj.id}));
       case 'a':
          var data = extractFields(obj, ["start_date", "end_date", "text"]);
          break;
       case 'd':
          var data = {};
          break;
       default:
          alert("Invalid agenda update action: "+action);
          return false;
    }

    load(url+"&data="+toJson(data), function (txt) {
       try {
          var reply = eval("("+txt+")");
          if (reply != "OK")
             alert("Error with saving event: "+reply);
          else if (action == 'a')
             load(url+"&select="+encodeURIComponent(toJson(data)), function (txt) {
                try {
                   var reply = eval("("+txt+")");
                   if (reply == null || typeof(reply) != "object")
                      alert("Error with saving event: "+reply);
                   else if (reply instanceof Array)
                      reply = reply[0];
                   setAgendaEvents();
                   scheduler.deleteEvent(obj.id);
                   scheduler.addEvent(reply);
                   setAgendaEvents(table);
                }
                catch (e) { alert("Error with getting new event id server reply: "+txt); }
             });
       }
       catch (e) { alert("Error with update event server reply: "+txt); }
    });
    return true;
 }

 function setAgendaEvents(table) {
    if (table) {
       loadedData.agendaEvents.a = scheduler.attachEvent("onEventAdded", function(id, ev){
           return updateAgenda(ev, table, 'a');
       });
       loadedData.agendaEvents.m = scheduler.attachEvent("onEventChanged", function(id, ev){
           return updateAgenda(ev, table, 'm');
       });
       loadedData.agendaEvents.d = scheduler.attachEvent("onEventDeleted", function(id, ev){
           return updateAgenda(ev, table, 'd');
       });
    }
    else {
       scheduler.detachEvent(loadedData.agendaEvents.a);
       scheduler.detachEvent(loadedData.agendaEvents.m);
       scheduler.detachEvent(loadedData.agendaEvents.d);
       loadedData.agendaEvents.a = loadedData.agendaEvents.m = loadedData.agendaEvents.d = null;
    }
 }

function load(src, dst) {
   try {
      if (typeof(XMLHttpRequest) != "undefined")
         var req = new XMLHttpRequest();
      else if (typeof(window.ActiveXObject) != "undefined")
         var req = new ActiveXObject("Microsoft.XMLHTTP");
      else
         return alert("Your browser does not support HttpRequest ("+typeof(XMLHttpRequest)+")");
      req.onreadystatechange = function() {
         if (req.readyState != 4)
            return;
         if (dst == null)
            return;
         else if (typeof(dst) == "function")
            dst(req.responseText);
         else {
            if (typeof(dst) != "object")
               dst = document.getElementById(dst.toString());
            dst.innerHTML = req.responseText;
         }
      }

      var method = "GET";
      var data = null;
      var url = src;
      if (typeof(src) == "object") {
         if (src.attributes) {
            method = (src.attributes.method && src.attributes.method.value) || method;
            url = (src.attributes.action && src.attributes.action.value) || src.toString();
            var elements = src.elements;
         }
         else
            var elements = src;
         for (var e in elements) {
            var elem = elements[e];
            if (!elem)
               continue;
            else if (!elem.name && !elem.id) {
               if (!isNaN(e))
                  continue;
               var value = elem;
            }
            else if ((elem.type == "radio" || elem.type == "checkbox") && !elem.checked)
               continue;
            else
               var value = elem.value;

            var name = elem.name || elem.id || e;
            if (data == null)
               data = encodeURIComponent(name)+"="+encodeURIComponent(value);
            else
               data += "&"+encodeURIComponent(name)+"="+encodeURIComponent(value);
         }
         if (data != null && method.toLowerCase() == "get") {
            var sep = (url.indexOf("?") < 0) ? "?" : "&";
            url += sep + data;
            data = null;
         }
      }
      req.open(method, url, dst != null);
      req.send(data);
      if (dst == null)
         return req.responseText;
   }
   catch (e) { return alert(e); }
}

function getFileInfos(path) {
   return load(dataUrls.script+"?file="+path+"?info=");
}



