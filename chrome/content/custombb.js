var custombb = {

	initContextMenu: function() {
		var menu = document.getElementById("contentAreaContextMenu");
		menu.addEventListener("popupshowing", custombb.showHide, false);
	},

	getProfileDir: function() {		// Browser load => set profile directory in pref
			// thanks to Edit Config Files
		var service = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
		var profileDir = "file:///" + service.get("ProfD", Components.interfaces.nsIFile).path.replace(/\\/g, "/");
		nsPreferences.setUnicharPref("custombb.profileDir", profileDir);
	},

	getHiddenStatus: function() {
		var sites = nsPreferences.copyUnicharPref("custombb.constrain.sites", ".");
		var currentHost = document.getElementById("content").currentURI.spec;	//host;

		return !currentHost.match(new RegExp(sites, "i"));
	},

	showHide: function() {
		document.getElementById("custombb-popup").hidden = document.getElementById("context-undo").hidden || custombb.getHiddenStatus();
	},

	addTbxMouseover: function() {
		if( nsPreferences.getBoolPref("custombb.toolbarAutoShow", false) ) {
			document.getElementById("custombb").setAttribute("custombbautoshow", "always");		// See custombb.css
			if( !nsPreferences.getBoolPref("custombb.toolbarAutoShowAlways", false) ) {
				var ntbx = document.getElementById("navigator-toolbox");
				ntbx.addEventListener(
					"mouseover",
					function() {
						var cbb = document.getElementById("custombb");
						var st = custombb.getHiddenStatus()
							? "auto"
							: "always";

						cbb.setAttribute("custombbautoshow", st);


						// document.getElementById("custombb").collapsed = custombb.getHiddenStatus();
					},
					false
				);
			}
		}
	},

	showWarning: function(ttl, txt) {
		var ico = "chrome://custombb-icon/skin/icon.png";
		ttl = "CustomBB: " + ttl;
		var alerts = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
		alerts.showAlertNotification(ico, ttl, txt, false, null, null);
	},

	showToolbar: function() {
		var cbb = document.getElementById("custombb");
		cbb.collapsed = !cbb.collapsed;
	},

	fillTooltip: function() {
		var L1 = document.tooltipNode.getAttribute("line1");
		var L2 = document.tooltipNode.getAttribute("line2");

		var i1 = document.getElementById("custombb-tooltip-line1");
		var i2 = document.getElementById("custombb-tooltip-line2");

		i1.value = L1;
		i1.hidden = !L1;

		i2.value = L2;
		i2.hidden = !L2;

		var noL = !L1 && !L2;

		document.getElementById("custombb-tooltip-separator").hidden = noL;

			// Additional tooltips:
		var hideAll = !nsPreferences.getBoolPref("custombb.showAllTooltips", true) || document.tooltipNode.getAttribute("id").match(/settings$/);
		document.getElementById("custombb-tooltip-help").hidden = hideAll;
		if(!hideAll) {
			var menuitem = document.tooltipNode.tagName == "menuitem";
			var custom = document.tooltipNode.getAttribute("id").match(/(button|popup)-custom-\d$/);

			document.getElementById("custombb-tooltip-line3").hidden = menuitem || custom;
			document.getElementById("custombb-tooltip-line4").hidden = !menuitem && !custom;
			document.getElementById("custombb-tooltip-line5").hidden = !menuitem || custom;
			document.getElementById("custombb-tooltip-line6").hidden = !menuitem || custom;
		}
		if(noL && hideAll)
			return false;

		return true;
	},

	insert: function(what, extra) {
		var strbundle = document.getElementById("custombb-strings");	// Get strings from locale
		var warn=strbundle.getString("warning");

		var ta = document.commandDispatcher.focusedElement;
		var strSelection = "";
		var strClipboard = readFromClipboard();		// See chrome://browser/content/browser.js
		if(!strClipboard)
			strClipboard = "";

		var qPast = false;

		if(ta) {		// Item is selected
			try {		// Textarea?
				var startPos = ta.selectionStart;
				var endPos = ta.selectionEnd;
				var oPosition = ta.scrollTop;
				var oHeight = ta.scrollHeight;
				strSelection = ta.value.substring(startPos, endPos);

				if( ta.tagName.match(/^select$/i) )		// Bug?..
					qPast = true;
			}
			catch(e) {	// Other item
				qPast = true;
			}
		}
		else
			qPast = true;

		if(qPast) {
			var tas = content.document.getElementsByTagName("textarea");
			var tal = tas.length;
			if(tal == 0) {
				this.showWarning(warn, strbundle.getString("textareasNotFound"));
				return;
			}
			var ta = tas[tal - 1];					// last textarea
			strSelection = "" + content.window.getSelection();	// strSelection = content.window.getSelection(); => bug (...match is not a function)
		}

		var strUsed = strSelection ? strSelection : strClipboard;

		var err=strbundle.getString("error");
		var clipEmpty=strbundle.getString("clipboardEmpty");

		var constrainLinks = nsPreferences.getBoolPref("custombb.constrain.links", true);
		var selectOutput = nsPreferences.getBoolPref("custombb.selectOutput", false);

		var subst = null;
		switch(what) {

		case "bold":
		case "italic":
		case "underline":
		case "strike":
			what = what.charAt(0);

		case "code":
		case "quote":
			subst = "[" + what + "]" + strUsed + "[/" + what + "]";
		break;

		case "img":
			var urlImgMask = new RegExp(nsPreferences.copyUnicharPref("custombb.urlImgMask", "^(ht|f)tps?:\/\/[^\s]+\.(jp(e?g|2)|png|gif|w?bmp|tiff?|ico)$"), "i");

			var errImgSel=strbundle.getString("errorImgSelected");
			var errImgClip=strbundle.getString("errorImgClipboard");

			if(strSelection) {
				if(strSelection.match(urlImgMask))
					subst = "[img]" + strSelection + "[/img]";
				else {

					if(!constrainLinks)
						subst = "[img]" + strSelection + "[/img]";

					this.showWarning(err, errImgSel);
				}
			}
			else
				if(strClipboard.match(urlImgMask))
					subst = "[img]" + strClipboard + "[/img]";
				else {
					subst = "[img][/img]";
						if(strClipboard) {

							if(!constrainLinks)
								subst = "[img]" + strClipboard + "[/img]";

							this.showWarning(warn, errImgClip);
						}
						else
							this.showWarning(warn, clipEmpty);
				}
		break;

		case "inv_commas":
			if( nsPreferences.getBoolPref("custombb.invCommasUseClipboard", false) )
				subst = "«" + strUsed + "»";
			else {
				var commaStatus = nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "");
				var comma;
				if( !commaStatus.match(/\[commas:open\]/) ) {
					comma = "«";
					nsPreferences.setUnicharPref("custombb.tempReplaceCache", commaStatus + "[commas:open]");
				}
				else {
					comma = "»";
					nsPreferences.setUnicharPref("custombb.tempReplaceCache", commaStatus.replace(/\[commas:open\]/, "") );
				}
				subst = strSelection == "" ? comma : "«" + strSelection + "»";
			}
		break;

		case "symbol":
			var symbolSrc = nsPreferences.copyUnicharPref("custombb.symbols", "");

			var symbols = {
				1	: custombbCommon.cutPref(symbolSrc, "symbol", 1),
				2	: custombbCommon.cutPref(symbolSrc, "symbol", 2),
				3	: custombbCommon.cutPref(symbolSrc, "symbol", 3),
				4	: custombbCommon.cutPref(symbolSrc, "symbol", 4),
				5	: custombbCommon.cutPref(symbolSrc, "symbol", 5),
				6	: custombbCommon.cutPref(symbolSrc, "symbol", 6),
				7	: custombbCommon.cutPref(symbolSrc, "symbol", 7),
				8	: custombbCommon.cutPref(symbolSrc, "symbol", 8),
				9	: custombbCommon.cutPref(symbolSrc, "symbol", 9),
				10	: custombbCommon.cutPref(symbolSrc, "symbol", 10)
			};
			var symbol = symbols[extra];
			if(symbol)
				subst = symbol;
			else
				alert("Symbol not defined: " + extra);
		break;

		case "url":
			var urlMask = new RegExp(nsPreferences.copyUnicharPref("custombb.urlMask", "^(ht|f)tps?:\/\/[^\s\\]+$"), "i");

			var errUrlSelClip=strbundle.getString("errorUrlSelectedAndClipboard");
			var errUrlClip=strbundle.getString("errorUrlClipboard");

			if(strSelection) {
				if(strSelection.match(urlMask))
					subst = "[url]" + strSelection + "[/url]";
				else
					if(strClipboard.match(urlMask))
						subst = "[url=" + strClipboard + "]" + strSelection + "[/url]";
					else {
						if(!constrainLinks)
							subst = "[url]" + strSelection + "[/url]";

						this.showWarning(err, errUrlSelClip);
					}
			}
			else
				if(strClipboard.match(urlMask))
					subst = "[url]" + strClipboard + "[/url]";
				else {
					subst = "[url][/url]";
						if(strClipboard) {
							if(!constrainLinks)
								subst = "[url]" + strClipboard + "[/url]";

							this.showWarning(warn, errUrlClip);
						}
						else
							this.showWarning(warn, clipEmpty);
				}
		break;

		case "color":
			var colorSrc = nsPreferences.copyUnicharPref("custombb.colors", "");

			var colors = {
				1	: custombbCommon.cutPref(colorSrc, "color", 1),
				2	: custombbCommon.cutPref(colorSrc, "color", 2),
				3	: custombbCommon.cutPref(colorSrc, "color", 3),
				4	: custombbCommon.cutPref(colorSrc, "color", 4),
				5	: custombbCommon.cutPref(colorSrc, "color", 5),
				6	: custombbCommon.cutPref(colorSrc, "color", 6),
				7	: custombbCommon.cutPref(colorSrc, "color", 7),
				8	: custombbCommon.cutPref(colorSrc, "color", 8),
				9	: custombbCommon.cutPref(colorSrc, "color", 9),
				10	: custombbCommon.cutPref(colorSrc, "color", 10),
				11	: custombbCommon.cutPref(colorSrc, "color", 11),
				12	: custombbCommon.cutPref(colorSrc, "color", 12),
				13	: custombbCommon.cutPref(colorSrc, "color", 13),
				14	: custombbCommon.cutPref(colorSrc, "color", 14),
				15	: custombbCommon.cutPref(colorSrc, "color", 15)
			};
			var color = colors[extra];
			if(color)
				subst = "[color=" + color + "]" + strUsed + "[/color]";
			else
				alert("Color not defined: " + extra);

		break;

		case "size":
			var sizeSrc = nsPreferences.copyUnicharPref("custombb.sizes", "");

			var sizes = {
				1	: custombbCommon.cutPref(sizeSrc, "size", 1),
				2	: custombbCommon.cutPref(sizeSrc, "size", 2),
				3	: custombbCommon.cutPref(sizeSrc, "size", 3),
				4	: custombbCommon.cutPref(sizeSrc, "size", 4),
				5	: custombbCommon.cutPref(sizeSrc, "size", 5),
				6	: custombbCommon.cutPref(sizeSrc, "size", 6),
				7	: custombbCommon.cutPref(sizeSrc, "size", 7),
				8	: custombbCommon.cutPref(sizeSrc, "size", 8),
				9	: custombbCommon.cutPref(sizeSrc, "size", 9),
				10	: custombbCommon.cutPref(sizeSrc, "size", 10)
			};
			var size = sizes[extra];
			if(size)
				subst = "[size=" + size + "]" + strUsed + "[/size]";
			else
				alert("Size not defined: " + extra);
		break;

		case "font":
			var fontSrc = nsPreferences.copyUnicharPref("custombb.fonts", "");

			var fonts = {
				1	: custombbCommon.cutPref(fontSrc, "font", 1),
				2	: custombbCommon.cutPref(fontSrc, "font", 2),
				3	: custombbCommon.cutPref(fontSrc, "font", 3),
				4	: custombbCommon.cutPref(fontSrc, "font", 4),
				5	: custombbCommon.cutPref(fontSrc, "font", 5),
				6	: custombbCommon.cutPref(fontSrc, "font", 6),
				7	: custombbCommon.cutPref(fontSrc, "font", 7),
				8	: custombbCommon.cutPref(fontSrc, "font", 8),
				9	: custombbCommon.cutPref(fontSrc, "font", 9),
				10	: custombbCommon.cutPref(fontSrc, "font", 10)
			};
			var font = fonts[extra];
			if(font)
				subst = "[font=" + font + "]" + strUsed + "[/font]";
			else
				alert("Font not defined: " + extra);
		break;

		case "list":
			subst = nsPreferences.getBoolPref("custombb.listAsterisk", true)
				? strUsed.replace(/^\*\s*/mg, "[*]")
				: strUsed.replace(/^\s*/mg, "[*]").replace(/(\[\*\]){2}/mg, "[*]");
			subst = "[list]" + subst + "[/list]";
		break;

		case "smile-code":
			var smile_code = {
				1	: nsPreferences.copyUnicharPref("custombb.smile.code.1.ins", ""),
				2	: nsPreferences.copyUnicharPref("custombb.smile.code.2.ins", ""),
				3	: nsPreferences.copyUnicharPref("custombb.smile.code.3.ins", ""),
				4	: nsPreferences.copyUnicharPref("custombb.smile.code.4.ins", ""),
				5	: nsPreferences.copyUnicharPref("custombb.smile.code.5.ins", ""),
				6	: nsPreferences.copyUnicharPref("custombb.smile.code.6.ins", ""),
				7	: nsPreferences.copyUnicharPref("custombb.smile.code.7.ins", ""),
				8	: nsPreferences.copyUnicharPref("custombb.smile.code.8.ins", ""),
				9	: nsPreferences.copyUnicharPref("custombb.smile.code.9.ins", ""),
				10	: nsPreferences.copyUnicharPref("custombb.smile.code.10.ins", ""),
				11	: nsPreferences.copyUnicharPref("custombb.smile.code.11.ins", ""),
				12	: nsPreferences.copyUnicharPref("custombb.smile.code.12.ins", ""),
				13	: nsPreferences.copyUnicharPref("custombb.smile.code.13.ins", ""),
				14	: nsPreferences.copyUnicharPref("custombb.smile.code.14.ins", ""),
				15	: nsPreferences.copyUnicharPref("custombb.smile.code.15.ins", ""),
				16	: nsPreferences.copyUnicharPref("custombb.smile.code.16.ins", ""),
				17	: nsPreferences.copyUnicharPref("custombb.smile.code.17.ins", ""),
				18	: nsPreferences.copyUnicharPref("custombb.smile.code.18.ins", ""),
				19	: nsPreferences.copyUnicharPref("custombb.smile.code.19.ins", ""),
				20	: nsPreferences.copyUnicharPref("custombb.smile.code.20.ins", "")
			};
			var code = smile_code[extra];
			if(code)
				subst = " " + code + " ";
			else
				alert("Smile not defined: " + extra);
		break;

		case "smile-url":
			var smile_url_code = {
				1	: nsPreferences.copyUnicharPref("custombb.smile.url.1.ins", ""),
				2	: nsPreferences.copyUnicharPref("custombb.smile.url.2.ins", ""),
				3	: nsPreferences.copyUnicharPref("custombb.smile.url.3.ins", ""),
				4	: nsPreferences.copyUnicharPref("custombb.smile.url.4.ins", ""),
				5	: nsPreferences.copyUnicharPref("custombb.smile.url.5.ins", ""),
				6	: nsPreferences.copyUnicharPref("custombb.smile.url.6.ins", ""),
				7	: nsPreferences.copyUnicharPref("custombb.smile.url.7.ins", ""),
				8	: nsPreferences.copyUnicharPref("custombb.smile.url.8.ins", ""),
				9	: nsPreferences.copyUnicharPref("custombb.smile.url.9.ins", ""),
				10	: nsPreferences.copyUnicharPref("custombb.smile.url.10.ins", ""),
				11	: nsPreferences.copyUnicharPref("custombb.smile.url.11.ins", ""),
				12	: nsPreferences.copyUnicharPref("custombb.smile.url.12.ins", ""),
				13	: nsPreferences.copyUnicharPref("custombb.smile.url.13.ins", ""),
				14	: nsPreferences.copyUnicharPref("custombb.smile.url.14.ins", ""),
				15	: nsPreferences.copyUnicharPref("custombb.smile.url.15.ins", ""),
				16	: nsPreferences.copyUnicharPref("custombb.smile.url.16.ins", ""),
				17	: nsPreferences.copyUnicharPref("custombb.smile.url.17.ins", ""),
				18	: nsPreferences.copyUnicharPref("custombb.smile.url.18.ins", ""),
				19	: nsPreferences.copyUnicharPref("custombb.smile.url.19.ins", ""),
				20	: nsPreferences.copyUnicharPref("custombb.smile.url.20.ins", "")
			};
			var code = smile_url_code[extra];
			if(code)
				subst = "[img]" + code + "[/img]";
			else
				alert("Smile not defined: " + extra);
		break;

		case "style":

			var errStyleRepl=strbundle.getString("errorStyleReplace");
			var and=strbundle.getString("and");
			var codeBreak=strbundle.getString("codeBreak") + "!";

			var constrainStyleDash = nsPreferences.getBoolPref("custombb.constrain.style.dash", true);
			var constrainStyleDashPlus = nsPreferences.getBoolPref("custombb.constrain.style.dashPlus", false);
			var constrainStyleCommas = nsPreferences.getBoolPref("custombb.constrain.style.commas", true);
			var constrainStyleSymbols = nsPreferences.getBoolPref("custombb.constrain.style.symbols", true);
			var constrainStylePunctMarks = nsPreferences.getBoolPref("custombb.constrain.style.punktMarks", false);

			subst = strUsed;

			if(subst.match(/\[code\].+\[\/code\]/i)) {
				alert(codeBreak);
				break;
			}

			if(constrainStyleDash) {
				subst = subst.replace(/-_-/g, "<$smile1$>")
					.replace(/^ *--? */mg, "– ")
					.replace(/ *- *\n/g, "")
					.replace(/ *-- */g, " – ")
					.replace(/ +- +/g, " – ")

					.replace(/\. *- */g, ". – ")
					.replace(/! *- */g, "! – ")
					.replace(/\? *- */g, "? – ")
					.replace(/, *- */g, ", – ");

				if(constrainStyleDashPlus)
					subst = subst.replace(/ +-/g, " – ")
						.replace(/- +/g, " – ");
			}

			if(constrainStyleCommas)
				subst = subst.replace(/^ *" */mg, "«")
					.replace(/\( *" */g, "(«")
					.replace(/\[ *" */g, "[«")
					.replace(/\{ *" */g, "{«")
					.replace(/< *" */g, "<«")
					.replace(/ +" */g, " «")

					.replace(/" *$/mg, "»")
					.replace(/" *\)/g, "»)")
					.replace(/" *\]/g, "»]")
					.replace(/" *\}/g, "»}")
					.replace(/" *>/g, "»>")
					.replace(/" *\./g, "».")
					.replace(/\." */g, ".» ")
					.replace(/" *,/g, "»,")
					.replace(/" *!/g, "»!")
					.replace(/!" */g, "!» ")
					.replace(/" *\?/g, "»?")
					.replace(/\?" */g, "?» ")
					.replace(/" *;/g, "»;")
					.replace(/" *:/g, "»:")
					.replace(/" +/g, "» ");

			if(constrainStyleSymbols)
				subst = subst.replace(/\([сСcC]\)/g, "©")
					.replace(/\([rRрР]\)/g, "®")
					.replace(/\([tTтТ][mMмМ]\)/g, "™");

			if(constrainStylePunctMarks) {

				for(var i = 0; i < subst.length - 3; i++)
					if(subst.substring(i, i + 3).match(/\d[\.,:]\d/)) {
						var point = "";
						switch(subst.charAt(i+1)) {
							case '.': point = "point"; break;
							case ',': point = "comma"; break;
							case ':': point = "colon"; break;
						}
						subst = subst.substring(0, i+1) + "<$" + point + "$>" + subst.substring(i+2, subst.length);
					}

				if(!subst.match(/\[\/?(img|url)(\]|=)|(ht|f)tps?:\/\/[0-9a-z]|www\d?\.|(^|\s)[-\w]+\.[a-z]{2,4}(\s|$)/i)) {	// don't edit URL and filenames
					if(!subst.match(/[^\d\.][0-3]?\d\.[01]?\d\.(19|20)?\d\d[^\d\.]/i))					// don't edit date
						subst = subst.replace(/ *\. */g, ". ");

					subst = subst.replace(/ *! */g, "! ").replace(/ *\? */g, "? ");
					if(!subst.match(/:([a-z0-9]{2,12}:|[\(\)oDP])/i))		// don't edit codes of smiles
						subst = subst.replace(/ *: */g, ": ");
				}

				subst = subst.replace(/ *, */g, ", ")

					.replace(/;\)/g, "<$smile2$>")	// don't edit ";)"
					.replace(/ *; */g, "; ")
					.replace(/<\$smile2\$>/g, ";)")

					.replace(/ {2,}/g, " ")
					.replace(/^ +| +$/mg, "")

					.replace(/ !/g, "!")		// delete replace bugs (for "...", "!!!", "?.." etc)
					.replace(/ \?/g, "?")
					.replace(/ \./g, ".")
					.replace(/\. \)/g, ".)")

					.replace(/<\$point\$>/g, ".")
					.replace(/<\$comma\$>/g, ",")
					.replace(/<\$colon\$>/g, ":");

				if(constrainStyleCommas)
					subst = subst.replace(/\. »/g, ".»")
						.replace(/! »/g, "!»")
						.replace(/\? »/g, "?»");
			}

			if(constrainStyleCommas) {
				subst = subst.replace(/ «\) */g, "») ")
					.replace(/ «\] */g, "»] ")
					.replace(/ «\} */g, "»} ")
					.replace(/ «\> */g, "»> ")
					.replace(/ «\./g, "».")
					.replace(/ «,/g, "»,")
					.replace(/ «!/g, "»!")
					.replace(/ «\?/g, "»?")
					.replace(/ «:/g, "»:")
					.replace(/ «;/g, "»;");
			}

			var numDashs1 = 0;
			var numDashs2 = 0;
			var numCommas = 0;

			for(var i = 0; i < subst.length-1; i++) {
				if(subst.charAt(i) + subst.charAt(i+1) == " -")
					numDashs1++;
				if(subst.charAt(i) + subst.charAt(i+1) == "- ")
					numDashs2++;
				if(subst.charAt(i) == "\"")
					numCommas++;
			}

			if(constrainStyleDash && !constrainStyleCommas)
				if(numDashs1 != 0 || numDashs2 != 0)
					this.showWarning(err, numDashs1 + " [ -] "  + and + " " + numDashs2 + " [- ] " + errStyleRepl);

			if(!constrainStyleDash && constrainStyleCommas)
				if(numCommas != 0)
					this.showWarning(err, numCommas + " [\"] " + errStyleRepl);

			if(constrainStyleDash && constrainStyleCommas)
				if(numDashs1 != 0 || numDashs2 != 0 || numCommas != 0)
					this.showWarning(err, numDashs1 + " [ -], " +
							      numDashs2 + " [- ] " + and + " " +
							      numCommas + " [\"] " + errStyleRepl);

			subst = subst.replace(/<\$smile1\$>/g, "-_-");

		break;

		case "custom":
			var customs = {
				"1"	: nsPreferences.copyUnicharPref("custombb.custom.1", ""),
				"2"	: nsPreferences.copyUnicharPref("custombb.custom.2", ""),
				"3"	: nsPreferences.copyUnicharPref("custombb.custom.3", ""),
				"4"	: nsPreferences.copyUnicharPref("custombb.custom.4", ""),
				"5"	: nsPreferences.copyUnicharPref("custombb.custom.5", ""),
				"6"	: nsPreferences.copyUnicharPref("custombb.custom.6", ""),
				"7"	: nsPreferences.copyUnicharPref("custombb.custom.7", ""),
				"8"	: nsPreferences.copyUnicharPref("custombb.custom.8", ""),
				"9"	: nsPreferences.copyUnicharPref("custombb.custom.9", ""),
				"10"	: nsPreferences.copyUnicharPref("custombb.custom.10", ""),
				"11"	: nsPreferences.copyUnicharPref("custombb.custom.11", ""),
				"12"	: nsPreferences.copyUnicharPref("custombb.custom.12", ""),
				"13"	: nsPreferences.copyUnicharPref("custombb.custom.13", ""),
				"14"	: nsPreferences.copyUnicharPref("custombb.custom.14", ""),
				"15"	: nsPreferences.copyUnicharPref("custombb.custom.15", ""),

				"b1"	: nsPreferences.copyUnicharPref("custombb.custom.b1", ""),
				"b2"	: nsPreferences.copyUnicharPref("custombb.custom.b2", ""),
				"b3"	: nsPreferences.copyUnicharPref("custombb.custom.b3", ""),
				"b4"	: nsPreferences.copyUnicharPref("custombb.custom.b4", ""),
				"b5"	: nsPreferences.copyUnicharPref("custombb.custom.b5", "")
			};
			var custom = customs[extra];			// ([^\}]?(opentag|closetag|label)=\{.*$|$)
			if(custom) {		// pref = "openTag={[sup]} closeTag={[/sup]} label={Sup}"
				var openTag = custom.match(/opentag=\{.*\}/i)   ? custom.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "") : "";
				var closeTag = custom.match(/closetag=\{.*\}/i) ? custom.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "") : "";

				if(!openTag)		// For signatures
					strUsed = strSelection;

					// Get user's text:
				// Example: openTag = [multitag attr1="%Attr 1:%" attr2="%Attr 2:%"]
				// prompt("Attr 1:") => "text 1"
				// prompt("Attr 2:") => "text 2"
				// [multitag attr1="text 1" attr2="text 2"]
				var getUserText = function(str) {
					while( str.match(/%[^%]*%/) ) {
						var userText = str.replace(/^[^%]*%/, "").replace(/%.*$/, "");	// [quote=%Autor%] => Autor
						var title="CustomBB: " + strbundle.getString("customTagInquiryTitle");
						userText = prompt(userText, userText.replace(/:?$/, ""), title);
						str = str.replace(/%[^%]*%/, userText);
					}
					return str;
				}
				openTag = getUserText(openTag);
				closeTag = getUserText(closeTag);

				closeTag = closeTag.replace(/\\n/g, "\n");	// Line feed

					// Multiplication: "+{3}" => "+++"
				if( !closeTag.replace(/\{\d{1,2}\}/g, "").match(/\{|\}/) )
					while(closeTag.match(/\{\d{1,2}\}/)) {		// if without .substring(0, 2) then incorrect num defined:
						var num = closeTag.replace(/^[^\{]*\{/, "").substring(0, 2).replace(/\}.*$/, "");
						if( !num.match(/^\d{1,2}$/) ) {		// invalid num?
							alert("Unknown error of closeTag multiplication:\nnum = [" + num + "]\ncloseTag = [" + closeTag + "]");
							return;
						}
						var ind = closeTag.indexOf("{" + num + "}");
						var targetChar = closeTag.charAt(ind - 1);
						var charXnum = "";

						for(var i = 1; i <= num; i++)
							charXnum += targetChar;

						closeTag = closeTag.substring(0, ind - 1) + charXnum + closeTag.substring(ind, closeTag.length);
						closeTag = closeTag.replace( RegExp("\\{" + num + "\\}"), "" );
					}

				subst = openTag + strUsed + closeTag;

				if(extra.charAt(0) == "b")
					this.initCustomItems("button");
			}
			else
				alert("Custom tag not defined: " + extra);
		break;

		default:
			alert("Command not defined: " + what);
		}

		if(!subst)
			return;

		var tagsOnly = subst.match(/^\[[a-z]+(=["']?#?[a-z0-9]+["']?)?\](\[\*\])?\[\/[a-z]+\]$/i) || subst.match(/^(«»|[«»]| ?[-–—] )$/);

		if(qPast) {
			if(!tagsOnly)
				subst += "\n";

			ta.value += subst;

			ta.focus();
			try {		// escape console errors
				ta.scrollTop = ta.scrollHeight;			// scroll
			}
			catch(e) {
			}
		}
		else {
			ta.value = ta.value.substring(0, startPos) + subst + ta.value.substring(endPos, ta.value.length);
			var nHeight = ta.scrollHeight - oHeight;
			ta.scrollTop = oPosition + nHeight;
			ta.selectionEnd = startPos + subst.length;
		}

		if(tagsOnly) {
			if( subst.match(/^(«»|[«»]| ?[-–—] )$/) ) {
				if(subst == "«»")						// Move cursor, if "«»"
					ta.selectionEnd--;
			}
			else
				ta.selectionEnd += -subst.replace(/^\[[^\[\]]+\](\[\*\])?/i, "").length;
		}
		else
			if(selectOutput)							// Select inserted text
				ta.selectionStart = ta.selectionEnd - subst.length;
	},

	initKeys: function() {
			// thanks to AutoCopy
		var keyName = new Array(13);
		  keyName[0] = "show_toolbar";
		  keyName[1] = "code";
		  keyName[2] = "url";
		  keyName[3] = "bold";
		  keyName[4] = "italic";
		  keyName[5] = "underline";
		  keyName[6] = "quote";
		  keyName[7] = "inv_commas";
		  keyName[8] = "list";
		  keyName[9] = "img";
		  keyName[10] = "style";
		  keyName[11] = "color";
		  keyName[12] = "symbol";

		var keyPref = "";	// keyPref = "enable=true control alt shift key=A" -> Ctrl+Alt+Shift+A
		var keyId = "";

		for(var i = 0; i <= 25; i++) {		// "for" begin

			if(i <= 12) {
				keyPref = nsPreferences.copyUnicharPref("custombb.key." + keyName[i] + ".locale", "");
				keyId = "custombb-key-" + keyName[i] + "-locale";
			}
			else {
				keyPref = nsPreferences.copyUnicharPref("custombb.key." + keyName[i - 13] + ".main", "");
				keyId = "custombb-key-" + keyName[i - 13] + "-main";
			}

			if(keyPref.match(/enable=true/i) && keyPref.match(/key=\{(.|vk_\w+)\}/i)) {

				var keyIt = document.getElementById(keyId);

				if(keyIt) {

					keyIt.setAttribute("disabled", false);
					var keyModifiers = "";

					if(keyPref.match(/control|ctrl/i))
						keyModifiers = "control";
					if(keyPref.match(/alt/i))
						keyModifiers += ",alt";
					if(keyPref.match(/shift/i))
						keyModifiers += ",shift";
					if(keyPref.match(/accel/i))		// Add settings for this!!!
						keyModifiers += ",accel";
					if(keyPref.match(/meta/i))
						keyModifiers += ",meta";

					keyModifiers = keyModifiers.replace(/^,/, "");
					var keyVal = "";

					keyVal = keyPref.replace(/^.*key=\{/i, "").replace(/\}.*$/, "");
					var targetAttr = keyVal.match(/^vk_/i) ? "keycode" : "key";

					keyIt.setAttribute(targetAttr, keyVal);
					keyIt.setAttribute("modifiers", keyModifiers);

					if(i >= 14) {
						var keyTooltip = keyVal.replace(/^vk_/i, "");
						if(keyVal.match(/^vk_/i)) {
							var firstUpper = function(val) {
								val = val.substring(0, 1).toLocaleUpperCase() + val.substring(1, val.length).toLocaleLowerCase();
								return val;
							}
							if(!keyTooltip.match(/_/)) {
								keyTooltip = firstUpper(keyTooltip);
								keyTooltip = keyTooltip != "Back" ? keyTooltip : "Backspace";
							}
							else
								keyTooltip = firstUpper(keyTooltip.replace(/_.*$/, "")) + " " + firstUpper(keyTooltip.replace(/^.*_/, ""));

						}
						else
							keyTooltip = keyTooltip.toLocaleUpperCase();

						keyTooltip = " " + keyModifiers.replace(/a/, "A").replace(/s/, "S").replace(/control/, "Ctrl").replace(/,/g, "+") + "+" + keyTooltip;
					}

					if(i >= 14 && i <= 23) {		// Set key2 value to tooltiptext
						var targetButton = document.getElementById("custombb-button-" + keyName[i - 13]);
						if(targetButton)
							targetButton.setAttribute("tooltiptext", targetButton.getAttribute("tooltiptext") + keyTooltip);
					}

					if(i >= 24) {
						var N = nsPreferences.copyUnicharPref("custombb.key." + keyName[i - 13], "");
						var label = i == 24
							? custombbCommon.cutPref( nsPreferences.copyUnicharPref("custombb.colors", ""), "label", N )
							: custombbCommon.cutPref( nsPreferences.copyUnicharPref("custombb.symbols", ""), "label", N );

						var cmd = "custombb.insert('" + keyName[i - 13] + "', '" + N + "')";
						keyIt.setAttribute("oncommand", cmd);
						document.getElementById(keyId.replace(/main/, "locale")).setAttribute("oncommand", cmd);

						document.getElementById("custombb-popup-cm-" + keyName[i - 13] + "-"  + N).setAttribute("key", keyId);

						try {
							document.getElementById("custombb-popup-tb-" + keyName[i - 13] + "-" + N).setAttribute("key", keyId);
							document.getElementById("custombb-button-" + keyName[i - 13]).setAttribute("line2", label + keyTooltip);
						}
						catch(e) {
						}
					}

				}
			}
		}	// "for" end
	},

	initSmiles: function(smile, loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache (user cannot use this pref)...

		for(var i = 1; i <= 20; i++) {
			var smileSrc = nsPreferences.copyUnicharPref("custombb.smile." + smile + "." + i + ".src", "");
			var smileIns = nsPreferences.copyUnicharPref("custombb.smile." + smile + "." + i + ".ins", "");
			var smileItem = document.getElementById("custombb-popup-" + loc + "-smile-" + smile + "-" + i);

			var hidden = smileSrc == "" || smileIns == "";
			smileItem.hidden = hidden;

			smileItem.setAttribute("class", "menuitem-iconic custombb-popup-smile");	// Clear swap border...
			smileItem.setAttribute("image", custombbCommon.testPatch(smileSrc));	// %profile% ?
			smileItem.setAttribute("line2", smileIns);
			smileItem.setAttribute("label", "");
		}
	},

	initSymbols: function(loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache...

		var symbolSrc = nsPreferences.copyUnicharPref("custombb.symbols", "symbol1={:(} label1={Pref read error!}");

		for(var N = 1; N <= 10; N++) {
			var symbolItem = document.getElementById("custombb-popup-" + loc + "-symbol-" + N);

			var symbol = custombbCommon.cutPref(symbolSrc, "symbol", N);
			var label = custombbCommon.cutPref(symbolSrc, "label", N);

			var hidden = symbol == "" || label == "";
			symbolItem.hidden = hidden;

			symbolItem.removeAttribute("class");	// Clear swap border...
			symbolItem.setAttribute("label", label);
			symbolItem.setAttribute("line2", symbol);
		}
	},

	initSizes: function(loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache...

		var sizeSrc = nsPreferences.copyUnicharPref("custombb.sizes", "size1={5} label1={Pref read error!}");

		for(var N = 1; N <= 10; N++) {
			var sizeItem = document.getElementById("custombb-popup-" + loc + "-size-" + N);

			var size = custombbCommon.cutPref(sizeSrc, "size", N);
			var label = custombbCommon.cutPref(sizeSrc, "label", N);
			var style = custombbCommon.cutPref(sizeSrc, "style", N);

			var hidden = label == "" || size == "";
			sizeItem.hidden = hidden;

			style = custombbCommon.repairSizeStyle(style);

			sizeItem.removeAttribute("class");	// Clear swap border...
			sizeItem.setAttribute("label", label);
			sizeItem.setAttribute("line2", size);
			sizeItem.setAttribute("style", style);
		}
	},

	initColors: function(loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache...

		var colorSrc = nsPreferences.copyUnicharPref("custombb.colors", "color1={red} label1={Pref read error!}");

		for(var N = 1; N <= 15; N++) {
			var colorItem = document.getElementById("custombb-popup-" + loc + "-color-" + N);

			var color = custombbCommon.cutPref(colorSrc, "color", N);
			colorItem.setAttribute("line2", color);
			color = custombbCommon.repairColor(color);

			var label = custombbCommon.cutPref(colorSrc, "label", N);
			var style = custombbCommon.cutPref(colorSrc, "style", N);

			var hidden = label == "" || color == "";
			colorItem.hidden = hidden;

			style = custombbCommon.repairColorStyle(color, style);

			colorItem.removeAttribute("class");	// Clear swap border...
			colorItem.setAttribute("style", style);
			colorItem.setAttribute("label", label);
		}
	},

	initFonts: function(loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache...

		var fontSrc = nsPreferences.copyUnicharPref("custombb.fonts", "font1={verdana} label1={Pref read error!}");

		for(var N = 1; N <= 10; N++) {
			var fontItem = document.getElementById("custombb-popup-" + loc + "-font-" + N);

			var font = custombbCommon.cutPref(fontSrc, "font", N);
			fontItem.setAttribute("line2", font);

			font = custombbCommon.repairFontStyle(font);	// get style
			var label = custombbCommon.cutPref(fontSrc, "label", N);

			var hidden = label == "" || font == "";
			fontItem.hidden = hidden;

			fontItem.removeAttribute("class");	// Clear swap border...

			fontItem.setAttribute("style", font);
			fontItem.setAttribute("label", label);
		}
	},

	initCustom: function(loc) {
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "");		// Clear replace cache...

		for(var i = 1; i <= 15; i++) {
			var customValue = nsPreferences.copyUnicharPref("custombb.custom." + i, "");
			var customSrc = nsPreferences.copyUnicharPref("custombb.custom." + i + ".src", "");
			var customLabel = customValue.match(/label=\{.*\}/i)       ? customValue.replace(/^.*label=\{/i, "").replace(/\}([^\}]?(opentag|closetag)=\{.*$|$)/i, "") : "";
			var customOpenTag = customValue.match(/opentag=\{.*\}/i)   ? customValue.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "") : "";
			var customCloseTag = customValue.match(/closetag=\{.*\}/i) ? customValue.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "") : "";
			var customItem = document.getElementById("custombb-popup-" + loc + "-custom-" + i);

			var hidden = (customLabel == "" && customSrc == "") || (customOpenTag == "" && customCloseTag == "");
			customItem.hidden = hidden;

			if(customSrc) {
				customItem.setAttribute("class", "menuitem-iconic");
				customItem.setAttribute("image", custombbCommon.testPatch(customSrc));
			}
			else {		//  Removing icon...
				customItem.removeAttribute("class");
				customItem.removeAttribute("image");
			}

			customItem.setAttribute("label", customLabel);

			if(customOpenTag)
				customOpenTag = customOpenTag + " + ";
			if(customCloseTag)
				customCloseTag = " + " + customCloseTag;

			var strbundle = document.getElementById("custombb-strings");	// Get strings from locale
			var text=strbundle.getString("customText");

			customItem.setAttribute("line2", customOpenTag + text + customCloseTag);
		}
	},

	openButtonsEditor: function(event, num, loc) {
		if(event.button == 0 && !event.ctrlKey && !event.shiftKey)	// Left click only => paste
			this.insert("custom", num);

		if( (event.button == 2 && !event.ctrlKey && !event.shiftKey) || (event.button == 1 && !event.ctrlKey && event.shiftKey) )
			window.openDialog("chrome://custombb/content/editor/custom.xul", "", "chrome,resizable,dependent,centerscreen", num, "custom");
	},

	openEditor: function(event, type, num, loc) {	// type: "smile-code" || "smile-url" || "custom" || "color" || "symbol"

		if(event.button == 0 && !event.ctrlKey && !event.shiftKey)				// Left click only => paste
			this.insert(type, num);

		if((event.button == 1 && !event.shiftKey && !event.ctrlKey) || (event.button == 2 && event.shiftKey && !event.ctrlKey))		// Middle click || Right+Shift => show all
			this.showAllItems(type, loc);

		if( (event.button == 2 && !event.ctrlKey && !event.shiftKey)
			|| (event.button == 1 && !event.ctrlKey && event.shiftKey) )	// Right click only || Middle+Shift => settings
			window.openDialog("chrome://custombb/content/editor/" + type.replace(/-.*$/, "") + ".xul", "", "chrome,resizable,dependent,centerscreen", num, type);

		if( (event.button == 1 || event.button == 2) && event.ctrlKey && !event.shiftKey ) {	// Right+Ctrl || Middle+Ctrl
			var replaceCache = nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "").replace(/\[ShowAll\]/, "");
			var id = "custombb-popup-" + loc + "-" + type + "-" + num;
			if(replaceCache == "") {
				nsPreferences.setUnicharPref("custombb.tempReplaceCache", nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "") + type + "|" + num);
				document.getElementById(id).setAttribute("class", document.getElementById(id).getAttribute("class") + " custombb-copy");
				var strbundle = document.getElementById("custombb-strings");		// Get strings from locale
				var copy = "[" + strbundle.getString("SettingsCopied") + "] ";
				document.getElementById(id).setAttribute("line2", copy + document.getElementById(id).getAttribute("line2"));
			}
			else {
				var srcType = replaceCache.replace(/\|.*$/, "");
				if (type == srcType) {		// This condition is not necessary at clearing the replace cache by init-functions...
					var srcNum = replaceCache.replace(/^.*\|/, "");
					var srcId = "custombb-popup-" + loc + "-" + srcType + "-" + srcNum;
					document.getElementById(srcId).setAttribute("class", document.getElementById(srcId).getAttribute("class").replace(/ ?custombb-copy$/, ""));
					document.getElementById(id).setAttribute("line2", document.getElementById(id).getAttribute("line2").replace(/^\[.*\] /, ""));
					this.swapPrefs(type, num, srcNum, loc);
				}
				replaceCache = nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "").match(/\[ShowAll\]/)
						? "[ShowAll]"
						: "";
				nsPreferences.setUnicharPref("custombb.tempReplaceCache", replaceCache);
			}
		}
	},

	showAllSubItems: function(event, type, loc) {
		if(event.button == 0 && event.shiftKey && !event.ctrlKey)	// Left+Shift => show all
			this.showAllItems(type, loc);
	},

	showAllMenuitems: function(event) {
		if(event.button == 0 && event.shiftKey && !event.ctrlKey)	// Left+Shift => show all
			for(var i = 1; i <= 5; i++)
				document.getElementById("custombb-popup-custom-" + i).hidden = false;
	},

	showAllItems: function(type, loc) {
		switch(type) {
			case "smile-code":
			case "smile-url":
				for(var i = 1; i <= 20; i++) {
					var id = "custombb-popup-" + loc + "-" + type + "-" + i;
					document.getElementById(id).hidden = false;
						// To increase height:
					document.getElementById(id).setAttribute("label", i + ".");
				}
			break;

			case "custom":
			case "color":
				for(var i = 1; i <= 15; i++) {
					var id = "custombb-popup-" + loc + "-" + type + "-" + i;
					document.getElementById(id).hidden = false;
					document.getElementById(id).setAttribute("label", i + ". "
						+ document.getElementById(id).getAttribute("label").replace(RegExp("^" + i + "\\. "), ""));
				}
			break;

			case "symbol":
			case "font":
			case "size":
				for(var i = 1; i <= 10; i++) {
					var id = "custombb-popup-" + loc + "-" + type + "-" + i;
					document.getElementById(id).hidden = false;
					document.getElementById(id).setAttribute("label", i + ". "
						+ document.getElementById(id).getAttribute("label").replace(RegExp("^" + i + "\\. "), ""));
				}
			break;
		}
			// Add [ShowAll] into replace cache (save current status)
		nsPreferences.setUnicharPref("custombb.tempReplaceCache", "[ShowAll]" + nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "").replace(/\[ShowAll\]/, ""));
	},

	swapPrefs: function(type, targetNum, srcNum, loc) {
		var showAll = nsPreferences.copyUnicharPref("custombb.tempReplaceCache", "").match(/\[ShowAll\]/);	// Get current status

		switch(type) {		// Replace...
			case "color":
			case "size":
				var pref = nsPreferences.copyUnicharPref("custombb." + type + "s", "");

				pref = pref.replace(RegExp(type + targetNum + "=\\{"), type + srcNum + "[*copy*]={");
				pref = pref.replace(RegExp("label" + targetNum + "=\\{"), "label" + srcNum + "[*copy*]={");
				pref = pref.replace(RegExp("style" + targetNum + "=\\{"), "style" + srcNum + "[*copy*]={");

				pref = pref.replace(RegExp(type + srcNum + "=\\{"), type + targetNum + "={");
				pref = pref.replace(RegExp("label" + srcNum + "=\\{"), "label" + targetNum + "={");
				pref = pref.replace(RegExp("style" + srcNum + "=\\{"), "style" + targetNum + "={");

				pref = pref.replace(/\[\*copy\*\]/g, "");

				nsPreferences.setUnicharPref("custombb." + type + "s", pref);
			break;

			case "font":
			case "symbol":
				var pref = nsPreferences.copyUnicharPref("custombb." + type + "s", "");

				pref = pref.replace(RegExp(type + targetNum + "=\\{"), type + srcNum + "[*copy*]={");
				pref = pref.replace(RegExp("label" + targetNum + "=\\{"), "label" + srcNum + "[*copy*]={");

				pref = pref.replace(RegExp(type + srcNum + "=\\{"), type + targetNum + "={");
				pref = pref.replace(RegExp("label" + srcNum + "=\\{"), "label" + targetNum + "={");

				pref = pref.replace(/\[\*copy\*\]/g, "");

				nsPreferences.setUnicharPref("custombb." + type + "s", pref);
			break;

			case "smile-code":
			case "smile-url":
				var srcId = "custombb." + type.replace(/-/, ".") + "." + srcNum + ".";
				var targetId = "custombb." + type.replace(/-/, ".") + "." + targetNum + ".";

				var srcPref = nsPreferences.copyUnicharPref(srcId + "ins", "");
				nsPreferences.setUnicharPref(srcId + "ins", nsPreferences.copyUnicharPref(targetId + "ins", ""));
				nsPreferences.setUnicharPref(targetId + "ins", srcPref);

				srcPref = nsPreferences.copyUnicharPref(srcId + "src", "");
				nsPreferences.setUnicharPref(srcId + "src", nsPreferences.copyUnicharPref(targetId + "src", ""));
				nsPreferences.setUnicharPref(targetId + "src", srcPref);
			break;

			case "custom":
				var srcId = "custombb.custom." + srcNum;
				var targetId = "custombb.custom." + targetNum;

				var srcPref = nsPreferences.copyUnicharPref(srcId, "");
				nsPreferences.setUnicharPref(srcId, nsPreferences.copyUnicharPref(targetId, ""));
				nsPreferences.setUnicharPref(targetId, srcPref);

				var srcPref = nsPreferences.copyUnicharPref(srcId + ".src", "");
				nsPreferences.setUnicharPref(srcId + ".src", nsPreferences.copyUnicharPref(targetId + ".src", ""));
				nsPreferences.setUnicharPref(targetId + ".src", srcPref);
			break;
		}
		switch(type) {		// Reload... (!Clearing current status of showing!)
			case "color":
				this.initColors(loc);
			break;
			case "size":
				this.initSizes(loc);
			break;
			case "font":
				this.initFonts(loc);
			break;
			case "symbol":
				this.initSymbols(loc);
			break;
			case "smile-code":
			case "smile-url":
				this.initSmiles(type.replace(/^smile-/, ""), loc);
			break;
			case "custom":
				this.initCustom(loc);
			break;
		}
		if(showAll)		// Restoring previous status...
			this.showAllItems(type, loc);
	},

	openSettings: function(event) {
		if(event.button == 0 && !event.ctrlKey && !event.shiftKey)		// Left click only => settings dialog
			window.openDialog("chrome://custombb/content/settings.xul", null, "chrome,resizable,dialog=no");	//centerscreen,resizable,dependent

		if(event.button == 1 || (event.button == 0 && event.ctrlKey))		// Middle click || Left+Ctrl => switch the inserting mode
			nsPreferences.setBoolPref("custombb.selectOutput", !nsPreferences.getBoolPref("custombb.selectOutput"));
	},

	openToolbarButton: function(currentToolbarButton) {
			// thanks to Web Developer
		// If the toolbar button is set and is not open
		if(currentToolbarButton && !currentToolbarButton.open) {
			var toolbarButton = null;
			var toolbarButtons = currentToolbarButton.parentNode.getElementsByTagName("toolbarbutton");
			var toolbarButtonsLength = toolbarButtons.length;

			// Loop through the toolbar buttons
			for(var i = 0; i < toolbarButtonsLength; i++) {
				toolbarButton = toolbarButtons.item(i);

				// If the toolbar button is set, is not the same toolbar button and is open
				if(toolbarButton && toolbarButton != currentToolbarButton && toolbarButton.open) {
					toolbarButton.open = false;
					currentToolbarButton.open = true;

					break;
				}
			}
		}
	},

	initCustomItems: function(item) {
		for(var i = 1; i <= 5; i++) {
			var customValue = nsPreferences.copyUnicharPref("custombb.custom.b" + i, "");
			var customSrc = nsPreferences.copyUnicharPref("custombb.custom.b" + i + ".src", "");
			var customLabel = customValue.match(/label=\{.*\}/i)       ? customValue.replace(/^.*label=\{/i, "").replace(/\}([^\}]?(opentag|closetag)=\{.*$|$)/i, "") : "";
			if(customLabel == "")
				customLabel = "CustomBB " + i;
			var customOpenTag = customValue.match(/opentag=\{.*\}/i)   ? customValue.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "") : "";
			var customCloseTag = customValue.match(/closetag=\{.*\}/i) ? customValue.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "") : "";
			var customItem = document.getElementById("custombb-" + item + "-custom-" + i);

			if(customItem) {

				if(item == "popup") {
					var hidden = (customLabel == "" && customSrc == "") || (customOpenTag == "" && customCloseTag == "");
					customItem.hidden = hidden;
				}

				if(customSrc)
					customItem.setAttribute("image", custombbCommon.testPatch(customSrc));
				else		//  Removing icon...
					customItem.removeAttribute("image");

				customItem.setAttribute("label", customLabel);

				if(customOpenTag)
					customOpenTag = customOpenTag + " + ";
				if(customCloseTag)
					customCloseTag = " + " + customCloseTag;

				var strbundle = document.getElementById("custombb-strings");	// Get strings from locale
				var text=strbundle.getString("customText");

				customItem.setAttribute("line2", customOpenTag + text + customCloseTag);

			}
		}
	}
};

window.addEventListener (
	"load",
	function() {
		custombb.initContextMenu();
		custombb.initKeys();
		custombb.getProfileDir();
		custombb.initCustomItems("button");
		custombb.addTbxMouseover();
	},
	false
);