var custombbOpts = {

	keysPaneIsLoaded: null, // If it is not loaded, ...getElementById(...).value return error

	keysNames: ["showToolbar", "code", "url", "bold", "italic", "underline", "strike",
		"color", "quote", "invCommas", "list", "img", "symbol", "style", "custom"],
	keyTypes: ["main", "locale"],

	startWinHeight: null,
	heightDelta: null,

	init: function() {
		custombbCommon.setAttributes(
			document.documentElement.getButton("extra2"),
			{
				popup: "custombb-options-popup",
				dir: "reverse",
				image: "chrome://custombb/skin/img/arrow.png"
			}
		);

		this.initCheckBoxes();
		setTimeout(function() {
			custombbOpts.getStartWinHeight(); // bug?
		}, 0);

		if(nsPreferences.getBoolPref("browser.preferences.instantApply", false))
			document.documentElement.getButton("accept").hidden = false;
	},

	initKeys: function() {
		// init VK:
		var vk = document.getElementById("custombb-VKpopup");
		var mis = vk.getElementsByTagName("menuitem");
		for(var i = 0; i < mis.length; i++)
			mis[i].setAttribute("oncommand", "custombbOpts.setKeyTextbox(this);");

		this.keysPaneIsLoaded = true;

		this.createKeysRows();
		this.settings("load");

		setTimeout(function() {
			custombbOpts.getHeightDelta();
		}, 0);
		setTimeout(function() {
			window.addEventListener("resize", custombbOpts.resize, false);
			custombbOpts.resize();
		}, 20);
	},

	getHeight: function(it) {
		return parseInt(window.getComputedStyle(it, "").height.replace(/[^\d\.]/g, ""));
	},

	getStartWinHeight: function() {
		var wh = window.outerHeight;
		if(wh < 150) {
			setTimeout(function() {
				custombbOpts.addGridResize();
			}, 300);
			return;
		}
		this.startWinHeight = wh; // copy
	},

	getHeightDelta: function() {
		var oldWH = custombbOpts.startWinHeight;
		if(!oldWH) {
			setTimeout(function() {
				custombbOpts.getHeightDelta();
			}, 100);
			return;
		}
		var grh = this.getHeight(document.getElementById("custombb-options-keysGrid"));
		this.heightDelta = oldWH - grh;
	},

	resize: function() {
		var hD = custombbOpts.heightDelta;
		if(!hD) {
			setTimeout(function() {
				custombbOpts.resize();
			}, 50);
			return;
		}
		var wh = window.outerHeight;
		var nH = wh - hD;
		if(nH > 0)
			document.getElementById("custombb-options-keysGrid").style.height = nH + "px";
	},

	createKeysRows: function() {
		var keyNames = this.keysNames;
		var keyTps = this.keyTypes;
		var keyIds = [".enabled", ".ctrl",    ".alt",     ".shift",   ".accel",   ".meta",    "",        ".label"];
		var its =    ["checkbox", "checkbox", "checkbox", "checkbox", "checkbox", "checkbox", "textbox", "label"];

		var rws = document.getElementById("custombb-options-keysRows");

		for(var i = 0; i < keyNames.length; i++) {
			var kName = keyNames[i];
			for(var j = 0; j < keyTps.length; j++) {
				var kTp = keyTps[j];
				var rw = document.createElement("row");
				rws.appendChild(rw);
				rw.setAttribute("align", "center");

				var hb = null;

				for(var k = 0; k < keyIds.length; k++) {
					var kId = keyIds[k];
					var id = "custombb.key." + kName + "." + kTp + kId;
					var it = document.createElement(its[k]);
					it.setAttribute("id", id);

					rw.appendChild(it);

					if(/^(color|symbol|custom)$/.test(kName) && kId == ".label" && kTp == "locale") {
						var hb = document.createElement("hbox");
						hb.setAttribute("pack", "center");
						var ml = document.createElement("menulist");
						hb.appendChild(ml);
						custombbCommon.setAttributes(ml, {
							id: "custombb.key." + kName,
							width: "170px"
						});
						var mp = document.createElement("menupopup");
						ml.appendChild(mp);
						mp.setAttribute("onpopupshowing", "custombbCmmSet.createNumPopup(this, '" + kName + "s');");
					}
				}

				if(hb)
					rws.appendChild(hb);

				if(kTp == "locale" && i != keyNames.length - 1) {
					var sep = document.createElement("separator");
					rws.appendChild(sep);
					custombbCommon.setAttributes(sep, {
						"class": "groove",
						flex: "1"
					});
				}
			}
		}

		var lbls = rws.getElementsByTagName("label");
		if(lbls.length != keyNames.length*2) { // test
			alert("Error:\nkeyNames.length = " + keyNames.length + "\nlbls.length = " + lbls.length);
			return;
		}
		for(var i = 1; i < lbls.length; i += 2) {
			var sName = keyNames[(i - 1)/2];
			var txt = custombbCommon.getLocalised(sName + "Label");
			lbls[i - 1].value = txt + "*";
			lbls[i].value = txt;
		}
	},

	settings: function(mode) {
		switch(mode) {
			case "load":    var load  = true; break;
			case "save":    var save  = true; break;
			case "apply":   var apply = true; break;
			case "export":  var exp   = true; break;
			case "import":  var imp   = true; break;
			case "default": var def   = true; break;
			default: alert("Invalid mode: " + mode);
		}

		if(exp) {
			this.settings("apply");

				// thanks to IE Tab
			var pArr = [];
			pArr[0] = "[CustomBB 0.2.* preferences]";
			var z = 1;
		}

		if(imp || exp || def) {
			// other prefs:
			var opChar = custombbCommon.addToArr("",
 				["colors", "sizes", "fonts", "symbols", "smileysCodes", "smileysURLs", "customs", "customButtons"]
			);
			var opInt = custombbCommon.addToArr("",
 				["colorsQuantity", "sizesQuantity", "fontsQuantity", "symbolsQuantity", "smileysCodesQuantity",
 				"smileysCodesColumns", "smileysURLsQuantity", "smileysURLsColumns", "customsQuantity",
				"previewUpdateTimeout", "preloadTimeout"]
			);
			var opBool = custombbCommon.addToArr("",
 				["modalColorpicker", "previewUseExternalSmileysURLs", "previewShowAllSpaces"]
			);
		}

		if(imp) {
			var pIdArr = [];
			var p = 0;
		}

		/******* Keys begin *******/
		var keyNames = this.keysNames;
		var keyTps = this.keyTypes;

		for(var i = 0; i < keyNames.length; i++)
			for(var j = 0; j < keyTps.length; j++) {
				var keyId = "custombb.key." + keyNames[i] + "." + keyTps[j];

				var enableIt = document.getElementById(keyId + ".enabled");
				var ctrlIt = document.getElementById(keyId + ".ctrl");
				var altIt = document.getElementById(keyId + ".alt");
				var shiftIt = document.getElementById(keyId + ".shift");
				var accelIt = document.getElementById(keyId + ".accel");
				var metaIt = document.getElementById(keyId + ".meta");
				var keyIt = document.getElementById(keyId);

				if(load || exp)
					var keyPref = nsPreferences.copyUnicharPref(keyId, "");

				if(load && this.keysPaneIsLoaded) {
					var keyVal = /(^| )key=\{(.|vk_\w+)\}( |$)/i.test(keyPref)
						? keyPref.replace(/^.*key=\{/i, "")
							.replace(/\}( +(ctrl|control|alt|shift|accel|meta|enable=(true|false)).*)?$/i, "")
						: "";

					if(/^vk_/i.test(keyVal)) {
						keyIt.removeAttribute("maxlength");
						keyIt.setAttribute("readonly", "true");
					}
					else {
						keyIt.setAttribute("maxlength", 1);
						keyIt.removeAttribute("readonly");
					}
					keyIt.value = keyVal;
					keyIt.setAttribute("context", "custombb-VKpopup");

					enableIt.setAttribute("oncommand", "custombbOpts.disableRow(this);");
					var enab = keyVal && /enable=true/i.test(keyPref);
					enableIt.checked = enab;
					this.disableRow(enableIt);

					ctrlIt.checked = /(^| )(control|ctrl)( |$)/i.test(keyPref);
					altIt.checked = /(^| )alt( |$)/i.test(keyPref);
					shiftIt.checked = /(^| )shift( |$)/i.test(keyPref);
					accelIt.checked = /(^| )accel( |$)/i.test(keyPref);
					metaIt.checked = /(^| )meta( |$)/i.test(keyPref);
				}
				if((save || apply) && this.keysPaneIsLoaded) {
					var keyVal = keyIt.value;

					var keyPrefOut = enableIt.checked && keyVal
						? "enable=true" : "enable=false";

					if(ctrlIt.checked)
						keyPrefOut += " control";
					if(altIt.checked)
						keyPrefOut += " alt";
					if(shiftIt.checked)
						keyPrefOut += " shift";
					if(accelIt.checked)
						keyPrefOut += " accel";
					if(metaIt.checked)
						keyPrefOut += " meta";

					keyPrefOut += " key={" + keyVal + "}";
					nsPreferences.setUnicharPref(keyId, keyPrefOut);
				}

				if(def)
					custombbCmmSet.toDefault(keyId);

				if(exp)
					pArr[z++] = keyId + '="' + keyPref + '"';

				if(imp)
					pIdArr[p++] = keyId;
			}

		var numPrefs = ["color", "symbol", "custom"];
		for(var i = 0; i < numPrefs.length; i++) {
			var numId = "custombb.key." + numPrefs[i];
			var numIt = document.getElementById(numId);

			if(load || exp)
				var numVal = nsPreferences.getIntPref(numId, 1);

			if(load && this.keysPaneIsLoaded) {
				numIt.value = numVal;

				var pServ = custombbCommon.prefs;
				pServ.init(numPrefs[i] + "s");
				var lbl = numVal + ". " + pServ.getAttr("label", numVal);
				numIt.setAttribute("label", lbl);
			}
			if((save || apply) && this.keysPaneIsLoaded)
				nsPreferences.setIntPref(numId, numIt.value);

			if(def)
				custombbCmmSet.toDefault(numId);

			if(exp)
				pArr[z++] = numId + "=" + numVal;

			if(imp)
				pIdArr[p++] = numId;
		}
		/******* Keys end *******/

		if(imp || exp || def) {	// <preferences> ... <preference /> ... </preferences>
			var prfs = document.getElementsByTagName("preference");
			var prfsl = prfs.length;
			var pPaneIds = [], pPaneTps = [];
			for(var i = 0; i < prfsl; i++) {
				var prf = prfs[i];
				pPaneIds[i] = prf.getAttribute("name");
				pPaneTps[i] = prf.getAttribute("type");
			}
			for(var i = 0; i < prfsl; i++) {
				var cId = pPaneIds[i];
				if(exp) {
					switch(pPaneTps[i]) {
						case "bool":
							pArr[z++] = cId + "=" + nsPreferences.getBoolPref(cId, true);
						break;

						case "string":
							pArr[z++] = cId + '="' + nsPreferences.copyUnicharPref(cId, "") + '"';
						break;
						case "int":
							pArr[z++] = cId + "=" + nsPreferences.getIntPref(cId, 1);
						break;
						default:
							alert("settings(mode) error:\npPaneTps[" + i + "] = " + pPaneTps[i]); return;
					}
				}
				if(def)
					custombbCmmSet.toDefault(cId);

				if(imp)
					pIdArr[p++] = cId;
			}
		}
		if(def) {
			for(var i = 0; i < opChar.length; i++)
				custombbCmmSet.toDefault(opChar[i]);

			for(var i = 0; i < opInt.length; i++)
				custombbCmmSet.toDefault(opInt[i]);

			for(var i = 0; i < opBool.length; i++)
				custombbCmmSet.toDefault(opBool[i]);
		}
		if(exp) {
			for(var i = 0; i < opChar.length; i++)
				pArr[z++] = opChar[i] + '="' + nsPreferences.copyUnicharPref(opChar[i], "") + '"';

			for(var i = 0; i < opInt.length; i++)
				pArr[z++] = opInt[i] + "=" + nsPreferences.getIntPref(opInt[i], 1);

			for(var i = 0; i < opBool.length; i++)
				pArr[z++] = opBool[i] + "=" + nsPreferences.getBoolPref(opBool[i], true);

			//pArr.sort();

			this.saveToFile(pArr);
		}
		if(imp) {
			for(var i = 0; i < opChar.length; i++)
				pIdArr[p++] = opChar[i];

			for(var i = 0; i < opInt.length; i++)
				pIdArr[p++] = opInt[i];

			for(var i = 0; i < opBool.length; i++)
				pIdArr[p++] = opBool[i];

			var allImpPrefs = pIdArr.join("\n");

			// thanks to IE Tab
			var pArr = this.loadFromFile();

			if(!pArr)
				return;

			if(pArr[0] != "[CustomBB 0.2.* preferences]") {
				if(pArr[0].length > 30)
					pArr[0] = pArr[0].substring(0, 27) + "...";

				alert(custombbCommon.getLocalised("importError") + ":\n" + pArr[0]);
				return;
			}

			var pName, pValue;

			var invSynt = custombbCommon.getLocalised("invalidPrefsFileSyntax");

			for(var i = 1; i < pArr.length; i++) {
				var index = pArr[i].indexOf("=");
				if(index > 0) {
					pName = pArr[i].substring(0, index);
					pValue = pArr[i].substring(index + 1, pArr[i].length);

					var ok = allImpPrefs.match(
						new RegExp("^" + pName.replace(/\./g, "\\.") + "$", "m")
					);
					if(ok) {
						try {
							if(/^(true|false)$/.test(pValue))
								nsPreferences.setBoolPref(pName, pValue == "true");
							else
								if(/^-?\d+$/.test(pValue))
									nsPreferences.setIntPref(pName, pValue);
								else
									if(/^".*"$/.test(pValue))
										nsPreferences.setUnicharPref(pName, pValue.substring(1, pValue.length - 1));
									else
										alert(invSynt + ":\n" + pArr[i]);
						}
						catch(e) {
							alert(custombbCommon.getLocalised("unknownImportError") + ":\n" + pArr[i] + "\n\n" + e);
						}
					}
					else
						alert(custombbCommon.getLocalised("invalidPrefName") + ":\n" + pName);
				}
				else
					alert(invSynt + ":\n" + pArr[i]);
			}
		}

		if(apply || def || imp)
			this.settings("load");

		if(save || apply || def || imp)
			custombbCmmSet.execInAllWindows(function(w) {
				w.custombb.initAutoShow();
				w.custombb.initKeyCommands();
			});

		if(imp || def)
			custombbCmmSet.execInAllWindows(function(w) {
				w.custombb.initCustomItems("button");
			});
	},

	saveToFile: function(pArr) {
		// thanks to IE Tab
		var fp = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);
		var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Components.interfaces.nsIFileOutputStream);
		var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
			.createInstance(Components.interfaces.nsIConverterOutputStream);

		fp.init(window, custombbCommon.getLocalised("savePrefsFile"), fp.modeSave);
		fp.defaultExtension = "txt";

		// Get current date:
		var cDate = new Date();
		var month = cDate.getMonth() + 1;
		month = month < 10 ? "0" + month : month;			// 6 (june) -> 06
		var date = cDate.getDate();
		date = date < 10 ? "0" + date : date;				// 7 -> 07
		date = cDate.getFullYear() + "-" + month + "-" + date;	// 2007-06-07

		fp.defaultString = "CustomBB_prefs" + "_" + date;
		fp.appendFilters(fp.filterText);

		if(fp.show() != fp.returnCancel) {
			try {
				if(fp.file.exists())
					fp.file.remove(true);

				fp.file.create(fp.file.NORMAL_FILE_TYPE, 0666);
				stream.init(fp.file, 0x02, 0x200, null);
				converter.init(stream, "UTF-8", 0, 0x0000);

				for(var i = 0; i < pArr.length; i++)
        			converter.writeString(pArr[i] + "\n");
			}
			finally {
				converter.close();
				stream.close();
			}
		}
	},

	loadFromFile: function() {
		// thanks to ImgLikeOpera
		var fp = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);
		var stream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
		var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"]
			.createInstance(Components.interfaces.nsIScriptableInputStream);

		var conv = function(data) {
			// thanks to Launchy
			try {
				var uniConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
					.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				uniConv.charset = "utf8";
				data = uniConv.ConvertToUnicode(data);
			}
			catch(e) {
				alert("Unable to converting in UTF-8:\n\n" + data.match(/([^\n\r]*[\n\r]+){0,6}[^\n\r]*/)[0] + "\n\nError:\n\n" + e);
				return null;
			}
			return data;
		}

		fp.init(window, custombbCommon.getLocalised("openPrefsFile"), fp.modeOpen);
		fp.defaultExtension = "txt";
		fp.appendFilters(fp.filterText);

		if(fp.show() != fp.returnCancel) {
			var input;
			stream.init(fp.file, 0x01, 0444, null);
			streamIO.init(stream);
			input = streamIO.read(stream.available());
			streamIO.close();
			stream.close();
			var linebreak = input.match(/([\n\r]+)/m)[1];
			//alert(linebreak.replace(/\n/g, "\\n").replace(/\r/g, "\\r")); // Unix => \n, Mac => \r, Win => \n, \r\n
			input = conv(input).replace(/\s+$/, "");

			return input.split(linebreak);
		}
		return null;
	},

	getRow: function(popup) {
		var pn = popup.triggerNode || document.popupNode; // https://bugzilla.mozilla.org/show_bug.cgi?id=383930
		var tb = pn.parentNode.parentNode;
		if(tb.tagName != "textbox")
			return null;
		return tb.parentNode;
	},
	HLRow: function(popup) {
		var row = this.getRow(popup);
		if(row)
			return row.className = "custombb-selected-row"; // <row> highlight
		return false; // hide popup
	},
	clearHL: function(popup) {
		var row = this.getRow(popup);
		if(row)
			row.className = "";
	},

	setKeyTextbox: function(mi) {
		var val = mi.value;
		var tb = document.popupNode // html:input
			.parentNode.parentNode; // textbox

		if(val.match(/^VK_/)) {
			tb.removeAttribute("maxlength");
			tb.setAttribute("readonly", "true");
		}
		else {
			tb.setAttribute("maxlength", 1);
			tb.removeAttribute("readonly");

			var tbv = tb.value;
			if(tbv.length == 1)
				val = tbv;

			tb.focus();
			tb.select();
		}
		tb.value = val;
	},

	fillInVKtooltip: function(lbl) {
		var val = document.tooltipNode.value;
		if(!val)
			return false; // hide popup

		lbl.value = val;
		return true;
	},

	disableRow: function(cb) {
		var rw = cb.parentNode;
		var dis = !cb.checked;

		var chlds = rw.getElementsByTagName("*");
		for(var i = 1; i < chlds.length; i++)
			chlds[i].disabled = dis;
	},

	addList: function(ml) {
		if(!ml.hasChildNodes())
			ml.appendChild(document.getElementById("custombb-VKpopup"));
	},

	initCheckBoxes: function() {
		for(var i = 1; i <= 2; i++)
			this.disableSubCheckbox(document.getElementById("custombb-options-parentCBox" + i));
	},

	disableSubCheckbox: function(cb) {
		cb.nextSibling.disabled = !cb.checked;
	},

	help: function() {
		var w = 560;
		var h = 400;
		var x = screen.width/2 - w/2;
		var y = screen.height/2 - h/2;
		var pos = "width=" + w + ", height=" + h + ", left=" + x + ", top=" + y;
		window.open("chrome://custombb/locale/help.htm", "", "chrome, scrollbars, resizable, " + pos);
	}
};