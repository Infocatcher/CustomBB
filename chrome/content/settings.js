var custombbSet = {

	repairSource : function(src) {
		src = src.replace(/\\/g, "\/");
		if(src.match(/^[a-z]:\//i))
			src = "file:///" + src;
		return src;
	},

	settings: function(mode) {
		var strbundle = document.getElementById("custombb-strings");	// Get localized strings...

		var keyName = new Array(13);
		  keyName[0] = "show_toolbar";
		  keyName[1] = "code";
		  keyName[2] = "url";
		  keyName[3] = "bold";
		  keyName[4] = "italic";
		  keyName[5] = "underline";
		  keyName[6] = "color";
		  keyName[7] = "quote";
		  keyName[8] = "inv_commas";
		  keyName[9] = "list";
		  keyName[10] = "img";
		  keyName[11] = "symbol";
		  keyName[12] = "style";

		var prefsBool = new Array(11);
		  prefsBool[0] = "custombb.constrain.links";
		  prefsBool[1] = "custombb.constrain.style.dash";
		  prefsBool[2] = "custombb.constrain.style.dashPlus";
		  prefsBool[3] = "custombb.constrain.style.commas";
		  prefsBool[4] = "custombb.constrain.style.symbols";
		  prefsBool[5] = "custombb.constrain.style.punktMarks";
		  prefsBool[6] = "custombb.selectOutput";
		  prefsBool[7] = "custombb.listAsterisk";
		  prefsBool[8] = "custombb.showAllTooltips";
		  prefsBool[9] = "custombb.toolbarAutoShow";
		  prefsBool[10] = "custombb.toolbarAutoShowAlways";

		var prefsChar = new Array(3);
		  prefsChar[0] = "custombb.constrain.sites";
		  prefsChar[1] = "custombb.key.color";
		  prefsChar[2] = "custombb.key.symbol";

		var otherPrefsChar = new Array(16);
		  otherPrefsChar[0] = "custombb.urlMask";
		  otherPrefsChar[1] = "custombb.urlImgMask";
		  otherPrefsChar[2] = "custombb.colors";
		  otherPrefsChar[3] = "custombb.symbols";
		  otherPrefsChar[4] = "custombb.sizes";
		  otherPrefsChar[5] = "custombb.fonts";
		  otherPrefsChar[6] = "custombb.custom.b1";	// temp...
		  otherPrefsChar[7] = "custombb.custom.b1.src";
		  otherPrefsChar[8] = "custombb.custom.b2";
		  otherPrefsChar[9] = "custombb.custom.b2.src";
		  otherPrefsChar[10] = "custombb.custom.b3";
		  otherPrefsChar[11] = "custombb.custom.b3.src";
		  otherPrefsChar[12] = "custombb.custom.b4";
		  otherPrefsChar[13] = "custombb.custom.b4.src";
		  otherPrefsChar[14] = "custombb.custom.b5";
		  otherPrefsChar[15] = "custombb.custom.b5.src";

		var prefsKey = "";
		var prefsKeyVal = "";
		var prefsKeyEnabled = "";
		var prefsKeyCtrl = "";
		var prefsKeyAlt = "";
		var prefsKeyShift = "";
		var prefsKeyLabel = "";

		if(mode == "export") {
				// thanks to IE Tab
			var patterns = new Array;
			patterns[0] = "[CustomBB-preferences]";
			var z = 1, pref;
		}

		if(mode == "import") {
				// thanks to IE Tab
			var pattern = loadFromFile();

			if (!pattern)
				return false;

		//	if( pattern[0] != "[CustomBB-preferences]" && pattern[0] != "[PHPcode-preferences]" ) {	// Old prefs
			if( !pattern[0].match(/^.*[(CustomBB|PHPcode)-preferences]$/) ) {	// Old prefs
				if(pattern[0].length > 30)
					pattern[0] = pattern[0].substring(0, 27) + "...";
				alert(strbundle.getString("importError") + ":\n" + pattern[0]);
				return false;
			}
			var prefName, prefValue;

			for (i = 1; i < pattern.length; i++) {
				var index = pattern[i].indexOf("=");
				if (index > 0) {
					prefName = pattern[i].substring(0, index);
					prefValue = pattern[i].substring(index + 1, pattern[i].length);

					prefName = prefName.replace(/^phpcode\./, "custombb.");		// Old prefs
					prefValue = prefValue.replace(/^['"]chrome:\/\/phpcode\//, "\"chrome://custombb/");

					if( prefName.match(/^custombb(\.\w+)+/i) ) {
						var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		/**********************/	try {

						if( prefValue.match(/^(true|false)$/) )		// !!! test this !!!
							prefs.setBoolPref(prefName, prefValue == "true");
						else
							if( prefValue.match(/^#\d+#$/) )		// !!! change key to int !!!
								prefs.setIntPref(prefName, prefValue);
							else
								if( prefValue.match(/^["'].*["']$/) )
									prefs.setCharPref(prefName, prefValue.replace(/^["']/, "").replace(/["']$/, ""));

		/**********************/	} catch(e) { alert("Import error:\n" + e); }
					}
				}
			}
		}

		var keyId, keyPrefVal, keyEnabled, keyCtrl, keyAlt, keyShift, keyLabel;

		for(var i = 0; i <= 25; i++) {		// Hotkeys

			if(i <= 12) {
				keyId = "custombb.key." + keyName[i] + ".locale";
				keyPrefVal = nsPreferences.copyUnicharPref(keyId, "");
				keyEnabled = "custombb.key." + keyName[i] + ".locale.enabled";
				keyCtrl = "custombb.key." + keyName[i] + ".locale.ctrl";
				keyAlt = "custombb.key." + keyName[i] + ".locale.alt";
				keyShift = "custombb.key." + keyName[i] + ".locale.shift";
				keyLabel = "custombb.key." + keyName[i] + ".locale.label";
			}
			else {
				keyId = "custombb.key." + keyName[i-13] + ".main";
				keyPrefVal = nsPreferences.copyUnicharPref(keyId, "");
				keyEnabled = "custombb.key." + keyName[i-13] + ".main.enabled";
				keyCtrl = "custombb.key." + keyName[i-13] + ".main.ctrl";
				keyAlt = "custombb.key." + keyName[i-13] + ".main.alt";
				keyShift = "custombb.key." + keyName[i-13] + ".main.shift";
				keyLabel = "custombb.key." + keyName[i-13] + ".main.label";
			}

			if(mode == "load") {
				var keyVal = keyPrefVal.match(/key=\{(.|vk_\w+)\}/i)
						? keyPrefVal.replace(/^.*key=\{/i, "").replace(/\}.*$/, "")			// A
						: "";

				if(keyVal.match(/^vk_/i)) {
					document.getElementById(keyId).removeAttribute("tooltiptext");
					document.getElementById(keyId).setAttribute("popup", "custombb-VKpopup");
					document.getElementById(keyId).removeAttribute("maxlength");
					document.getElementById(keyId).setAttribute("readonly", "true");
				}
				else {
					document.getElementById(keyId).setAttribute("tooltiptext", strbundle.getString("doubleClickForPopUp"));
					document.getElementById(keyId).removeAttribute("popup");
					document.getElementById(keyId).setAttribute("maxlength", 1);
					document.getElementById(keyId).removeAttribute("readonly");
				}
				document.getElementById(keyId).setAttribute("ondblclick", "custombbSet.addVKpopup('" + keyId + "')");	// Doubleclick => pop-up menu

				document.getElementById(keyId).value = keyVal;

				var keyChecked = keyVal != "" && keyPrefVal.match(/enable=true/i);

				document.getElementById(keyEnabled).checked = keyChecked;						// Enable
				document.getElementById(keyCtrl).checked = keyPrefVal.match(/control|ctrl/i);				// Ctrl
				document.getElementById(keyAlt).checked = keyPrefVal.match(/alt/i);					// Alt
				document.getElementById(keyShift).checked = keyPrefVal.match(/shift/i);					// Shift

				document.getElementById(keyCtrl).disabled = !keyChecked;
				document.getElementById(keyAlt).disabled = !keyChecked;
				document.getElementById(keyShift).disabled = !keyChecked;
				document.getElementById(keyId).disabled = !keyChecked;
				document.getElementById(keyLabel).disabled = !keyChecked;
				if(keyId == "custombb.key.color.main" || keyId == "custombb.key.symbol.main")
					document.getElementById(keyId.replace(/\.main/, "")).disabled = !keyChecked;
			}
			if(mode == "write") {
				var prefsKeyOut = document.getElementById(keyEnabled).checked && document.getElementById(keyId).value != ""
						? "enable=true " : "enable=false ";

				if(document.getElementById(keyCtrl).checked)
					prefsKeyOut += "control ";
				if(document.getElementById(keyAlt).checked)
					prefsKeyOut += "alt ";
				if(document.getElementById(keyShift).checked)
					prefsKeyOut += "shift ";

				prefsKeyOut += "key={" +document.getElementById(keyId).value + "}";
				nsPreferences.setUnicharPref(keyId, prefsKeyOut);
			}

			if(mode == "toDefault")
				this.toDefault(keyId);

			if(mode == "export")
				patterns[z++] = keyId + "=\"" + nsPreferences.copyUnicharPref(keyId, "") + "\"";
		}

		for(var i = 1; i <= 20; i++) {		// Smiles
			var smCodeImg = "custombb.smile.code." + i + ".img";		// custombb.smile.code.1.img
			var smCodeIns = "custombb.smile.code." + i + ".ins";		// custombb.smile.code.1.ins
			var smCodeSrc = "custombb.smile.code." + i + ".src";		// custombb.smile.code.1.src
			var smCodeImgSrc = nsPreferences.copyUnicharPref(smCodeSrc, "");

			var smURLImg = "custombb.smile.url." + i + ".img";		// custombb.smile.url.1.img
			var smURLIns = "custombb.smile.url." + i + ".ins";		// custombb.smile.url.1.ins
			var smURLSrc = "custombb.smile.url." + i + ".src";		// custombb.smile.url.1.src
			var smURLImgSrc = nsPreferences.copyUnicharPref(smURLSrc, "");

			if(mode == "load") {
				document.getElementById(smCodeImg).removeAttribute("class");
				document.getElementById(smCodeImg).removeAttribute("tooltiptext");
				document.getElementById(smURLImg).removeAttribute("class");
				document.getElementById(smURLImg).removeAttribute("tooltiptext");

				document.getElementById(smCodeImg).setAttribute("src", custombbCommon.testPatch(smCodeImgSrc));
				document.getElementById(smCodeIns).value = nsPreferences.copyUnicharPref(smCodeIns, "");
				document.getElementById(smCodeSrc).value = smCodeImgSrc;

				document.getElementById(smURLImg).setAttribute("src", custombbCommon.testPatch(smURLImgSrc));
				document.getElementById(smURLIns).value = nsPreferences.copyUnicharPref(smURLIns, "");
				document.getElementById(smURLSrc).value = smURLImgSrc;
			}
			if(mode == "write") {
				nsPreferences.setUnicharPref(smCodeIns, document.getElementById(smCodeIns).value.replace(/^\s*/, "").replace(/\s*$/, ""));
				nsPreferences.setUnicharPref(smCodeSrc, this.repairSource(document.getElementById(smCodeSrc).value));

				nsPreferences.setUnicharPref(smURLIns, document.getElementById(smURLIns).value.replace(/^\[img\]/i, "").replace(/\[\/img\]$/i, ""));
				nsPreferences.setUnicharPref(smURLSrc, this.repairSource(document.getElementById(smURLSrc).value));
			}
			if(mode == "toDefault") {
				this.toDefault(smCodeIns);
				this.toDefault(smCodeSrc);
				this.toDefault(smURLIns);
				this.toDefault(smURLSrc);
			}

			if(mode == "export") {
				patterns[z++] = smCodeIns + "=\"" + nsPreferences.copyUnicharPref(smCodeIns, "") + "\"";
				patterns[z++] = smCodeSrc + "=\"" + nsPreferences.copyUnicharPref(smCodeSrc, "") + "\"";
				patterns[z++] = smURLIns + "=\"" + nsPreferences.copyUnicharPref(smURLIns, "") + "\"";
				patterns[z++] = smURLSrc + "=\"" + nsPreferences.copyUnicharPref(smURLSrc, "") + "\"";
			}
		}

		for(var i = 1; i <= 15; i++) {		// Custom
			var customSrc = nsPreferences.copyUnicharPref("custombb.custom." + i, "");
			var customImgSrc = nsPreferences.copyUnicharPref("custombb.custom." + i + ".src", "");
			var customItem = "custombb.custom." + i;

			if(mode == "load") {
				document.getElementById(customItem + ".img").removeAttribute("class");
				document.getElementById(customItem + ".img").removeAttribute("tooltiptext");

				document.getElementById(customItem + ".img").setAttribute("src", custombbCommon.testPatch(customImgSrc));

				document.getElementById(customItem + ".src").value = customImgSrc;
				document.getElementById(customItem + ".lbl").value = customSrc.replace(/^.*label=\{/i, "").replace(/\}([^\}]?(opentag|closetag)=\{.*$|$)/i, "");
				document.getElementById(customItem + ".top").value = customSrc.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "");
				document.getElementById(customItem + ".tcl").value = customSrc.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "");
			}
			if(mode == "write") {
				nsPreferences.setUnicharPref(customItem + ".src", this.repairSource(document.getElementById(customItem + ".src").value));

				var customOut = "openTag={" + document.getElementById(customItem + ".top").value + "} closeTag={"
							    + document.getElementById(customItem + ".tcl").value + "} label={"
							    + document.getElementById(customItem + ".lbl").value + "}";

				nsPreferences.setUnicharPref(customItem, customOut);
			}

			if(mode == "toDefault") {
				this.toDefault(customItem + ".src");
				this.toDefault(customItem);
			}

			if(mode == "export") {
				patterns[z++] = customItem + ".src" + "=\"" + nsPreferences.copyUnicharPref(customItem + ".src", "") + "\"";
				patterns[z++] = customItem + "=\"" + nsPreferences.copyUnicharPref(customItem, "") + "\"";
			}
		}

		if(mode == "load") {
			for(var id = 0; id < prefsChar.length; id++)
				document.getElementById(prefsChar[id]).value = nsPreferences.copyUnicharPref(prefsChar[id], "");

			for(var id = 0; id < prefsBool.length; id++)
				document.getElementById(prefsBool[id]).checked = nsPreferences.getBoolPref(prefsBool[id], false);

			this.disableSubCheckbox();
			this.disableSubCheckboxAdd();
		}

		if(mode == "write") {
			for(var id = 0; id < prefsChar.length; id++)
				nsPreferences.setUnicharPref(prefsChar[id], document.getElementById(prefsChar[id]).value);

			for(var id = 0; id < prefsBool.length; id++)
				nsPreferences.setBoolPref(prefsBool[id], document.getElementById(prefsBool[id]).checked);
		}

		if(mode == "toDefault") {
			for(var id = 0; id < prefsChar.length; id++)
				this.toDefault(prefsChar[id]);

			for(var id = 0; id < prefsBool.length; id++)
				this.toDefault(prefsBool[id]);

			for(var id = 0; id < otherPrefsChar.length; id++)
				this.toDefault(otherPrefsChar[id]);
		}

		if(mode == "export") {
			for(var id = 0; id < prefsChar.length; id++)
				patterns[z++] = prefsChar[id] + "=\"" + nsPreferences.copyUnicharPref(prefsChar[id], "") + "\"";

			for(var id = 0; id < prefsBool.length; id++)
				patterns[z++] = prefsBool[id] + "=" + nsPreferences.getBoolPref(prefsBool[id], false);

			for(var id = 0; id < otherPrefsChar.length; id++)
				patterns[z++] = otherPrefsChar[id] + "=\"" + nsPreferences.copyUnicharPref(otherPrefsChar[id], "") + "\"";

			saveToFile(patterns);
		}

		function saveToFile (patterns) {
				// thanks to IE Tab
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
			var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);

			var strbundle = document.getElementById("custombb-strings");
			var savePrefsFile=strbundle.getString("savePrefsFile");

			fp.init(window, savePrefsFile, fp.modeSave);
			fp.defaultExtension = "txt";

				// Get current date:
			var timeStamp = new Date();

			var month = timeStamp.getMonth() + 1;
			month = month <= 9 ? "0" + month : month;			// 6 (june) -> 06

			var date = timeStamp.getDate();
			date = date <= 9 ? "0" + date : date;				// 7 -> 07

			date = timeStamp.getFullYear() + "_" + month + "_" + date;	// 2007_06_07

			fp.defaultString = "CustomBBprefs" + "_" + date;
			fp.appendFilters(fp.filterText);

			if (fp.show() != fp.returnCancel) {
				try {
					if (fp.file.exists())
						fp.file.remove(true);
					fp.file.create(fp.file.NORMAL_FILE_TYPE, 0666);
					stream.init(fp.file, 0x02, 0x200, null);
					converter.init(stream, "UTF-8", 0, 0x0000);

					for (var i = 0; i < patterns.length ; i++) {
						patterns[i] = patterns[i] + "\n";
            					converter.writeString(patterns[i]);
					}
				}
				finally {
					converter.close();
					stream.close();
				}
			}
		}

		function loadFromFile() {
				// thanks to IE Tab
				// big thanks to ImgLikeOpera!
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
			var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
			var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
		//	var converter = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);

			var strbundle = document.getElementById("custombb-strings");
			var openPrefsFile=strbundle.getString("openPrefsFile");

			fp.init(window, openPrefsFile, fp.modeOpen);
			fp.defaultExtension = "txt";
			fp.appendFilters(fp.filterText);

			if (fp.show() != fp.returnCancel) {
				var input;
				stream.init(fp.file, 0x01, 0444, null);
				streamIO.init(stream);					// Code by ImgLikeOpera
				input = streamIO.read(stream.available());		// reading in ASCII...
				streamIO.close();					// I don't know, how to use this with converter to UTF-8 :(
				stream.close();						// Original code by IE Tab not return all text...
				var linebreak = input.match(/(((\n+)|(\r+))+)/m)[1];	// But reading as ASCII, saving as ASCII (prefs.setCharPref())...
				return input.split(linebreak);				// And reading by nsPreferences work fine! =)
			}
			return null;
		}

	},

	disableSubCheckbox: function() {
		document.getElementById("custombb.constrain.style.dashPlus").disabled = !document.getElementById("custombb.constrain.style.dash").checked;
	},

	disableSubCheckboxAdd: function() {
		document.getElementById("custombb.toolbarAutoShowAlways").disabled = !document.getElementById("custombb.toolbarAutoShow").checked;
	},

	disableSubItems: function(id) {
		id = "custombb." + id;
		var disableItem = !document.getElementById(id + ".enabled").checked;
		document.getElementById(id + ".alt").disabled = disableItem;
		document.getElementById(id + ".ctrl").disabled = disableItem;
		document.getElementById(id + ".shift").disabled = disableItem;
		document.getElementById(id).disabled = disableItem;
		document.getElementById(id + ".label").disabled = disableItem;
		if(id == "custombb.key.color.main" || id == "custombb.key.symbol.main")
			document.getElementById(id.replace(/\.main/, "")).disabled = disableItem;
	},

	goHelp: function() {		// Open help window
		var x = (screen.width/2) - 280;
		var y = (screen.height/2) - 200;
		var loc = "left=" + x + ", top=" + y;
		window.open("chrome://custombb/locale/help.htm", "", "chrome, scrollbars, resizable, width=560, height=400, " + loc);
	},

	selectImg: function(id) {			// 'smile.code.1'
		// thanks to Custom Buttons
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

		var strbundle = document.getElementById("custombb-strings");
		var selectImg=strbundle.getString("selectImage");

		fp.init(window, selectImg, 0);
		fp.appendFilters(nsIFilePicker.filterImages);
		if(fp.show() == nsIFilePicker.returnOK) {
			var imageURL = unescape(fp.fileURL.spec).replace(/\\/g, "\/");
			var profileDir = nsPreferences.copyUnicharPref("custombb.profileDir", "");
			var imageURLnew = imageURL.substring(0, profileDir.length) == profileDir
					? "%profile%" + imageURL.substring(profileDir.length, imageURL.length)
					: imageURL;

			document.getElementById("custombb." + id + ".src").value = imageURLnew;
			document.getElementById("custombb." + id + ".img").setAttribute("src", imageURL);	// Reload image
			// Set style for not saved image:
			document.getElementById("custombb." + id + ".img").setAttribute("class", "custombb-notsaved");
			var notSaved=strbundle.getString("imageNotSaved");
			document.getElementById("custombb." + id + ".img").setAttribute("tooltiptext", notSaved);
		}
	},

	toDefault: function(pref) {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		if(prefs.prefHasUserValue(pref))
			prefs.clearUserPref(pref);
	},

	customEditor: function(mode) {
		var i = window.arguments[0];

		var customItem = "custombb.custom." + i;
		var customSrc = nsPreferences.copyUnicharPref(customItem, "");
		var customImgSrc = nsPreferences.copyUnicharPref(customItem + ".src", "");

		if(mode == "load") {
			document.getElementById("custombb.customEditor.img").removeAttribute("class");
			document.getElementById("custombb.customEditor.img").removeAttribute("tooltiptext");

			document.getElementById("custombb.customEditor.img").setAttribute("src", custombbCommon.testPatch(customImgSrc));
			document.getElementById("custombb.customEditor.src").value = customImgSrc;
			document.getElementById("custombb.customEditor.lbl").value = customSrc.replace(/^.*label=\{/i, "").replace(/\}([^\}]?(opentag|closetag)=\{.*$|$)/i, "");
			document.getElementById("custombb.customEditor.top").value = customSrc.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "");
			document.getElementById("custombb.customEditor.tcl").value = customSrc.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "");
		}
		if(mode == "write") {
			nsPreferences.setUnicharPref(customItem + ".src", this.repairSource(document.getElementById("custombb.customEditor.src").value));

			var customOut = "openTag={" + document.getElementById("custombb.customEditor.top").value + "} closeTag={"
						    + document.getElementById("custombb.customEditor.tcl").value + "} label={"
						    + document.getElementById("custombb.customEditor.lbl").value + "}";

			nsPreferences.setUnicharPref(customItem, customOut);
		}
		if(mode == "default") {
			this.toDefault(customItem + ".src");
			this.toDefault(customItem);

			this.customEditor('load');
		}
	},

	smileEditor: function(mode) {
		var i = window.arguments[0];
		var type = window.arguments[1] == "smile-code" ? "code" : "url";

		var smileItem = "custombb.smile." + type + "." + i;
		var smileSrc = nsPreferences.copyUnicharPref(smileItem + ".src", "");

		if(mode == "load") {
			document.getElementById("custombb.smileEditor.img").removeAttribute("class");
			document.getElementById("custombb.smileEditor.img").removeAttribute("tooltiptext");

			document.getElementById("custombb.smileEditor.img").setAttribute("src", custombbCommon.testPatch(smileSrc));
			document.getElementById("custombb.smileEditor.src").value = smileSrc;
			document.getElementById("custombb.smileEditor.ins").value = nsPreferences.copyUnicharPref(smileItem + ".ins", "");

			if(type == "code") {
				document.getElementById("custombb.smileEditor.preview").value = "";
				document.getElementById("custombb.smileEditor.preview").removeAttribute("tooltip");
			}
		}
		if(mode == "write") {
			nsPreferences.setUnicharPref(smileItem + ".src", this.repairSource(document.getElementById("custombb.smileEditor.src").value));
			nsPreferences.setUnicharPref(smileItem + ".ins", document.getElementById("custombb.smileEditor.ins").value.replace(/^\[img\]|\s*/i, "").replace(/\[\/img\]|\s*$/i, ""));
		}
		if(mode == "default") {
			this.toDefault(smileItem + ".src");
			this.toDefault(smileItem + ".ins");

			this.smileEditor('load');
		}
	},

	sizeEditor: function(mode) {
		var num = window.arguments[0];

		var sizeSrc = nsPreferences.copyUnicharPref("custombb.sizes", "");

		var size = new Array;
		var label = new Array;
		var style = new Array;

		for(var i = 0; i <= 9; i++) {		// This is necessary for preference repairing...
			size.push( custombbCommon.cutPref(sizeSrc, "size", i + 1) );
			label.push( custombbCommon.cutPref(sizeSrc, "label", i + 1) );
			style.push( custombbCommon.cutPref(sizeSrc, "style", i + 1) );
		}

		var composeNewPref = function() {
			var sizeSrcNew = "";

			for(var i = 0; i <= 9; i++)
				sizeSrcNew += "size" + (i + 1) + "={" + size[i] + "} " +
					       "label" + (i + 1) + "={" + label[i] + "} " +
					       "style" + (i + 1) + "={" + style[i] + "} ";

			return sizeSrcNew.replace(/ $/, "");
		}

		if(mode == "load") {
			document.getElementById("custombb.sizeEditor.size").value = size[num - 1];
			document.getElementById("custombb.sizeEditor.label").value = label[num - 1];

			document.getElementById("custombb.sizeEditor.styleSize").value = style[num - 1].replace(/(pt|px|em|%)$/, "");

			var styleType = style[num - 1].replace(/^["']?\d*(\.\d+)?["']?/, "");
			styleType = styleType.match(/^(pt|px|em|%)$/) ? styleType : "pt";
			document.getElementById("custombb.sizeEditor.styleType").value = styleType;

			custombbEdit.textToSize();
		}
		if(mode == "write") {
			custombbEdit.repairSize();	// "," => "." + [^\d] => "" ('oninput' not work with drag and drop...)

			size[num - 1] = document.getElementById("custombb.sizeEditor.size").value;
			label[num - 1] = document.getElementById("custombb.sizeEditor.label").value;
			style[num - 1] = document.getElementById("custombb.sizeEditor.styleSize").value
					+ document.getElementById("custombb.sizeEditor.styleType").value;

			nsPreferences.setUnicharPref("custombb.sizes", composeNewPref());
		}
		if(mode == "default") {
			this.toDefault("custombb.sizes");		// Reset all...
			sizeSrc = nsPreferences.copyUnicharPref("custombb.sizes", "");

			size[num - 1] = custombbCommon.cutPref(sizeSrc, "size", num);	// Get default value
			label[num - 1] = custombbCommon.cutPref(sizeSrc, "label", num);
			style[num - 1] = custombbCommon.cutPref(sizeSrc, "style", num);

			nsPreferences.setUnicharPref("custombb.sizes", composeNewPref());

			this.sizeEditor('load');
		}
	},

	symbolEditor: function(mode) {
		var num = window.arguments[0];

		var symbolSrc = nsPreferences.copyUnicharPref("custombb.symbols", "");

		var symbol = new Array;
		var label = new Array;

		for(var i = 0; i <= 9; i++) {		// This is necessary for repairing preference after incorrect set...
			symbol.push( custombbCommon.cutPref(symbolSrc, "symbol", i + 1) );
			label.push( custombbCommon.cutPref(symbolSrc, "label", i + 1) );
		}

		var composeNewPref = function() {
			var symbolSrcNew = "";

			for(var i = 0; i <= 9; i++)
				symbolSrcNew += "symbol" + (i + 1) + "={" + symbol[i] + "} " +
					        "label" + (i + 1) + "={" + label[i] + "} ";

			return symbolSrcNew.replace(/ $/, "");
		}

		if(mode == "load") {
			document.getElementById("custombb.symbolEditor.symbol").value = symbol[num - 1];
			document.getElementById("custombb.symbolEditor.label").value = label[num - 1];
		}
		if(mode == "write") {
			symbol[num - 1] = document.getElementById("custombb.symbolEditor.symbol").value;
			label[num - 1] = document.getElementById("custombb.symbolEditor.label").value;

			nsPreferences.setUnicharPref("custombb.symbols", composeNewPref());
		}
		if(mode == "default") {
			this.toDefault("custombb.symbols");		// Reset all...
			symbolSrc = nsPreferences.copyUnicharPref("custombb.symbols", "");

			symbol[num - 1] = custombbCommon.cutPref(symbolSrc, "symbol", num);	// Get default value
			label[num - 1] = custombbCommon.cutPref(symbolSrc, "label", num);

			nsPreferences.setUnicharPref("custombb.symbols", composeNewPref());

			this.symbolEditor('load');
		}
	},

	fontEditor: function(mode) {
		var num = window.arguments[0];

		var fontSrc = nsPreferences.copyUnicharPref("custombb.fonts", "");

		var font = new Array;
		var label = new Array;

		for(var i = 0; i <= 9; i++) {		// This is necessary for repairing preference...
			font.push( custombbCommon.cutPref(fontSrc, "font", i + 1) );
			label.push( custombbCommon.cutPref(fontSrc, "label", i + 1) );
		}

		var composeNewPref = function() {
			var fontSrcNew = "";

			for(var i = 0; i <= 9; i++)
				fontSrcNew += "font" + (i + 1) + "={" + font[i] + "} " +
					      "label" + (i + 1) + "={" + label[i] + "} ";

			return fontSrcNew.replace(/ $/, "");
		}

		if(mode == "load") {
			document.getElementById("custombb.fontEditor.font").value = font[num - 1];
			document.getElementById("custombb.fontEditor.label").value = label[num - 1];

			custombbEdit.textToFont();
		}
		if(mode == "write") {
			font[num - 1] = document.getElementById("custombb.fontEditor.font").value;
			label[num - 1] = document.getElementById("custombb.fontEditor.label").value;

			nsPreferences.setUnicharPref("custombb.fonts", composeNewPref());
		}
		if(mode == "default") {
			this.toDefault("custombb.fonts");		// Reset all...
			fontSrc = nsPreferences.copyUnicharPref("custombb.fonts", "");

			font[num - 1] = custombbCommon.cutPref(fontSrc, "font", num);	// Get default value
			label[num - 1] = custombbCommon.cutPref(fontSrc, "label", num);

			nsPreferences.setUnicharPref("custombb.fonts", composeNewPref());

			this.fontEditor('load');
		}
	},

	colorEditor: function(mode) {
		var num = window.arguments[0];

		var colorSrc = nsPreferences.copyUnicharPref("custombb.colors", "");

		var color = new Array;
		var label = new Array;
		var style = new Array;

		for(var i = 0; i <= 14; i++) {		// This is necessary for repairing preference...
			color.push( custombbCommon.cutPref(colorSrc, "color", i + 1) );
			label.push( custombbCommon.cutPref(colorSrc, "label", i + 1) );

			var s = custombbCommon.cutPref(colorSrc, "style", i + 1);
			if( !s.match(/^(black|white)$/) )
				s = "none";

			style.push(s);
		}

		var composeNewPref = function() {
			var pref = "";

			for(var i = 0; i <= 14; i++)
				pref += "color" + (i + 1) + "={" + color[i] + "} " +
					       "label" + (i + 1) + "={" + label[i] + "} " +
					       "style" + (i + 1) + "={" + style[i] + "} ";

			return pref.replace(/ $/, "");
		}

		if(mode == "load") {
			document.getElementById("custombb.colorEditor.color").value = color[num - 1];
			document.getElementById("custombb.colorEditor.label").value = label[num - 1];
			document.getElementById("custombb.colorEditor.style").value = style[num - 1];

			custombbEdit.textToColor();
		}
		if(mode == "write") {
			color[num - 1] = document.getElementById("custombb.colorEditor.color").value;
			label[num - 1] = document.getElementById("custombb.colorEditor.label").value;
			style[num - 1] = document.getElementById("custombb.colorEditor.style").value;

			nsPreferences.setUnicharPref("custombb.colors", composeNewPref());
		}
		if(mode == "default") {
			this.toDefault("custombb.colors");		// Reset all...
			colorSrc = nsPreferences.copyUnicharPref("custombb.colors", "");

			color[num - 1] = custombbCommon.cutPref(colorSrc, "color", num);	// Get default value
			label[num - 1] = custombbCommon.cutPref(colorSrc, "label", num);
			style[num - 1] = custombbCommon.cutPref(colorSrc, "style", num);;

			nsPreferences.setUnicharPref("custombb.colors", composeNewPref());

			this.colorEditor("load");
		}
	},

	addVKpopup: function(id) {
		document.getElementById(id).setAttribute("popup", "custombb-VKpopup");
	},

	initVKpopup: function() {
		var id = document.popupNode.getAttribute("id");		// Get textbox id...

		document.getElementById(id).setAttribute("popup", "custombb-VKpopup");	// Add pop-up...

		var VK = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "LEFT", "RIGHT",
			"UP", "DOWN", "TAB", "ENTER", "ESCAPE", "PAGE_UP", "PAGE_DOWN", "END", "HOME", "PRINTSCREEN",
			"PAUSE", "INSERT", "DELETE", "BACK", "CAPS_LOCK", "NUM_LOCK", "SCROLL_LOCK"];

		for(var i = 0; i < VK.length; i++) {
			var cmd = "custombbSet.insVK('" + id + "', '" + VK[i] + "')";
			document.getElementById("custombb-VK_" + VK[i]).setAttribute("oncommand", cmd);
		}

		var cmd = "custombbSet.insText('" + id + "')";
		document.getElementById("custombb-noVK").setAttribute("oncommand", cmd);
	},

	insVK: function(id, VK) {
		var tb = document.getElementById(id);

		tb.removeAttribute("tooltiptext");
		tb.removeAttribute("maxlength");
		tb.value = "VK_" + VK;
		tb.setAttribute("readonly", "true");
	},

	insText: function(id) {
		var tb = document.getElementById(id);
		var strbundle = document.getElementById("custombb-strings");

		tb.setAttribute("tooltiptext", strbundle.getString("doubleClickForPopUp"));
		tb.removeAttribute("readonly");
		tb.setAttribute("maxlength", 1);
		tb.removeAttribute("popup");
		var keyVal = tb.value;
		tb.value = keyVal.match(/^VK_/)
			? ""
			: keyVal;

		tb.focus();
		tb.select();
	}
};