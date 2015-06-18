//v.3.5 build 120822

/*
Copyright DHTMLX LTD. http://www.dhtmlx.com
You allowed to use this component or parts of it under GPL terms
To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
*/
function dhtmlXColorPickerInput(a){typeof a!="object"&&(a=document.getElementById(a));var b=a,c=b.getAttribute("colorbox"),d=b.getAttribute("customcolors"),e=b.getAttribute("selectonclick"),f=b.getAttribute("fullview"),h=b.getAttribute("selectedcolor"),g=b;if(c){var i=document.createElement("DIV");i.style.width=b.offsetWidth+"px";i.style.height=b.offsetHeight+"px";b.style.width=b.offsetWidth-b.offsetHeight-2;b.parentNode.insertBefore(i,b);i.style.position="relative";g=document.createElement("DIV");
i.appendChild(g);i.appendChild(b);g.className="cs_colorBox";b.className+=" cs_colorInput";g.style.width=g.style.height=b.offsetHeight-(document.all?0:2)+"px";b.style.left=b.offsetHeight+2+"px"}var j=new dhtmlXColorPicker(null,e,d,!0,f);h&&j.setColor(h);j.linkToObjects=[g,b,b];return j}
function dhtmlXColorPicker(a,b,c,d,e){if(document.all)try{document.execCommand("BackgroundImageCache",!1,!0)}catch(f){}this._cc=c;if(!a)a=document.createElement("DIV"),a.style.position="absolute",document.body.appendChild(a),a._dhx_remove=!0;this.container=typeof a!="object"?document.getElementById(a):a;dhtmlxEventable(this);this.skinName=dhtmlx.skin||"";this.ready=!1;this.hideOnInit=d||!1;this.linkToObjects=[];this.imgURL=dhtmlx.image_path||window.dhx_globalImgPath||"";this.hideSelfOnSelect=!0;this.hex=
"000000";this.h=100;this.s=0.9;this.v=0.1;this.old_sat=this.old_hue=this.b=this.g=this.r=0;this.fullview=e||!1;this.customColorsCount=!this.fullview?10:8;this.language=null;this.elements=[];this.customColors=[];this.restoreFrom=null;this.fullview?this.colorSelectW=this.colorSelectH=255:(this.colorSelectH=119,this.colorSelectW=209);this.isClickOnly=b||!1;if(window.cs_dechex==null){var h=[0,1,2,3,4,5,6,7,8,9,"a","b","c","d","e","f"];window.cs_dechex=[];for(var g=0;g<256;g++){var i=h[g>>4].toString()+
h[g&15].toString();i.length<2&&(i="0"+i);window.cs_dechex[g]=i}}defLeng={langname:"en-us",labelHue:"Hue",labelSat:"Sat",labelLum:"Lum",labelRed:"Red",labelGreen:"Green",labelBlue:"Blue",btnAddColor:"Add to Custom Colors",btnSelect:"Select",btnCancel:"Cancel"};window.dhtmlxColorPickerObjects?window.dhtmlxColorPickerObjects[window.dhtmlxColorPickerObjects.length]=this:window.dhtmlxColorPickerObjects=[this];if(!window.dhtmlxColorPickerLangModules)window.dhtmlxColorPickerLangModules={};window.dhtmlxColorPickerLangModules["en-us"]=
defLeng;return this}
dhtmlXColorPicker.prototype.generate=function(){X=document.compatMode!="BackCompat"?"X":"";if(this.fullview)a="<div class='dhtmlxcolorpicker"+(this.skinName!=""?"_"+this.skinName:"")+"' csid='cs_Content' style='display:none;'>",document.all&&this.container.style.position=="absolute"&&(a+="<iframe src='"+(this.imgURL||"")+"blank.html' style='position:absolute; top:0px; left:0px; width:320px;  height:"+(this._cc?454:407)+"px; z-index:-1;'></iframe>"),a+="<table cellpadding='0' cellspacing='0'>",a+=
"<tr><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"left_top.gif);'></td><td style='height:2px;background:url("+(this.imgURL||"")+"top.gif);'></td><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"right_top.gif);'></td></tr>",a+="<tr><td style='width:2px;background:url("+(this.imgURL||"")+"left.gif);'></td><td style='width:316px;height:"+(this._cc?446:392)+"px;background:#E6E5E5;'>",a+="<table class='cs_ContentTable' csid='cs_ContentTable' cellpadding='0px' cellspacing='0px'>",
a+="<tr>",a+="<td><div class='cs_SelectorDiv' csid='cs_SelectorDiv'><div class='cs_SelectorVer' csid='cs_SelectorVer' style='left:100px;top:0px;'></div><div class='cs_SelectorHor' csid='cs_SelectorHor' style='left:0px;top:100px;'></div></div></td>",a+="<td><div class='cs_LumSelect' csid='cs_LumSelect'><div class='cs_LumSelectArrow' csid='cs_LumSelectArrow' style='left:16px;top:124px;'></div><div class='cs_LumSelectLine' csid='cs_LumSelectLine' style='left:0px;top:0px;'></div></div></td>",a+="</tr>",
a+="<tr><td style='padding-top:10px;' colspan='2'>",a+="<table class='cs_ColorArea' cellpadding='0px' cellspacing='0px'>",a+="<tr><td rowspan='3'><div class='cs_EndColor' csid='cs_EndColor'></div></td><td valign='top' style='text-align:center;width:80px;'># <input csid='cs_Hex' class='cs_Hex'></td><td>"+this.language.labelHue+":</td><td><input tabindex='1' class='cs_Input' csid='cs_InputHue' value='' /></td><td>"+this.language.labelRed+":</td><td><input tabindex='4' class='cs_Input' csid='cs_InputRed' value='' /></td></tr>",
a+="<tr><td></td><td>"+this.language.labelSat+":</td><td><input tabindex='2' class='cs_Input' csid='cs_InputSat' value='' /></td><td>"+this.language.labelGreen+":</td><td><input tabindex='4' class='cs_Input' csid='cs_InputGreen' value='' /></td></tr>",a+="<tr><td></td><td>"+this.language.labelLum+":</td><td><input tabindex='2' class='cs_Input' csid='cs_InputLum' value='' /></td><td>"+this.language.labelBlue+":</td><td><input tabindex='4' class='cs_Input' csid='cs_InputBlue' value='' /></td></tr>",
this._cc&&(a+="<tr><td>",a+="<div class='cs_CustomColors' csid='cs_CustomColors'></div>",a+="</td><td></td><td colspan='4' valign='top'><input tabindex='7' class='cs_CustomColorAdd' csid='cs_CustomColorAdd' type='button' value='"+this.language.btnAddColor+"'></td></tr>"),a+="</table>",a+="</td></tr>",a+="</table>",a+="<table cellpadding='0' cellspacing='0' style='width:100%;'><tr><td style='height:49px;background:url("+(this.imgURL||"")+"buttons_panel.gif);'><input tabindex='9' class='cs_ButtonCancel' csid='cs_ButtonCancel' type='button' value='"+
this.language.btnCancel+"' /><input tabindex='8' class='cs_ButtonOk' csid='cs_ButtonOk' type='button' value='"+this.language.btnSelect+"' /></td></tr></table>";else{var a="<div class='dhtmlxcolorpicker"+(this.skinName!=""?"_"+this.skinName:"")+"' csid='cs_Content' style='display:none;'>";document.all&&this.container.style.position=="absolute"&&(a+="<iframe src='"+(this.imgURL||"")+"blank.html' frameBorder='0' style='position:absolute; top:0px; left:0px; width:252px;  height:"+(this._cc?300:244)+"px; z-index:-1;'></iframe>");
a+="<table cellpadding='0' cellspacing='0'>";a+="<tr><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"left_top.gif);'></td><td style='height:2px;background:url("+(this.imgURL||"")+"top.gif);'></td><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"right_top.gif);'></td></tr>";a+="<tr><td style='width:2px;background:url("+(this.imgURL||"")+"left.gif);'></td><td style='width:"+(document.all?247:243)+"px;height:"+(this._cc?281:240)+"px;'>";a+="<table class='cs_ContentTable' csid='cs_ContentTable' cellpadding='0px' cellspacing='0px'>";
a+="<tr>";a+="<td><div class='cs_SelectorDiv_Mini' csid='cs_SelectorDiv'><div class='cs_SelectorVer' csid='cs_SelectorVer' style='left:100px;top:0px;'></div><div class='cs_SelectorHor' csid='cs_SelectorHor' style='left:0px;top:100px;'></div></div></td>";a+="<td><div class='cs_LumSelect_Mini' csid='cs_LumSelect'><div csid='cs_LumSelectArrow'></div><div class='cs_LumSelectLine' csid='cs_LumSelectLine' style='left:0px;top:0px;'></div></div></td>";a+="</tr>";a+="<tr><td style='padding-top:10px;' colspan='2'>";
a+="<table class='cs_ColorArea_Mini' cellpadding='0px' cellspacing='0px'>";a+="<tr><td rowspan='2' valign='top' style='text-align:left;'><div class='cs_EndColor_Mini' csid='cs_EndColor' ></div></td><td>"+this.language.labelHue+":</td><td><input tabindex='1' class='cs_Input_Mini"+X+"' csid='cs_InputHue' value='' /></td><td>"+this.language.labelRed+":</td><td><input tabindex='4' class='cs_Input_Mini"+X+"' csid='cs_InputRed' value='' /></td></tr>";a+="<tr><td>"+this.language.labelSat+":</td><td><input tabindex='2' class='cs_Input_Mini"+
X+"' csid='cs_InputSat' value='' /></td><td>"+this.language.labelGreen+":</td><td><input tabindex='4' class='cs_Input_Mini"+X+"' csid='cs_InputGreen' value='' /></td></tr>";a+="<tr><td style='vertical-align:top;width:80px;text-align:left;'># <input csid='cs_Hex' class='cs_Hex_Mini"+X+"'></td><td>"+this.language.labelLum+":</td><td><input tabindex='2' class='cs_Input_Mini"+X+"' csid='cs_InputLum' value='' /></td><td>"+this.language.labelBlue+":</td><td><input tabindex='4' class='cs_Input_Mini"+X+"' csid='cs_InputBlue' value='' /></td></tr>";
this._cc&&(a+="<tr><td colspan='6'><input tabindex='7' class='cs_CustomColorAdd_Mini' csid='cs_CustomColorAdd' type='button' value='"+this.language.btnAddColor+"'></td></tr>",a+="<tr><td colspan='6'><div class='cs_CustomColors_Mini' csid='cs_CustomColors'></div></td></tr>");a+="</table>";a+="</td></tr>";a+="</table>";a+="<table class='cs_ButtonsPanel' cellpadding='0' cellspacing='0' style='width:100%;'><tr><td style='width:100%;'><input tabindex='9' class='cs_ButtonCancel' csid='cs_ButtonCancel' type='button' value='"+
this.language.btnCancel+"' /><input tabindex='8' class='cs_ButtonOk' csid='cs_ButtonOk' type='button' value='"+this.language.btnSelect+"' /></td></tr></table>"}a+="</td><td style='width:2px;background:url("+(this.imgURL||"")+"right.gif);'></td></tr>";a+="<tr><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"left_bottom.gif);'></td><td style='height:2px;background:url("+(this.imgURL||"")+"bottom.gif);'></td><td style='width:2px;height:2px;background:url("+(this.imgURL||"")+"right_bottom.gif);'></td></tr>";
a+="</table>";a+="</div>";this.container.style.width=this.fullview?"320px":"252px";this.container.innerHTML=a;this._initCsIdElement();this.elements.cs_SelectorDiv.style.backgroundImage=this.fullview?"url("+(this.imgURL||"")+"color.png)":"url("+(this.imgURL||"")+"colormini.png)";this.elements.cs_SelectorDiv.z=this;this.elements.cs_LumSelect.z=this;this.elements.cs_LumSelectArrow.z=this;this.z=this;this._drawLum();this._colorizeLum(this.old_hue,this.old_sat);this._initEvents();this._cc&&this._initCustomColors();
this.ColorNum=0;this.restoreFromHSV();this._drawValues()};dhtmlXColorPicker.prototype._initCsIdElement=function(a){if(a==null)a=this.container;for(var b=a.childNodes,c=b.length,d=0;d<c;d++)if(b[d].nodeType==1){var e=b[d].getAttribute("csid");e!==null&&(this.elements[e]=b[d]);b[d].childNodes.length>0&&this._initCsIdElement(b[d])}};
dhtmlXColorPicker.prototype._initEvents=function(){this.elements.cs_SelectorDiv.onmousedown=this._startMoveColor;this.elements.cs_SelectorDiv.ondblclick=this.clickOk;this.elements.cs_LumSelect.onmousedown=this._startMoveLum;this.elements.cs_LumSelect.ondblclick=this.clickOk;this.elements.cs_LumSelectArrow.onmousedown=this._startMoveLum;if(this._cc)this.elements.cs_CustomColorAdd.z=this,this.elements.cs_CustomColorAdd.onclick=this.addCustomColor,this.elements.cs_CustomColorAdd.onmouseover=this.hoverButton,
this.elements.cs_CustomColorAdd.onmouseout=this.normalButton;for(var a="cs_InputHue,cs_InputRed,cs_InputSat,cs_InputGreen,cs_InputLum,cs_InputBlue".split(","),b=0;b<a.length;b++)this.elements[a[b]].z=this,this.elements[a[b]].onchange=b%2?this._changeValueRGB:this._changeValueHSV;this.elements.cs_Hex.z=this;this.elements.cs_Hex.onchange=this._changeValueHEX;this.elements.cs_ButtonOk.z=this;this.elements.cs_ButtonOk.onclick=this.clickOk;this.elements.cs_ButtonOk.onmouseover=this.hoverButton;this.elements.cs_ButtonOk.onmouseout=
this.normalButton;this.elements.cs_ButtonCancel.z=this;this.elements.cs_ButtonCancel.onclick=this.clickCancel;this.elements.cs_ButtonCancel.onmouseover=this.hoverButton;this.elements.cs_ButtonCancel.onmouseout=this.normalButton};dhtmlXColorPicker.prototype.resetHandlers=function(){};dhtmlXColorPicker.prototype.clickOk=function(){var a=this.z,b=a.getSelectedColor();a.callEvent("onSelect",[b[0]]);a.hideSelfOnSelect&&a.hide()};
dhtmlXColorPicker.prototype.clickCancel=function(){var a=this.z;a.callEvent("onCancel",[]);this.z.hideSelfOnSelect&&this.z.hide()};
dhtmlXColorPicker.prototype._setCrossPos=function(a){var b=this.z,c=b._getOffset(this.elements.cs_SelectorDiv),d=a.clientY-c[0];if(d<0)d=0;else if(d>this.colorSelectH)d=this.colorSelectH;var e=a.clientX-c[1];if(e<0)e=0;else if(e>this.colorSelectW)e=this.colorSelectW;b.elements.cs_SelectorVer.style.left=e+"px";b.elements.cs_SelectorHor.style.top=d+"px";var f=e==this.colorSelectW?0:360*e/this.colorSelectW,h=1-d/this.colorSelectH;return[f,h]};
dhtmlXColorPicker.prototype._getScrollers=function(){return[document.body.scrollLeft||document.documentElement.scrollLeft,document.body.scrollTop||document.documentElement.scrollTop]};dhtmlXColorPicker.prototype._setLumPos=function(a){var b=this.z,c=b._getOffset(b.elements.cs_LumSelect),d=a.clientY-c[0]-4;d<-3&&(d=-3);d>this.colorSelectH-4&&(d=this.colorSelectH-4);b.elements.cs_LumSelectArrow.style.top=d+"px";b.elements.cs_LumSelectLine.style.top=d+4+"px";var e=(d+3)/this.colorSelectH;return e};
dhtmlXColorPicker.prototype._startMoveColor=function(a){var b=this.z;a==null&&(a=event);b.elements.cs_SelectorDiv.onmousedown=null;b.b_move=document.body.onmousemove;b.b_up=document.body.onmouseup;var c=b;document.body.onmousemove=function(a){a==null&&(a=event);c._mouseMoveColor(a)};document.body.onmouseup=function(a){a==null&&(a=event);c._stopMoveColor(a);c=null};b.elements.cs_SelectorDiv.onmousemove=b._mouseMoveColor;b.elements.cs_SelectorDiv.onmouseup=b._stopMoveColor;var d=b._setCrossPos(a);b.h=
d[0];b.s=d[1];var e=b._calculateColor();b._colorizeLum(e[0],e[1])};dhtmlXColorPicker.prototype._mouseMoveColor=function(a){var b=this.z;a==null&&(a=event);var c=b._setCrossPos(a);if(!b.isClickOnly){b.h=c[0];b.s=c[1];var d=b._calculateColor();b._colorizeLum(d[0],d[1])}};
dhtmlXColorPicker.prototype._stopMoveColor=function(a){var b=this.z;a==null&&(a=event);b.elements.cs_SelectorDiv.onmousedown=b._startMoveColor;b.elements.cs_SelectorDiv.onmousemove=null;b.elements.cs_SelectorDiv.onmouseup=null;document.body.onmousemove=b.b_move;document.body.onmouseup=b.b_up;var c=b._setCrossPos(a);b.h=c[0];b.s=c[1];var d=b._calculateColor();b._colorizeLum(d[0],d[1])};
dhtmlXColorPicker.prototype._startMoveLum=function(a){var b=this.z;a==null&&(a=event);b.elements.cs_LumSelect.onmousedown=null;b.elements.cs_LumSelectArrow.onmousedown=null;b.elements.cs_LumSelect.onmousemove=b._mouseMoveLum;b.elements.cs_LumSelect.onmouseup=b._stopMoveLum;b.b_move=document.body.onmousemove;b.b_up=document.body.onmouseup;b.b_selstart=document.body.onselectstart;var c=b;document.body.onmousemove=function(a){a==null&&(a=event);c._mouseMoveLum(a)};document.body.onmouseup=function(a){a==
null&&(a=event);c._stopMoveLum(a);c=null};document.body.onselectstart=function(){return!1};b.v=b._setLumPos(a);b._calculateColor()};dhtmlXColorPicker.prototype._mouseMoveLum=function(a){var b=this.z;a==null&&(a=event);b.v=b._setLumPos(a);b.isClickOnly||b._calculateColor()};
dhtmlXColorPicker.prototype._stopMoveLum=function(a){var b=this.z;a==null&&(a=event);b.elements.cs_LumSelect.onmousedown=b._startMoveLum;b.elements.cs_LumSelectArrow.onmousedown=b._startMoveLum;b.elements.cs_LumSelect.onmousemove=null;b.elements.cs_LumSelect.onmouseup=null;b.v=b._setLumPos(a);b._calculateColor();document.body.onmousemove=b.b_move;document.body.onmouseup=b.b_up;document.body.onselectstart=b.b_selstart};
dhtmlXColorPicker.prototype._getOffset=function(a){var b=this._getOffsetTop(a),c=this._getOffsetLeft(a),d=this._getScrollers();return[b-d[1],c-d[0]]};dhtmlXColorPicker.prototype._getOffsetTop=function(a){var b=0;a.offsetParent&&(b+=a.offsetTop+this._getOffsetTop(a.offsetParent));return b};dhtmlXColorPicker.prototype._getOffsetLeft=function(a){var b=0;a.offsetParent&&(b+=a.offsetLeft+this._getOffsetLeft(a.offsetParent));return b};
dhtmlXColorPicker.prototype._calculateColor=function(){if(this.restoreFrom=="RGB")var a=[this.r,this.g,this.b];else a=this._hsv2rgb(this.h,this.s,1-this.v),this.r=a[0],this.g=a[1],this.b=a[2];this.hex=this._getColorHEX(a);this.elements.cs_EndColor.style.backgroundColor="#"+this.hex;this._drawValues();this.restoreFrom=null;return[this.h,this.s,1-this.v]};
dhtmlXColorPicker.prototype._drawValues=function(){this.elements.cs_Hex.value=this.hex;this.elements.cs_InputHue.value=Math.floor(this.h);this.elements.cs_InputSat.value=Math.floor(this.s*100);this.elements.cs_InputLum.value=Math.floor((1-this.v)*100);this.elements.cs_InputRed.value=Math.floor(this.r);this.elements.cs_InputGreen.value=Math.floor(this.g);this.elements.cs_InputBlue.value=Math.floor(this.b)};
dhtmlXColorPicker.prototype.saveColor=function(a,b){var c=new Date,d=c.valueOf()+26784E5,c=new Date(d),e="color_"+b+"="+a+"; expires="+c.toGMTString();document.cookie=e};dhtmlXColorPicker.prototype.restoreColor=function(a){var b=!1,c="color_"+a;if(document.cookie.length>0){var d=document.cookie.indexOf(c+"=");if(d!=-1){var e=document.cookie.indexOf(";",d);if(e==-1)e=document.cookie.length;var f=document.cookie.indexOf("=",d)+1,b=document.cookie.substr(f,e-f)}}return b};
dhtmlXColorPicker.prototype._hsv2rgb=function(a,b,c){Hi=Math.floor(a/60)%6;f=a/60-Hi;p=c*(1-b);q=c*(1-f*b);t=c*(1-(1-f)*b);var d=0,e=0,f=0;switch(Hi){case 0:d=c;e=t;f=p;break;case 1:d=q;e=c;f=p;break;case 2:d=p;e=c;f=t;break;case 3:d=p;e=q;f=c;break;case 4:d=t;e=p;f=c;break;case 5:d=c,e=p,f=q}d=Math.floor(d*255);e=Math.floor(e*255);f=Math.floor(f*255);return[d,e,f]};
dhtmlXColorPicker.prototype._rgb2hsv=function(a,b,c){R=a/255;G=b/255;B=c/255;var d=Math.max(R,G,B),e=Math.min(R,G,B),f=d,h=d==0?0:1-e/d,g=0;d==e?g=0:d==R&&G>=B?g=60*(G-B)/(d-e)+0:d==R&&G<B?g=60*(G-B)/(d-e)+360:d==G?g=60*(B-R)/(d-e)+120:d==B&&(g=60*(R-G)/(d-e)+240);return[g,h,f]};
dhtmlXColorPicker.prototype._drawLum=function(){for(var a=this.colorSelectH,b=!this.fullview?30:64,c=!this.fullview?8:4,d=0;d<b;d++){var e=document.createElement("div"),f=this._dec2hex(a);e.style.backgroundColor="#"+f+f+f;e.className="cs_LumElement";a-=c;this.elements.cs_LumSelect.appendChild(e)}};
dhtmlXColorPicker.prototype._colorizeLum=function(a,b){this.old_hue=a;this.old_sat=b;for(var c=255,d=!this.fullview?8:4,e=this.elements.cs_LumSelect.childNodes.length,f=2;f<e;f++){var h=c>255?1:c/255,g=this._hsv2rgb(a,b,h),g="#"+this._getColorHEX(g);this.elements.cs_LumSelect.childNodes[f].style.backgroundColor=g;c-=d}this.callEvent("onChange",[this.getSelectedColor()])};dhtmlXColorPicker.prototype._dec2hex=function(a){return window.cs_dechex[a]||"00"};
dhtmlXColorPicker.prototype._hex2dec=function(a){return parseInt(a,16)};
dhtmlXColorPicker.prototype._initCustomColors=function(){for(var a=this.elements.cs_CustomColors,b=0;b<this.customColorsCount;b++){var c=document.createElement("div");c.className=this.fullview?"cs_CustomColor":"cs_CustomColor_Mini";c.color_num=b;if(document.all)navigator.appName=="Opera"?this.fullview?(c.style.width="14px",c.style.height="14px"):(c.style.width="18px",c.style.height="18px"):this.fullview?(c.style.width="16px",c.style.height="16px"):(c.style.width=document.compatMode!="BackCompat"?
"18px":"20px",c.style.height="20px");c.z=this;c.onclick=this._selectCustomColor;c.ondblclick=this.clickOk;var d=this.restoreColor(b)||"0,0,0";c.color=d;var e=d.split(",");c.style.backgroundColor="#"+this._getColorHEX(e);this.customColors.push(c);a.appendChild(c)}};
dhtmlXColorPicker.prototype._reinitCustomColors=function(){for(var a=this.elements.cs_CustomColors,b=0;b<this.customColorsCount;b++){var c=this.customColors[b],d=this.restoreColor(b)||"0,0,0";c.color=d;var e=d.split(",");c.style.backgroundColor="#"+this._getColorHEX(e);this.customColors[b]=c}};dhtmlXColorPicker.prototype._getColorHEX=function(a){var b=this._dec2hex(a[0]),c=this._dec2hex(a[1]),d=this._dec2hex(a[2]);return b+c+d};
dhtmlXColorPicker.prototype._selectCustomColor=function(a){a==null&&(a=event);var b=this.z;if(!this.selected){for(var c=0;c<b.customColors.length;c++)b.customColors[c].style.border="1px solid gray";this.style.border="1px dashed black";this.selected=!0;if(b.selectedColor!=null)b.customColors[b.selectedColor].style.border="1px solid gray",b.customColors[b.selectedColor].selected=!1}b.selectedColor=this.color_num;b.ColorNum=this.color_num;var d=this.color.split(",");b.r=d[0];b.g=d[1];b.b=d[2];b.restoreFromRGB()};
dhtmlXColorPicker.prototype.addCustomColor=function(){var a=this.z;if(a.selectedColor!=null){var b=a.customColors[a.selectedColor],c=a.selectedColor;b.style.border="1px solid gray";a.selectedColor=null}else b=a.customColors[a.ColorNum],c=a.ColorNum,b.style.border="1px solid gray";var d=a.r+","+a.g+","+a.b;a.saveColor(d,c);b.color=d;a.ColorNum=a.ColorNum==9?0:a.ColorNum+1;a.customColors[a.ColorNum].style.border="1px dashed red";b.style.backgroundColor=a.elements.cs_EndColor.style.backgroundColor};
dhtmlXColorPicker.prototype.restoreFromRGB=function(){this.restoreFrom="RGB";var a=this._rgb2hsv(this.r,this.g,this.b);this.h=a[0];this.s=a[1];this.v=1-a[2];this.ready&&this.redraw()};dhtmlXColorPicker.prototype.restoreFromHSV=function(){this.restoreFrom="HSV";var a=this._hsv2rgb(this.h,this.s,this.v);this.r=a[0];this.g=a[1];this.b=a[2];this.redraw()};
dhtmlXColorPicker.prototype.restoreFromHEX=function(){this.r=this._hex2dec(this.hex.substr(0,2));this.g=this._hex2dec(this.hex.substr(2,2));this.b=this._hex2dec(this.hex.substr(4,2));this.restoreFromRGB()};
dhtmlXColorPicker.prototype.redraw=function(){var a=this.colorSelectW*this.h/360,b=(1-this.s)*this.colorSelectH,c=this.v*this.colorSelectH;this.elements.cs_SelectorHor.style.top=b+"px";this.elements.cs_SelectorVer.style.left=a+"px";this.elements.cs_LumSelectArrow.style.top=c-3+"px";this.elements.cs_LumSelectLine.style.top=c+1+"px";var d=this._calculateColor();this._colorizeLum(d[0],d[1])};
dhtmlXColorPicker.prototype._changeValueHSV=function(){var a=this.z,b=parseInt(a.elements.cs_InputHue.value)||0,c=parseInt(a.elements.cs_InputSat.value)||0,d=parseInt(a.elements.cs_InputLum.value)||0;if(b<0||b>359)b=0;if(c<0||c>100)c=0;if(d<0||d>100)d=0;a.elements.cs_InputHue.value=b;a.elements.cs_InputSat.value=c;a.elements.cs_InputLum.value=d;a.h=b;a.s=c/100;a.v=1-d/100;a.restoreFromHSV()};
dhtmlXColorPicker.prototype._changeValueRGB=function(){var a=this.z,b=parseInt(a.elements.cs_InputRed.value)||0,c=parseInt(a.elements.cs_InputGreen.value)||0,d=parseInt(a.elements.cs_InputBlue.value)||0;if(b<0||b>255)b=0;if(c<0||c>255)c=0;if(d<0||d>255)d=0;a.elements.cs_InputRed.value=b;a.elements.cs_InputGreen.value=c;a.elements.cs_InputBlue.value=d;a.r=b;a.g=c;a.b=d;a.restoreFromRGB()};
dhtmlXColorPicker.prototype._changeValueHEX=function(){var a=this.z,b=a.elements.cs_Hex.value||0,b=b.replace(/[^a-fA-F0-9]/gi,"0");if(b.length>6)b=b.substr(0,6);else for(;b.length<6;)b+="0";a.elements.cs_Hex.value=b;a.hex=b;a.restoreFromHEX()};
dhtmlXColorPicker.prototype.setCustomColors=function(a){for(var a=a.split(","),b=0;b<a.length;b++){var c=a[b];c.substr(0,1)=="#"&&(c=c.substr(1));var d=this._hex2dec(c.substr(0,2)),e=this._hex2dec(c.substr(2,2)),f=this._hex2dec(c.substr(4,2)),c=d+","+e+","+f;this.saveColor(c,b)}};
dhtmlXColorPicker.prototype.setColor=function(a){if(typeof a!="string")var b=a[0],c=a[1],d=a[2];else if(a.indexOf("rgb")!=-1)var e=a.substr(a.indexOf("(")+1,a.lastIndexOf(")")-a.indexOf("(")-1).split(","),b=e[0],c=e[1],d=e[2];else a.substr(0,1)=="#"&&(a=a.substr(1)),b=this._hex2dec(a.substr(0,2)),c=this._hex2dec(a.substr(2,2)),d=this._hex2dec(a.substr(4,2));b=parseInt(b)||0;c=parseInt(c)||0;d=parseInt(d)||0;if(b<0||b>255)b=0;if(c<0||c>255)c=0;if(d<0||d>255)d=0;this.r=b;this.g=c;this.b=d;this.restoreFromRGB()};
dhtmlXColorPicker.prototype.close=function(){this.elements.cs_SelectorDiv.z=null;this.elements.cs_LumSelect.z=null;this.elements.cs_LumSelectArrow.z=null;this.elements.cs_ButtonOk.z=null;this.elements.cs_ButtonCancel.z=null;if(this.cc)this.elements.cs_CustomColorAdd.z=null;this.container.innerHTML="";this.container._dhx_remove&&this.container.parentNode.removeChild(this.container)};
dhtmlXColorPicker.prototype.show=function(){this.callEvent("onShow",[]);if(this.container.innerHTML!="")this.elements.cs_Content.style.display="",this.elements.cs_InputHue.focus()};dhtmlXColorPicker.prototype.setPosition=function(a,b){this.container.style.position="absolute";this.container.style.top=(b>0?b:10)+"px";this.container.style.left=a+"px"};dhtmlXColorPicker.prototype.hide=function(){this.resetHandlers();if(this.elements.cs_Content)this.elements.cs_Content.style.display="none"};
dhtmlXColorPicker.prototype.setOnSelectHandler=function(a){this.attachEvent("onSelect",a)};dhtmlXColorPicker.prototype.setOnCancelHandler=function(a){this.attachEvent("onCancel",a)};dhtmlXColorPicker.prototype.getSelectedColor=function(){var a=[this.r,this.g,this.b],b=this._dec2hex(this.r)+this._dec2hex(this.g)+this._dec2hex(this.b),c=[this.h,this.s,this.v];return["#"+b,a,c]};
dhtmlXColorPicker.prototype.linkTo=function(a,b,c){typeof a!="object"&&(a=document.getElementById(a));typeof b!="object"&&(b=document.getElementById(b));typeof c!="object"&&(c=document.getElementById(c));this.linkToObjects=arguments;var d=this;b.onclick=function(){var b=d._getOffset(a),c=d._getScrollers(),h=b[1]+c[0],g=b[0]+c[1];d.setPosition(h+a.offsetWidth,g);d.isVisible()?d.hide():d.show()};this.setOnSelectHandler(function(b){a.style.backgroundColor=b;if(c)c.value=b});this.close=this.hide;this.hide()};
dhtmlXColorPicker.prototype.hideOnSelect=function(a){this.hideSelfOnSelect=a};dhtmlXColorPicker.prototype.setImagePath=function(a){this.imgURL=a};dhtmlXColorPicker.prototype.init=function(){this.language||this.loadUserLanguage("en-us");this.generate();this.ready=!0;this._cc&&this._reinitCustomColors();this.linkToObjects.length>0&&this.linkTo(this.linkToObjects[0],this.linkToObjects[1],this.linkToObjects[2]);this.hideOnInit||this.show()};
dhtmlXColorPicker.prototype.loadUserLanguage=function(a){if(window.dhtmlxColorPickerLangModules[a])this.language=window.dhtmlxColorPickerLangModules[a],this.ready&&(this.generate(),this.show())};dhtmlXColorPicker.prototype.setSkin=function(a){this.skinName=a;if(this.elements.cs_Content)this.elements.cs_Content.className="dhtmlxcolorpicker"+(a?"_"+a:a)};dhtmlXColorPicker.prototype.isVisible=function(){return this.elements.cs_Content.style.display!="none"};
dhtmlXColorPicker.prototype.hoverButton=function(){this.className+="_Hover"};dhtmlXColorPicker.prototype.normalButton=function(){this.className=this.className.substr(0,this.className.length-6)};(function(){dhtmlx.extend_api("dhtmlXColorPicker",{_init:function(a){return[a.parent,a.click,a.colors,a.hide,a.full]},show:"showA",link:"linkTo",image_path:"setImagePath",color:"setColor"},{showA:function(){this.init();this.show()}})})();

//v.3.5 build 120822

/*
Copyright DHTMLX LTD. http://www.dhtmlx.com
You allowed to use this component or parts of it under GPL terms
To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
*/