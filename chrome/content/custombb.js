var custombb = {

	oldSelectedItem: null,
	showAllMain: null,
	showAll: null,
	commasIsOpen: null,
	keyCopy: {}, // Copy of current key number (keys changes only after restart)

	taVal: null,
	getTaValTimeout: null,
	taOldLine: null,
	taOldSelSt: null,

	init: function() {
		var c = custombb, d = document;

		window.removeEventListener("load", c.init, false);
		window.addEventListener("unload", c.destroy, false);

		c.contMenu.addEventListener("popupshowing", c.showHide, false);
		c.initKeys();
		c.initCustomItems("button");
		c.initAutoShow();

		d.getElementById("custombb").watch(
			"collapsed",
			function(propName, oldVal, newVal) {
				c.initToolbar(false);
				return newVal;
			}
		);
		c.initToolbar(true);

		window.addEventListener("click", c.testClick, true);

		var preL = nsPreferences.getIntPref("custombb.preloadTimeout", 2000);
		if(preL > 0) {
			setTimeout(function() {
				custombb.createAllMenuitems();
			}, preL);
		}

		if(d.getElementById("aios-tools-mitem-prefs")) { // watch not work...
			d.getElementById("toolbar-context-menu").addEventListener("popuphidden", c.initToolbar, false);
			d.getElementById("viewToolbarsMenu")    .addEventListener("popuphidden", c.initToolbar, false);
		}
	},

	destroy: function() {
		var c = custombb, d = document;

		window.removeEventListener("unload", c.destroy, false);

		c.contMenu.removeEventListener("popupshowing", c.showHide, false);
		d.getElementById("custombb").unwatch("collapsed");
		c.setAutoHide(true);
		window.removeEventListener("click", c.testClick, true);
		d.getElementById("toolbar-context-menu").removeEventListener("popuphidden", c.initToolbar, false);
		d.getElementById("viewToolbarsMenu")    .removeEventListener("popuphidden", c.initToolbar, false);

		custombb = null;
		custombbCommon = null;
	},

	get contMenu() {
		return document.getElementById("contentAreaContextMenu");
	},

	get hiddenStatus() {
		return !new RegExp(nsPreferences.copyUnicharPref("custombb.constrain.sites", "."), "i")
			.test(content.location.href);
	},

	showHide: function() {
		document.getElementById("custombb-popup").hidden = document.getElementById("context-undo").hidden
			|| custombb.hiddenStatus;
	},

	initAutoShow: function() {
		var ahIt = document.getElementById("custombb-button-autohide");
		var ah = nsPreferences.getBoolPref("custombb.toolbarAutoShow", true);
		if(ah)
			this.toggleAutoShow(ahIt, true);
		else {
			this.setAutoHide(true);
			document.getElementById("custombb").removeAttribute("custombbautoshow");
		}
		if(ahIt)
			ahIt.setAttribute("hidden", !ah);
	},

	toggleAutoShow: function(ahIt, init) {
		var rmv = ahIt
			? ahIt.getAttribute("cbbfixtoolbar") == "true"
			: false;

		if(!init) { // toggle
			rmv = !rmv;
			ahIt.setAttribute("cbbfixtoolbar", rmv);
		}
		if(ahIt) {
			var prefix = rmv ? "un" : "";
			ahIt.setAttribute("label", custombbCommon.getLocalised(prefix + "fixToolbarLabel"));
			ahIt.setAttribute("line1", custombbCommon.getLocalised(prefix + "fixToolbarTooltip"));
		}
		var cbb = document.getElementById("custombb");
		if(rmv)
			cbb.removeAttribute("custombbautoshow");
		else
			cbb.setAttribute("custombbautoshow", "always");

		this.setAutoHide(nsPreferences.getBoolPref("custombb.toolbarAutoShowAlways", true) || rmv);
	},

	setAutoHide: function(rmv) {
		var ntbx = document.getElementById("navigator-toolbox");
		if(rmv)
			ntbx.removeEventListener("mouseover", custombb.autoHide, false);
		else
			ntbx.addEventListener("mouseover", custombb.autoHide, false);
	},

	autoHide: function() {
		document.getElementById("custombb").setAttribute(
			"custombbautoshow",
			custombb.hiddenStatus ? "auto" : "always"
		);
	},

	showWarning: function(ttl, txt) {
		var dur = nsPreferences.getIntPref("custombb.notifyOpenTime", 5000);
		if(dur < 0)
			return;
		window.openDialog(
			"chrome://custombb/content/notify.xul",
			"",
			"chrome,dialog=yes,titlebar=no,popup=yes",
			dur, ttl, txt
		);
	},

	showHideToolbar: function() {
		var cbb = document.getElementById("custombb");
		cbb.collapsed = !cbb.collapsed;
	},

	initToolbar: function(load) {
		var shb = document.getElementById("custombb-button-showhide"); // ShowHide Button
		if(!shb)
			return;

		var cbb = document.getElementById("custombb");

		var cll = !cbb.collapsed;
		if(load)
			cll = !cll;

		var txtId = cll ? "show" : "hide";
		custombbCommon.setAttributes(shb, {
			label: custombbCommon.getLocalised(txtId + "TbLabel"),
			line1: custombbCommon.getLocalised(txtId + "TbTooltip")
		});
		setTimeout(function() { shb.setAttribute("checked", !cll); }, 0);
	},

	fillInTooltip: function() {
		var d = document;
		var dtn = d.tooltipNode;

		if(/^(toolbar(separator|spring|spacer))$/.test(dtn.tagName))
			dtn = dtn.parentNode;

		var L1 = dtn.getAttribute("line1");
		var L2 = dtn.getAttribute("line2");

		var it1 = d.getElementById("custombb-tooltip-line1");
		var it2 = d.getElementById("custombb-tooltip-line2");

		var menuitem = dtn.getAttribute("cbbeditable") == "menuitem";
		var key = dtn.hasAttribute("acceltext")
			? " " + dtn.getAttribute("acceltext")
			: "";

		var key1 = "", key2 = "";
		if(menuitem)
			key2 = key;
		else
			key1 = key;

		var menu = dtn.getAttribute("cbbeditable") == "menu";

		if(dtn.hasAttribute("cbbkey")) {
			var cbbkey = this.getKeyTooltip(dtn.getAttribute("cbbkey"));
			if(cbbkey)
				if(menu) {
					var pId = dtn.firstChild.getAttribute("cbbsource"); // menupopup
					var num = this.keyCopy[pId.replace(/s$/, "")];

					var ccp = custombbCommon.prefs;
					ccp.init(pId);
					var lbl = ccp.getAttr("label", num);

					key2 = lbl + cbbkey;
				}
				else
					key1 = cbbkey;
		}

		it1.value = L1 + key1;
		it1.hidden = !L1;

		it2.value = L2 + key2;
		it2.hidden = !L2 && !key2;

		var noL = !L1 && !L2;

		d.getElementById("custombb-tooltip-separator").hidden = noL;

		// Additional tooltips:
		var hideAll = !nsPreferences.getBoolPref("custombb.showAllTooltips", true) || !dtn.hasAttribute("cbbeditable");
		d.getElementById("custombb-tooltip-help").hidden = hideAll;
		if(!hideAll) {
			var button = dtn.getAttribute("cbbeditable") == "button";

			d.getElementById("custombb-tooltip-line3").hidden = !menu;
			d.getElementById("custombb-tooltip-line4").hidden = !menuitem && !button;
			d.getElementById("custombb-tooltip-line5").hidden = !menuitem || button;
			d.getElementById("custombb-tooltip-line6").hidden = !menuitem && !button;
		}
		if(noL && hideAll)
			return false; // hide tooltip

		return true;
	},

	get fe() {
		return document.commandDispatcher.focusedElement;
	},
	get ta() {
		var fe = this.fe;
		if(!fe)
			return null;
		try {
			if(typeof fe.value != "undefined" && typeof fe.selectionStart != "undefined")
				return fe;
		}
		catch(e) { // <input type="button"> => error
		}
		if(fe.contentEditable == "true")
			return fe;
		return null;
	},
	get lastTA() {
		var fw = document.commandDispatcher.focusedWindow;
		if(fw && !(fw instanceof Components.interfaces.nsIDOMChromeWindow))
			var doc = fw.document;
		else
			var doc = content.document;

		var tas = doc.getElementsByTagName("textarea");
		for(var i = tas.length - 1; i >= 0; i--) {
			var ta = tas[i];
			if(ta.offsetWidth && ta.offsetHeight)
				return ta;
		}

		var frames = doc.getElementsByTagName("iframe");
		for(var i = frames.length - 1; i >= 0; i--) {
			var frame = frames[i];
			if(frame.offsetWidth && frame.offsetHeight && frame.contentDocument) {
				var frmDoc = frame.contentDocument;
				var frmRoot = frmDoc.body || frmDoc.documentElement;
				if(frmRoot.offsetWidth && frmRoot.offsetHeight && frmRoot.contentEditable == "true")
					return frmRoot;
			}
		}

		var blocks = doc.getElementsByTagName("*");
		var win = doc.defaultView;
		for(var i = blocks.length - 1; i >= 0; i--) {
			var block = blocks[i];
			if(
				win.getComputedStyle(block, null).display == "block"
				&& block.offsetWidth && block.offsetHeight
				&& block.contentEditable == "true"
			)
				return block;
		}

		return null;
	},

	initInsert: function(event, what, extra) {
		this.insert(what, extra, event.shiftKey, event.ctrlKey);
	},

	customizableInsert: function(type) {
		this.insert(type, this.keyCopy[type], false, false);
	},

	insert: function(what, extra, tgglMd, tgglSelMd) { // Toggle Mode, Toggle Select Mode
		var warn = custombbCommon.getLocalised("warning");

		var ta = this.ta;
		var isCE = ta && ta.contentEditable == "true";

		var strSelection = "";
		var strClipboard = tgglMd && tgglSelMd
			? ""
			: isCE
				? !/^code(?:box)?$/i.test(what) && this.getClipboardData("text/html")
					|| this.convertToHTML(this.getClipboardData())
				: this.getClipboardData();

		if(ta) {
			if(isCE) {
				var taVal = ta.innerHTML;
				var tmp = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
				tmp.appendChild(document.commandDispatcher.focusedWindow.getSelection().getRangeAt(0).cloneContents());
				strSelection = tmp.innerHTML;
			}
			else {
				var taVal = ta.value;
				var startPos = ta.selectionStart;
				var endPos = ta.selectionEnd;
				strSelection = taVal.substring(startPos, endPos);
			}
		}
		else { // not textarea
			var qPast = true;

			var ta = this.lastTA;
			if(!ta) {
				this.showWarning(warn, custombbCommon.getLocalised("textareasNotFound"));
				if(what == "custom-b")
					custombb.initCustomItems("button");
				if(/custom/.test(what))
					var noTa = true;
				else
					return;
			}
			isCE = ta && ta.contentEditable == "true";
			var sel = document.commandDispatcher.focusedWindow.getSelection();
			if(isCE) {
				var tmp = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
				tmp.appendChild(sel.getRangeAt(0).cloneContents());
				strSelection = tmp.innerHTML;
			}
			else {
				strSelection = sel.toString();
			}
			strSelection = strSelection.replace(/^\s+|\s+$/g, "");
		}
		var strUsed = strSelection ? strSelection : strClipboard;

		var err = custombbCommon.getLocalised("error");
		var clipEmpty = custombbCommon.getLocalised("clipboardEmpty");
		var cLinks = nsPreferences.getBoolPref("custombb.constrain.links", true);
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
			var urlImgMask = new RegExp(nsPreferences.copyUnicharPref("custombb.urlImgMask",
				"^(ht|f)tps?:\/\/[^\\\\\s]+\.(jp(e?g|2)|png|gif|w?bmp|tiff?|ico)$"), "i");
			if(tgglMd)
				cLinks = !cLinks;

			var errImgSel = custombbCommon.getLocalised("errorImgSelected");
			var errImgClip = custombbCommon.getLocalised("errorImgClipboard");

			if(strSelection) {
				if(urlImgMask.test(strSelection))
					subst = "[img]" + strSelection + "[/img]";
				else {
					if(!cLinks)
						subst = "[img]" + strSelection + "[/img]";

					this.showWarning(err, errImgSel);
				}
			}
			else
				if(urlImgMask.test(strClipboard))
					subst = "[img]" + strClipboard + "[/img]";
				else {
					subst = "[img][/img]";
						if(strClipboard) {
							if(!cLinks)
								subst = "[img]" + strClipboard + "[/img]";

							this.showWarning(warn, errImgClip);
						}
						else
							this.showWarning(warn, clipEmpty);
				}
		break;

		case "invCommas":
			var icUseClip = nsPreferences.getBoolPref("custombb.invCommasUseClipboard", false);
			if(tgglMd)
				icUseClip = !icUseClip;

			if(icUseClip)
				subst = "«" + strUsed + "»";
			else {
				var st = this.commasIsOpen;
				var cmm = st
					? "»"
					: "«";

				if(strSelection) {
					subst = "«" + strSelection + "»";
					st = true;
				}
				else
					subst = cmm;

				this.commasIsOpen = !st;
			}
		break;

		case "url":
			var urlMask = new RegExp(nsPreferences.copyUnicharPref("custombb.urlMask", "^(ht|f)tps?:\/\/[^\s\\\\]+$"), "i");
			if(tgglMd)
				cLinks = !cLinks;

			var okClip = urlMask.test(strClipboard);

			var errUrlSelClip = custombbCommon.getLocalised("errorUrlSelectedAndClipboard");
			var errUrlClip = custombbCommon.getLocalised("errorUrlClipboard");

			if(strSelection) {
				if(urlMask.test(strSelection))
					subst = "[url]" + strSelection + "[/url]";
				else
					if(okClip)
						subst = "[url=" + strClipboard + "]" + strSelection + "[/url]";
					else {
						if(!cLinks)
							subst = "[url]" + strSelection + "[/url]";

						this.showWarning(err, errUrlSelClip);
					}
			}
			else
				if(okClip)
					subst = "[url]" + strClipboard + "[/url]";
				else {
					subst = "[url][/url]";
						if(strClipboard) {
							if(!cLinks)
								subst = "[url]" + strClipboard + "[/url]";

							this.showWarning(warn, errUrlClip);
						}
						else
							this.showWarning(warn, clipEmpty);
				}
		break;

		case "list":
			var lAst = nsPreferences.getBoolPref("custombb.listAsterisk", true);
			if(tgglMd)
				lAst = !lAst;
			subst = lAst
				? strUsed.replace(/^\*\s*/mg, "[*]")
				: strUsed.replace(/\n+/g, "\n").replace(/^\s*/mg, "[*]").replace(/(\[\*\]){2}/mg, "[*]");
			subst = "[list]" + subst + "[/list]";
		break;

		case "style":
			var errStyleRepl = custombbCommon.getLocalised("errorStyleReplace");
			var and = custombbCommon.getLocalised("and");
			var codeBreak = custombbCommon.getLocalised("codeBreak") + "!";

			var cStDash = nsPreferences.getBoolPref("custombb.constrain.style.dash", true);
			var cStDashPlus = nsPreferences.getBoolPref("custombb.constrain.style.dashPlus", false);
			var cStCommas = nsPreferences.getBoolPref("custombb.constrain.style.commas", true);

			subst = strUsed;

			if(/\[code\].+\[\/code\]/i.test(subst)) {
				alert(codeBreak);
				break;
			}
			if(cStDash) {
				subst = subst.replace(/-_-/g, "<$smile1$>")
					.replace(/^ *--? */mg, "– ")
					.replace(/ *- *\n/g, "")
					.replace(/ *-- */g, " – ")
					.replace(/ +- +/g, " – ")

					.replace(/\. *- */g, ". – ")
					.replace(/! *- */g, "! – ")
					.replace(/\? *- */g, "? – ")
					.replace(/, *- */g, ", – ");

				if(cStDashPlus)
					subst = subst.replace(/ +-/g, " – ")
						.replace(/- +/g, " – ");
			}
			if(cStCommas)
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

			if(nsPreferences.getBoolPref("custombb.constrain.style.symbols", true))
				subst = subst.replace(/\([сСcC]\)/g, "©")
					.replace(/\([rRрР]\)/g, "®")
					.replace(/\([tTтТ][mMмМ]\)/g, "™");

			if(nsPreferences.getBoolPref("custombb.constrain.style.punktMarks", false)) {

				for(var i = 0; i < subst.length - 3; i++)
					if(/\d[\.,:]\d/.test(subst.substring(i, i + 3))) {
						var point = "";
						switch(subst.charAt(i+1)) {
							case '.': point = "point"; break;
							case ',': point = "comma"; break;
							case ':': point = "colon"; break;
						}
						subst = subst.substring(0, i+1) + "<$" + point + "$>" + subst.substring(i+2, subst.length);
					}

				if(!/\[\/?(img|url)(\]|=)|(ht|f)tps?:\/\/[0-9a-z]|www\d?\.|(^|\s)[-\w]+\.[a-z]{2,4}(\s|$)/i.test(subst)) { // don't edit URLs and filenames
					if(!/[^\d\.][0-3]?\d\.[01]?\d\.(19|20)?\d\d[^\d\.]/i.test(subst)) // don't edit date
						subst = subst.replace(/ *\. */g, ". ");

					subst = subst.replace(/ *! */g, "! ").replace(/ *\? */g, "? ");
					if(!/:([a-z0-9]{2,12}:|[\(\)oDP])/i.test(subst)) // don't edit codes of smiles
						subst = subst.replace(/ *: */g, ": ");
				}
				subst = subst.replace(/ *, */g, ", ")

					.replace(/;\)/g, "<$smile2$>") // don't edit ";)"
					.replace(/ *; */g, "; ")
					.replace(/<\$smile2\$>/g, ";)")

					.replace(/ {2,}/g, " ")
					.replace(/^ +| +$/mg, "")

					.replace(/ !/g, "!") // delete replace bugs (for "...", "!!!", "?.." etc)
					.replace(/ \?/g, "?")
					.replace(/ \./g, ".")
					.replace(/\. \)/g, ".)")

					.replace(/<\$point\$>/g, ".")
					.replace(/<\$comma\$>/g, ",")
					.replace(/<\$colon\$>/g, ":");

				if(cStCommas)
					subst = subst.replace(/\. »/g, ".»")
						.replace(/! »/g, "!»")
						.replace(/\? »/g, "?»");
			}

			if(cStCommas) {
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
			if(cStDash && !cStCommas)
				if(numDashs1 != 0 || numDashs2 != 0)
					this.showWarning(err, numDashs1 + " [ -] "  + and + " " + numDashs2 + " [- ] " + errStyleRepl);

			if(!cStDash && cStCommas)
				if(numCommas != 0)
					this.showWarning(err, numCommas + " [\"] " + errStyleRepl);

			if(cStDash && cStCommas)
				if(numDashs1 != 0 || numDashs2 != 0 || numCommas != 0)
					this.showWarning(
						err,
						numDashs1 + " [ -], " +
						numDashs2 + " [- ] " + and + " " +
						numCommas + " [\"] " + errStyleRepl
					);

			subst = subst.replace(/<\$smile1\$>/g, "-_-");

		break;

		case "smiley-code":
		case "smiley-url":
			var code = what == "smiley-code";
			var aTagSt  = code ? " " : "[img]";
			var aTagEnd = code ? " " : "[/img]";
			var aTags = true; // another tags
		case "symbol":
			var noTags = true;
		case "color":
			//if(isCE) {
			//	custombbCommon.prefs.init("colors");
			//	var ins = custombbCommon.prefs.getAttr("color", extra);
			//	subst = "<span style=\"color: " + this.fixColor(ins) + ";\">" + strUsed + "</span>";
			//	break;
			//}
		case "size":
		case "font":
			var pId = aTags
				? (code ? "smileysCodes" : "smileysURLs")
				: what + "s";

			custombbCommon.prefs.init(pId);
			var ins = custombbCommon.prefs.getAttr(what.replace(/-.+$/, ""), extra);

			if(ins) {
				if(aTags)
					subst = aTagSt + ins + aTagEnd;
				else
					if(noTags)
						subst = ins;
					else
						subst = "[" + what + "=" + ins + "]" + strUsed + "[/" + what + "]";
			}
			else
				alert(custombbCommon.getLocalised(what + "NotDefined") + ": " + extra);
		break;

		case "custom-b":
			this.initCustomItems("button");
		case "custom":
			var add = what == "custom-b" ? "Buttons" : "s";

			custombbCommon.prefs.init("custom" + add);
			var opTag = custombbCommon.prefs.getAttr("openTag", extra);
			var clTag = custombbCommon.prefs.getAttr("closeTag", extra);

			var evalStart = /^eval *\( *["']\s*/;
			var evalEnd = /\s*["'] *\);?$/;
			var evalMode = evalStart.test(clTag) && evalEnd.test(clTag);

			if(opTag || clTag) {
				if(!opTag) // For signatures
					strUsed = strSelection;

				/* Get user's text:
				 * Example: openTag = [multitag attr1="%Attr 1:%" attr2="%Attr 2:%"]
				 * prompt("Attr 1:") => get "user text 1"
				 * prompt("Attr 2:") => get "user text 2"
				 * [multitag attr1="user text 1" attr2="user text 2"]
				 */
				var getUserText = function(str) {
					while(/%[^%]*%/.test(str)) {
						var userText = str.replace(/^[^%]*%/, "").replace(/%.*$/, ""); // [quote=%Author:%] => Author:
						var def = userText.replace(/^\s*/, "").replace(/\s*:?\s*$/, "");
						userText = prompt(userText, def, "CustomBB: " + custombbCommon.getLocalised("customTagInquiryTitle"));
						if(typeof userText != "string") // "Cansel" button
							return null;
						str = str.replace(/%[^%]*%/, userText);
					}
					return str;
				}
				var nOpTag = getUserText(opTag);
				if(opTag && !nOpTag)
					return;
				opTag = nOpTag;

				clTag = getUserText(clTag);

				if(!evalMode)
					clTag = clTag.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

					// Multiplication: "+{3}" => "+++"
				if(!/\{|\}/.test(clTag.replace(/\{\d{1,2}\}/g, "")))
					while(/\{\d{1,2}\}/.test(clTag)) { // if without .substring(0, 2) then incorrect num defined:
						var num = clTag.replace(/^[^\{]*\{/, "").substring(0, 2).replace(/\}.*$/, "");
						if(!/^\d{1,2}$/.test(num)) { // invalid num?
							alert("Unknown error of closeTag multiplication:\nnum = [" + num + "]\ncloseTag = [" + clTag + "]");
							return;
						}
						var ind = clTag.indexOf("{" + num + "}");
						var targetChar = clTag.charAt(ind - 1);
						var charXnum = "";

						for(var i = 1; i <= num; i++)
							charXnum += targetChar;

						clTag = clTag.substring(0, ind - 1) + charXnum + clTag.substring(ind, clTag.length);
						clTag = clTag.replace( new RegExp("\\{" + num + "\\}"), "" );
					}

				if(!opTag && evalMode) { // eval("...");
					var cmd = clTag.replace(evalStart, "").replace(evalEnd, "");
					try { eval(cmd); }
					catch(e) { alert("Error:\n\n" + e); }
				}
				else
					subst = opTag + strUsed + clTag;
			}
			else
				alert(custombbCommon.getLocalised("customNotDefined") + ": " + extra);
		break;

		case "customColor":
			// isCE ? "<span style=\"color: " + this.fixColor(extra) + ";\">" + strUsed + "</span>"
			subst = "[color=" + extra + "]" + strUsed + "[/color]";
		break;

		default:
			alert(custombbCommon.getLocalised("cmdNotDefined") + ": " + what);
		}

		if(!subst || noTa)
			return;

		var cDashs = /^(«»|[«»]|[ \t]?[-–—][ \t])$/;
		var tagsOnly = /^\[([a-z]+)(=(["']?)#?(([a-z0-9]+)( \4)?)+\3)?\](\[\*\])?\[\/\1\]$/i.test(subst) ||
			cDashs.test(subst);

		if(qPast) {
			subst += /\n|\r/.test(subst) ? "" : "\n";
			var f = nsPreferences.getBoolPref("custombb.focusTextareaAfterQuickPaste", true);
			this.insertText(ta, subst, !f) && f && ta.focus();
		}
		else {
			this.insertText(ta, subst);
		}
		var selOut = nsPreferences.getBoolPref("custombb.selectOutput", false);
		if(tgglSelMd)
			selOut = !selOut;

		if(tagsOnly) {
			if(cDashs.test(subst)) {
				if(subst == "«»") // Move cursor, if "«»"
					ta.selectionEnd--;
			}
			else
				ta.selectionEnd += -subst.replace(/^\[[^\[\]]+\](\[\*\])?/i, "").length;
		}
		else
			if(selOut) // Select inserted text
				ta.selectionStart = ta.selectionEnd - subst.length;
	},

	insertText: function(ta, text, noFocus) {
		if(ta.contentEditable == "true")
			return this.insertHTML(ta, text);

		var editor = ta.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
			.editor
			.QueryInterface(Components.interfaces.nsIPlaintextEditor);
		if(editor.flags & editor.eEditorReadonlyMask)
			return false;

		var sTop    = ta.scrollTop;
		var sHeight = ta.scrollHeight;
		var sLeft   = ta.scrollLeft;
		var sWidth  = ta.scrollWidth;

		if(noFocus) {
			var val = ta.value;
			var ss = ta.selectionStart;
			ta.value = val.substring(0, ss) + text + val.substring(ta.selectionEnd);
			var se = ss + text.length;
			ta.selectionStart = se;
			ta.selectionEnd = se;
		}
		else {
			if(text)
				editor.insertText(text);
			else
				editor.deleteSelection(0);
		}

		// Fails in Firefox 4.0b9pre - needs timeout
		ta.scrollTop  = sTop  + (ta.scrollHeight - sHeight);
		ta.scrollLeft = sLeft + (ta.scrollWidth  - sWidth);

		return true;
	},
	insertHTML: function(node, html) {
		if(!("activeElement" in node.ownerDocument) || node.ownerDocument.activeElement != node)
			node.focus(); //~ todo: insert without focus
		if(/^ +/.test(html))
			html = new Array(RegExp.lastMatch.length + 1).join("&nbsp;") + RegExp.rightContext;
		if(/ +$/.test(html))
			html = RegExp.leftContext + new Array(RegExp.lastMatch.length + 1).join("&nbsp;");
		try {
			node.ownerDocument.execCommand("insertHTML", false, html);
			return true;
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return false;
	},
	convertToHTML: function(s) {
		return (s || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/\r\n?|\n\r?/g, "<br/>");
	},

	//trimCommas: function(s) {
	//	return s.replace(/^('|")|\1$/g, "");
	//},
	//fixColor: function(s) {
	//	s = this.trimCommas(s);
	//	if((s.length == 3 || s.length == 6) && /\d/.test(s))
	//		s = "#" + s;
	//	return s;
	//},

	get cb() {
		delete this.cb;
		return this.cb = Components.classes["@mozilla.org/widget/clipboard;1"]
			.getService(Components.interfaces.nsIClipboard);
	},
	get transferableInstance() {
		return Components.classes["@mozilla.org/widget/transferable;1"]
			.createInstance(Components.interfaces.nsITransferable);
	},
	getClipboardData: function(flavor, clipId) {
		if(!flavor)
			flavor = "text/unicode";
		var ta = this.transferableInstance;
		ta.addDataFlavor(flavor);
		var cb = this.cb;
		cb.getData(ta, clipId === undefined ? cb.kGlobalClipboard : clipId);
		var data = {}, len = {};
		try {
			ta.getTransferData(flavor, data, len);
			return data.value
				.QueryInterface(Components.interfaces.nsISupportsString)
				.data
				.substr(0, len.value / 2);
		}
		catch(e) {
		}
		return "";
	},

	getKeyTooltip: function(kId) {
		var kIt = document.getElementById(kId);
		if(!kIt) {
			alert("getKeyTooltip(kId) error\ninvalid id:\n" + kId);
			return "";
		}
		if(kIt.disabled)
			return null;

		var mdfs = kIt.getAttribute("modifiers");
		var key = kIt.getAttribute("key");
		var keycode = kIt.getAttribute("keycode");

		if(!key && !keycode)
			return "";

		var kVal = key ? key : keycode.replace(/^vk_/i, "");
		mdfs = mdfs.replace(/\s*,\s*/g, "+");

		var firstUpper = function(val, sep, nSep) {
			var parts = val.split(sep);

			// Returns WINNT on Windows XP, 2000, NT
			var OS = Components.classes["@mozilla.org/xre/app-info;1"]
				.getService(Components.interfaces.nsIXULRuntime)
				.OS;
			var accel = OS == "WINNT" ? "Ctrl" : "Accel";

			for(var i = 0; i < parts.length; i++) {
				var p = parts[i];
				parts[i] = (p.substring(0, 1).toLocaleUpperCase() + p.substring(1, p.length).toLocaleLowerCase())
					.replace(/^back/i, "BackSpace")
					.replace(/control/i, "Ctrl")
					.replace(/screen/i, "Screen")
					.replace(/accel/i, accel);
			}
			return parts.join(nSep);
		}

		kVal = firstUpper(kVal, "_", "");
		mdfs = firstUpper(mdfs, "+", "+");

		return " " + mdfs + "+" + kVal;
	},

	initKeys: function() {
		var kTypes = ["main", "locale"];
		var kNames = ["showToolbar", "code", "url", "bold", "italic", "underline", "strike",
			"quote", "invCommas", "list", "img", "style", "color", "symbol", "custom"];

		for(var i = 0; i < kTypes.length; i++)
			for(var j = 0; j < kNames.length; j++) {
				var kPref = nsPreferences.copyUnicharPref("custombb.key." + kNames[j] + "." + kTypes[i], "");
				var kId = "custombb-key-" + kNames[j] + "-" + kTypes[i];

				if(/(^| )enable=true( |$)/i.test(kPref) && /(^| )key=\{(.|vk_\w+)\}( |$)/i.test(kPref)) {
					var kIt = document.getElementById(kId);
					kIt.setAttribute("disabled", false);

					var kMdfs = ""; // modifiers

					if(/(^| )(control|ctrl)( |$)/i.test(kPref))
						kMdfs = "control";
					if(/(^| )alt( |$)/i.test(kPref))
						kMdfs += ",alt";
					if(/(^| )shift( |$)/i.test(kPref))
						kMdfs += ",shift";
					if(/(^| )accel( |$)/i.test(kPref))
						kMdfs += ",accel";
					if(/(^| )meta( |$)/i.test(kPref))
						kMdfs += ",meta";

					kMdfs = kMdfs.replace(/^,/, "");

					var kVal = kPref
						.replace(/^.*key=\{/i, "")
						.replace(/\}( +(ctrl|control|alt|shift|accel|meta|enable=(true|false)).*)?$/i, "");

					if(!kVal)
						kIt.setAttribute("disabled", true);

					var attr;
					if(/^vk_/i.test(kVal))
						attr = "keycode";
					else {
						attr = "key";
						kVal = kVal.charAt(0);
					}

					kIt.setAttribute(attr, kVal);
					kIt.setAttribute("modifiers", kMdfs);
				}
			}

		this.initKeyCommands();
	},

	initKeyCommands: function() {
		var kCmd = ["color", "symbol", "custom"];

		for(var i = 0; i < kCmd.length; i++) {
			var kc = kCmd[i];
			this.keyCopy[kc] = nsPreferences.getIntPref("custombb.key." + kc, 1); // copy
		}
	},

	createPopup: function(mp) {
		var d = document, cc = custombbCommon;

		this.oldSelectedItem = null; // Clear replace cache

		var pId = mp.getAttribute("cbbsource");
		var fpId = "custombb." + pId;
		var miId = mp.getAttribute("id").replace(/^custombb-mpopup/, ""); // -tb-custom
		var tp = miId.replace(/^-(tb|cm)-/, ""); // type

		var num = nsPreferences.getIntPref(fpId + "Quantity", 15); // max
		if(num == 0)  num = 1;
		if(num > 200) num = 200;

		var cNum = mp.getAttribute("cbb_current_num");
		cNum = cNum ? parseInt(cNum) : 0;
		var reNum = num != cNum;
		var color = tp == "color";

		if(reNum) {
			if(color) {
				var custColSep = d.getElementById("custombb" + miId + "-custom-sep");
				var custCol = d.getElementById("custombb" + miId + "-custom");
				if(custColSep && custCol) {
					mp.removeChild(custColSep);
					mp.removeChild(custCol);
				}
			}
			var delta = num - cNum;
			if(delta > 0)
				for(var i = 1; i <= delta; i++) {
					var mi = d.createElement("menuitem");
					cc.setAttributes(mi, {
						id: "custombb-popup" + miId + "-" + (cNum + i),
						line1: cc.getLocalised(tp + "Tooltip") + ":",
						cbbeditable: "menuitem",
						onclick: "custombb.clickHandler(event);",
						oncommand: "custombb.clickHandler(event);"
					});
					mp.appendChild(mi);
				}
			else
				for(var i = 1; i <= -delta; i++)
					mp.removeChild(mp.lastChild);

			mp.setAttribute("cbb_current_num", num);
		}
		var src = nsPreferences.copyUnicharPref(fpId, "");
		var cSrc = mp.getAttribute("cbb_current_src");

		if(!cSrc || src != cSrc || mp.cbb_redraw_required || reNum) {
			mp.cbb_redraw_required = false;
			mp.className = mp.className.replace(/ *custombb-select */, "");

			cc.prefs.init(pId, true);
			var pObj = cc.prefs.getAll();

			var mis = mp.getElementsByTagName("menuitem");

			var misL = mis.length;
			if(color && !reNum)
				misL--;

			for(var i = 0; i < misL; i++) {
				var mi = mis[i];

				var lbl, clss, img, l2, stl, hddn;

				switch(tp) {
					case "color":
						lbl = pObj[i][1];
						clss = pObj[i][2];

						clss = clss == "black" || clss == "white"
							? "custombb-bg-" + clss
							: null;

						img = null;
						l2 = pObj[i][0];
						stl = cc.repairStyle.color(l2);
						hddn = !lbl || !l2;
					break;

					case "size":
						lbl = pObj[i][1];
						clss = null;
						img = null;
						l2 = pObj[i][0];
						stl = cc.repairStyle.size(pObj[i][2]);
						hddn = !lbl || !l2;
					break;

					case "font":
						lbl = pObj[i][1];
						clss = null;
						img = null;
						l2 = pObj[i][0];
						stl = cc.repairStyle.font(l2);
						hddn = !lbl || !l2;
					break;

					case "symbol":
						lbl = pObj[i][1];
						clss = null;
						img = null;
						l2 = pObj[i][0];
						stl = null;
						hddn = !lbl || !l2;
					break;

					case "custom":
						lbl = pObj[i][2];
						img = pObj[i][3];
						clss = img
							? "menuitem-iconic"
							: null;

						var ot = pObj[i][0];
						var ct = pObj[i][1];

						l2 = !ot && /^eval *\( *(["']).*\1 *\);?$/.test(ct)
							? ct
							: (ot ? ot + " + " : "") + cc.getLocalised("customText") + (ct ? " + " + ct : "");

						stl = null;
						hddn = (!lbl && !img) || (!ot && !ct);

						img = cc.testPatch(img);
				}

				cc.setAttributes(mi, {
					label: lbl,
					"class": clss,
					image: img,
					line2: l2,
					style: stl,
					key: null,
					cbbacceltext: null
				});

				mi.hidden = hddn;
			}
			mp.setAttribute("cbb_current_src", src);
		}
		if(this.showAll)
			this.showAllItems(mp);

		if(/^(color|symbol|custom)$/.test(tp))
			this.addKey(tp, miId);

		if(color && reNum) {
			var ms = d.createElement("menuseparator");
			ms.setAttribute("id", "custombb" + miId + "-custom-sep")
			mp.appendChild(ms);

			var mi = d.createElement("menuitem");
			cc.setAttributes(mi, {
				id: "custombb" + miId + "-custom",
				label: cc.getLocalised("colorpicker"),
				line1: cc.getLocalised("colorpickerTtip"),
				//onclick: "custombb.openColorpicker(event);",
				oncommand: "custombb.openColorpicker(event);",
				cbbnoteditable: "true"
			});
			mp.appendChild(mi);
		}
	},

	addKey: function(tp, miId) {
		var n = this.keyCopy[tp];
		var it = document.getElementById("custombb-popup" + miId + "-" + n);
		it.setAttribute("key", "custombb-key-" + tp + "-main");
		it.setAttribute("cbbacceltext", "true"); // fix bug... (else label is hidden)
		it.parentNode.cbb_redraw_required = true;
	},

	openColorpicker: function(event) {
		var modal = nsPreferences.getBoolPref("custombb.modalColorpicker", true);
		window.openDialog(
			"chrome://custombb/content/colorpicker.xul",
			"",
			"chrome, dependent, " + (modal ? "modal, " : "") + "centerscreen",
			event.shiftKey, event.ctrlKey, modal
		);
	},

	createSmileys: function(mp) {
		var d = document, cc = custombbCommon;

		this.oldSelectedItem = null; // Clear replace cache

		var mpId = mp.getAttribute("id");

		var pId = mp.getAttribute("cbbsource");
		var miId = mpId.replace(/^custombb-mpopup/, "");

		var num = nsPreferences.getIntPref("custombb." + pId + "Quantity", 20); // max items
		if(num == 0)   num = 1;
		if(num > 400) num = 400;
		var cNum = mp.getAttribute("cbb_current_num");
		cNum = cNum ? parseInt(cNum) : 0;
		var col = nsPreferences.getIntPref("custombb." + pId + "Columns", 4); // columns
		if(col == 0) col = 1;
		if(col > 100) col = 100;
		var cCol = mp.getAttribute("cbb_current_col");
		cCol = cCol ? parseInt(cCol) : 0;

		var reNum = num != cNum || col != cCol;

		var nrw = Math.ceil(num / col); // Number of RoWs
		var ind = 1;

		var clss = parseFloat(
				Components.classes["@mozilla.org/xre/app-info;1"]
				.getService(Components.interfaces.nsIXULAppInfo)
				.version
			) <= 2
			? "menuitem-iconic custombb-hover"
			: "menuitem-iconic";

		if(reNum) {
			cc.erasePopup(mp);

			var gr = d.createElement("grid");
			mp.appendChild(gr);

			var cls = d.createElement("columns");
			gr.appendChild(cls);
			for(var i = 1; i <= col; i++) {
				var cl = d.createElement("column");
				cls.appendChild(cl);
			}
			var rws = d.createElement("rows");
			gr.appendChild(rws);

			var nrw = Math.ceil(num / col);
			var ind = 1;

			for(var i = 1; i <= nrw; i++) {
				var rw = d.createElement("row");
				rws.appendChild(rw);
				rw.setAttribute("cbbeditable", "menu");

				for(var j = 1; j <= col && !complete; j++) {
					var mi = d.createElement("menuitem");
					cc.setAttributes(mi, {
						id: "custombb-popup" + miId + "-" + ind,
						line1: cc.getLocalised(pId + "Tooltip") + ":",
						"class": clss,
						cbbeditable: "menuitem",
						onclick: "custombb.clickHandler(event);",
						oncommand: "custombb.clickHandler(event);"
					});
					rw.appendChild(mi);

					if(ind == num)
						var complete = true;

					ind++;
				}
			}
			cc.setAttributes(mp, {
				cbb_current_num: num,
				cbb_current_col: col
			});
		}
		var src = nsPreferences.copyUnicharPref("custombb." + pId, "");
		var cSrc = mp.getAttribute("cbb_current_src");
		var reDr = mp.cbb_redraw_required;

		if(!cSrc || src != cSrc || reDr || reNum) {
			mp.cbb_redraw_required = false;
			mp.className = mp.className.replace(/ *custombb-select */, "");

			cc.prefs.init(pId, true);
			var pObj = cc.prefs.getAll();

			var mis = mp.getElementsByTagName("menuitem");

			for(var i = 0; i < mis.length; i++) {
				var mi = mis[i];

				var sm = pObj[i][0];
				var img = pObj[i][1];

				cc.setAttributes(mi, {
					line2: sm,
					image: custombbCommon.testPatch(img),
					label: null
				});
				if(reDr)
					cc.setAttributes(mi, {
						label: null,
						"class": clss
					});

				mi.hidden = !sm || !img;
			}
			mp.setAttribute("cbb_current_src", src);
		}
		if(this.showAll)
			this.showAllItems(mp);
	},

	createAllMenuitems: function() {
		var ids = ["color", "size", "font", "symbol", "smiley-code", "smiley-url", "custom"];
		var tps = ["tb", "cm"];

		for(var i = 0; i < tps.length; i++)
			for(var j = 0; j < ids.length; j++) {
				var id = ids[j];
				var mp = document.getElementById("custombb-mpopup-" + tps[i] + "-" + id);
				if(mp)
					if(/smiley/.test(id))
						this.createSmileys(mp);
					else
						this.createPopup(mp);
			}
	},

	showAllSubItems: function(event, b) {
		var tar = event.target;

		if(tar.tagName == "row")
			tar = tar.parentNode.parentNode;

		if(event.button == 0 && event.shiftKey && !event.ctrlKey) // Left+Shift => show all
			this.showAllItems(tar, b);
	},

	showAllItems: function(prnt, b) {
		var ind = 1;
		var mis = prnt.getElementsByTagName("menuitem");
		for(var i = 0; i < mis.length; i++) {
			var mi = mis[i];

			if((!b && !mi.hasAttribute("cbbnoteditable")) || /-custom-b-/.test(mi.getAttribute("id"))) {
				var lbl = mi.getAttribute("label");
				lbl = ind + ". " + lbl.replace(new RegExp("^" + ind + "\\. "), "");
				mi.setAttribute("label", lbl);
				mi.hidden = false;

				ind++;
			}
		}
		this.showAll = true;
	},

	setShowStatus: function(mp, main) {
		var sa = "showAll";
		if(main)
			sa += "Main";

		mp.cbb_redraw_required = mp.cbb_redraw_required
			? true
			: this[sa];
		this[sa] = false;
	},

	clickHandler: function(event, cb) { // custom button
		var cc = custombbCommon;

		var mi = event.target;
		var miId = mi.getAttribute("id");

		var tp = miId.replace(/^custombb-(popup-(tb|cm)|button|popup)-/, "");
		var num = parseInt(tp.replace(/^[a-z-]+/, ""));
		tp = tp.replace(/-\d+$/, ""); // type

		var bttn = event.button, ctrl = event.ctrlKey, alt = event.altKey, shift = event.shiftKey;

		if(bttn == 0 || !bttn) { // Left-click => paste
			this.insert(tp, num, shift, ctrl);
			return;
		}
		var prnt = mi.parentNode;
		if(/smiley/.test(tp))
			prnt = prnt.parentNode.parentNode.parentNode; // <menupopup><grid><rows><row>

		if((bttn == 1 && !shift && !ctrl) || (bttn == 2 && shift && !ctrl)) { // Middle-click || Shift+Right-click => show all
			if(/-button-/.test(miId))
				return; // custom button (show alwais)
			this.showAllItems(prnt, cb);
			return;
		}
		var pId = prnt.getAttribute("cbbsource");
		if(!pId)
			pId = "custombb.customButtons"; // custom button and not CBB toolbar

		var edit = bttn == 2 && !ctrl && !shift && !alt;
		if(edit || (bttn == 1 && !ctrl && shift)) { // Right-click || Shift+Middle-click => settings
			custombb.contMenu.hidePopup(); // fix bug in Linux
			if(prnt.hidePopup)
				prnt.hidePopup();
			window.openDialog(
				"chrome://custombb/content/editor/" + tp.replace(/-.*$/, "") + ".xul",
				"",
				"chrome,resizable,dependent,centerscreen",
				num, tp, pId
			);
			return;
		}
		var swap = bttn == 2 && ctrl && !shift && !alt;
		if(swap || (bttn == 1 && ctrl && !shift)) { // Ctrl+Right-click || Ctrl+Middle-click => swap
			prnt.cbb_redraw_required = true;
			if(!this.oldSelectedItem) {
				this.oldSelectedItem = num;

				var clss = (mi.getAttribute("class") + " custombb-prefs-copied").replace(/^ /, "");

				var copy = "[" + custombbCommon.getLocalised("SettingsCopied") + "] " + mi.getAttribute("line2");

				cc.setAttributes(mi, {
					"class": clss,
					line2: copy
				});
				prnt.className = prnt.className + "custombb-select";
			}
			else {
				var oldNum = this.oldSelectedItem;

				cc.prefs.init(pId, true);
				cc.prefs.swap(oldNum, num);

				if(/smiley/.test(tp)) // reload
					this.createSmileys(prnt);
				else
					if(cb) {
						this.initCustomItems("popup");
						this.initCustomItems("button");
					}
					else
						this.createPopup(prnt);

				this.oldSelectedItem = null;
			}
		}
	},

	switchClick: function(event) {
		var set = event.target.id.indexOf("-settings") > 0;
		var bttn = event.button, ctrl = event.ctrlKey;

		if(bttn == 0 && !ctrl)
			if(set)
				this.openSettings();
			else
				custombb.showHideToolbar();
		else if(bttn == 1 || (bttn == 0 && ctrl)) {
			if(set) {
				var pId = "custombb.selectOutput";
				nsPreferences.setBoolPref(pId, !nsPreferences.getBoolPref(pId, true));
			}
			else
				this.openSettings();
		}
	},

	openSettings: function() {
		window.openDialog(
			"chrome://custombb/content/prefs/options.xul",
			"",
			"chrome, resizable, titlebar, toolbar, dialog=false" // centerscreen, resizable, dependent
		);
	},

	openToolbarButton: function(ctbb) { // current toolbar button
		// thanks to Web Developer
		// If the toolbar button is set and is not open
		if(ctbb && !ctbb.open) {
			var tbb = null;
			var tbbs = ctbb.parentNode.getElementsByTagName("toolbarbutton");
			var tbbsl = tbbs.length;

			// Loop through the toolbar buttons
			for(var i = 0; i < tbbsl; i++) {
				tbb = tbbs[i];
				// If the toolbar button is set, is not the same toolbar button and is open
				if(tbb && tbb != ctbb && tbb.open) {
					tbb.open = false;
					ctbb.open = true;

					break;
				}
			}
		}
	},

	initCustomItems: function(tp) {
		var popup = tp == "popup";
		var cc = custombbCommon;

		cc.prefs.init("customButtons", true);
		var pObj = cc.prefs.getAll();

		for(var i = 0; i < 5; i++) {
			var n = i + 1;
			var it = document.getElementById("custombb-" + tp + "-custom-b-" + n);

			if(it) {
				var lbl = pObj[i][2], img = pObj[i][3], ot = pObj[i][0], ct = pObj[i][1];

				if(popup)
					it.hidden = (!lbl && !img) || (!ot && !ct);

				if(!lbl)
					lbl = "CustomBB " + n;

				var l2 = !ot && /^eval *\( *(["']).*\1 *\);?$/.test(ct)
					? ct
					: (ot ? ot + " + " : "") + cc.getLocalised("customText") + (ct ? " + " + ct : "");

				cc.setAttributes(it, {
					image: cc.testPatch(img),
					label: lbl,
					line2: l2,
					"class": it.getAttribute("class").replace(/ ?custombb-prefs-copied/, "")
				});
			}
		}
		if(popup && this.showAllMain)
			this.showAllItems(it.parentNode, true);
	},

	openPreview: function(event) {
		var et = event.target;
		if(event.target.tagName == "toolbarbutton" && event.button == 0)
			return;

		if(et.tagName == "menu")
			et.parentNode.hidePopup();

		var ta = this.ta;
		var err = custombbCommon.getLocalised("prevError");

		if(ta) {
			var isCE = ta.contentEditable == "true";
			var val = isCE ? ta.innerHTML : ta.value;
			if(val) {
				var lb = this.getLineBreak(val);
				var time = nsPreferences.getIntPref("custombb.previewUpdateTimeout", 300);
				window.openDialog(
					"chrome://custombb/content/preview.xul",
					"",
					"chrome, resizable, centerscreen, dependent, scrollbars, dialog=false",
					{
						value: this.markLine(ta, lb),
						isCE: isCE,
						time: time,
						lb: lb,
						ta: ta
					}
				);
				if(time >= 0)
					this.getTaVal(ta, time, lb);
			}
			else
				this.showWarning(err, custombbCommon.getLocalised("prevNoTags"));
		}
		else
			this.showWarning(err, custombbCommon.getLocalised("prevSelectTextarea"));
	},

	getLineBreak: function(val) {
		return /\n|\r/.test(val)
			? val.match(/(\n|\r|\r\n)/m)[1]
			: null;
	},

	getTaVal: function(ta, time, lb) {
		this.taVal = this.markLine(ta, lb);

		this.getTaValTimeout = setTimeout(function() {
			custombb.getTaVal(ta, time, lb)
		}, time);
	},

	markLine: function(ta, lb) {
		var isCE = ta.contentEditable == "true";
		var val = isCE ? ta.innerHTML : ta.value;

		if(!lb)
			lb = this.getLineBreak(val);

		if(!lb)
			return val;

		var lines = val.split(lb);
		var cLine = Math.ceil(ta.scrollTop * lines.length / ta.scrollHeight); // current line

		var cSelSt = ta.selectionStart;

		var oldLine = cLine == this.taOldLine;
		var oldSel = cSelSt == this.taOldSelSt;

		if(oldLine && oldSel)
			return val;

		this.taOldLine = cLine; // copy
		this.taOldSelSt = cSelSt;

		if(!oldLine) {
			lines[cLine] = "[$~|CurrentLine|~$]" + lines[cLine];
			return lines.join(lb);
		}
		else
			return val.substring(0, cSelSt) + "[$~|CurrentSelectionStart|~$]" + val.substring(cSelSt, val.length);
	},

	testClick: function(event) {
		var et = event.target;
		if(!("getAttribute" in et))
			return;
		var edt = et.getAttribute("cbbeditable");
		if(edt == "menuitem" || edt == "button") {
			var but = event.button, ctrl = event.ctrlKey, shift = event.shiftKey, alt = event.altKey;
			if(but == 0) // left-click => paste by oncommand
				event.stopPropagation(); // stop "click"
			else
				if(
					(but == 2 && !ctrl && !shift && !alt) || // right-click => settings
					(but == 2 && ctrl && !shift && !alt)
				)
					event.preventDefault(); // stop other handlers (does not work in Linux...)
		}
	}
};

window.addEventListener("load", custombb.init, false);