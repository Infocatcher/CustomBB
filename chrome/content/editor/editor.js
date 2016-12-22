var custombbEdit = {

	init: function() {
		this.settings("load");
		this.initDigitTextboxes();
		this.addListScroll();
		this.initImgs();

		window.addEventListener("input",    custombbEdit.testAll, false);
		window.addEventListener("command",  custombbEdit.testAll, false);
		window.addEventListener("dragexit", custombbEdit.testAll, false);
		window.addEventListener("select",   custombbEdit.testAll, false);

		document.documentElement.getButton("extra1").setAttribute("tooltiptext", "Ctrl+S");
	},

	destroy: function() {
		window.removeEventListener("input",    custombbEdit.testAll, false);
		window.removeEventListener("command",  custombbEdit.testAll, false);
		window.removeEventListener("dragexit", custombbEdit.testAll, false);
		window.removeEventListener("select",   custombbEdit.testAll, false);
	},

	testAll: function() {
		custombbEdit.checkAll(false);
	},

	checkAll: function(copy) {
		var all = document.getElementsByTagName("*");
		var dis = true;
		var okIts = /^(textbox|menulist|checkbox)$/;

		for(var i = 0; i < all.length; i++) {
			var it = all[i];
			var tn = it.tagName;

			if(okIts.test(tn)) {
				if(typeof it.value != "undefined") {
					if(copy)
						it.setAttribute("saved_value", it.value)
					else
						if(it.value != it.getAttribute("saved_value"))
							dis = false;
				}
				if(typeof it.checked != "undefined") {	// ???
					if(copy)
						it.setAttribute("saved_checked", it.checked)
					else
						if(it.checked.toString() != it.getAttribute("saved_checked"))
							dis = false;
				}
			}
		}
		this.disApply(dis);
	},

	disApply: function(dis) {
		var apply = document.documentElement.getButton("extra1");
		apply.disabled = dis;
	},

	initDigitTextboxes: function() {
		var tbs = document.getElementsByTagName("textbox");

		for(var i = 0, l = tbs.length; i < l; i++) {
			var tb = tbs[i];

			if(tb.hasAttribute("cbbnumbers")) {
				var cmd = "custombbEdit.digitsOnly(this";
				cmd += tb.getAttribute("cbbnumbers") == "int"
					? ", true);"
					: "); custombbEdit.textToSize();";

				custombbCommon.setAttributes(tb, {
					oninput: cmd,
					ondragexit: cmd
				});
			}
		}
	},

	digitsOnly: function(tb, _int) {
		var val = tb.value;

		if(_int)
			val = val.replace(/\D/g, "");
		else {
			val = val.replace(/,/g, ".");

			while(val.replace(/\./, "").match(/\./))
				val = val.replace(/\./, "");

			val = val.replace(/[^\d\.]/g, "");
		}
		val = val.replace(/^0+/, "0");
		tb.value = val;
	},

	addListScroll: function() {
		var txt = custombbCommon.getLocalised("listScroll");

		var mls = document.getElementsByTagName("menulist");
		for(var i = 0; i < mls.length; i++) {
			var ml = mls[i];
			ml.addEventListener("DOMMouseScroll", custombbEdit.listScroll, false);

			var ntt = ml.hasAttribute("tooltiptext")
				? ml.getAttribute("tooltiptext") + " (" + txt + ")"
				: txt;
			ml.setAttribute("tooltiptext", ntt);
		}
	},

	listScroll: function(event) {
		var ml = event.target;
		if(ml.tagName != "menulist") {
			var ml = ml.parentNode.parentNode;
			if(ml.tagName != "menulist")
				return;
		}
		var mp = ml.firstChild;

		var sDir = event.detail > 0
			? 1
			: -1;

		var cVal = ml.value;
		var dig = /^\d+$/.test(cVal);

		if(dig) {
			var maxId = window.arguments[1];
			var max = null;
			switch(maxId) {
				case "custom-b":
					max = 5;
				break;
				case "smiley-code":
					maxId = "smileysCode";
				break;
				case "smiley-url":
					maxId = "smileysURL";
			}
			if(!max)
				max = custombbPrefs.getPref("custombb." + maxId + "sQuantity", 10);

			var nVal = parseInt(cVal);
			if(sDir == 1)
				if(nVal == max)
					nVal = 1;
				else
					nVal++;
			else
				if(nVal == 1)
					nVal = max;
				else
					nVal--;
		}
		else {
			var mis = ml.getElementsByTagName("menuitem");
			var nIt, it;

			for(var i = 0; i < mis.length; i++) {
				var mi = mis[i];
				if(mi.value == cVal) {
					it = mi;
					break;
				}
			}
			if(!it)
				return;

			nIt = sDir == 1
				? it == mp.lastChild
					? mp.firstChild
					: it.nextSibling
				: it == mp.firstChild
					? mp.lastChild
					: it.previousSibling;

			var nVal = nIt.value;
		}
		ml.value = nVal;
		if(dig)
			ml.setAttribute("label", nVal);
		//ml.firstChild.hidePopup();

		ml.doCommand();
		if(!("open" in ml) || ml.open) {
			var event = document.createEvent("Events");
			event.initEvent("popupshowing", true, false);
			mp.dispatchEvent(event);

			ml.menuBoxObject.activeChild = ml.mSelectedInternal || ml.selectedInternal;
		}

		custombbEdit.checkAll(false);
	},

	setLoad: function(ml) {
		var val = ml.value;
		ml.setAttribute("label", val);
		this.settings("load", val);
	},

	settings: function(mode, cnum) {	// custom num
		switch(mode) {
			case "load":    var load = true;  break;
 			case "save":    var save = true;  break;
 			case "apply":   var apply = true; break;
			case "default": var def = true;   break;
 			default: alert("Invalid mode: " + mode); break;
		}

		var num = window.arguments[0];
		if(cnum) {
			num = parseInt(cnum);
			window.arguments[0] = num;
		}

		var tp = window.arguments[1];
		var pId = window.arguments[2];

		var pServ = custombbCommon.prefs;
		pServ.init(pId, true);
		var pObj = pServ.getAll();

		if(pObj.nums < num) {
			num = pObj.nums;
			window.arguments[0] = num;
		}

		if(load || save || apply) {
			var qId, qpId;
			switch(tp) {
				case "color":
				case "size":
				case "font":
				case "symbol":
				case "custom":
					qId = tp;
					qpId = tp;
				break;
				case "smiley-code":
				case "smiley-url":
					qId = "smiley";

					qpId = tp == "smiley-code"
						? "smileysCode"
						: "smileysURL";

					var colsIt = document.getElementById("custombb-smileyEditor-columns");
					var colsPref = "custombb." + qpId + "sColumns";
				break;
				case "custom-b":
					var cbNum = 5;
					qId = "custom";
			}
			var keyIt = document.getElementById("custombb-" + tp + "Editor-key");
			var keyId = "custombb.key." + tp;
		}

		if(load) {
			switch(tp) {
				case "color":
					var stl = pObj[num - 1][2];
					if(!/^(black|white)$/.test(stl))
						stl = "none";

					document.getElementById("custombb-colorEditor-color").value = pObj[num - 1][0];
					document.getElementById("custombb-colorEditor-label").value = pObj[num - 1][1];
					document.getElementById("custombb-colorEditor-style").value = stl;

					this.textToColor();
				break;

				case "size":
					var stl = pObj[num - 1][2];
					var stlNum = stl.replace(/[^\d\.]+/g, "");
					var stlTp = stl.replace(/[\d\.]+/g, "");

					if(!/^(px|pt|em|%)$/.test(stlTp))
						stlTp = "px";

					document.getElementById("custombb-sizeEditor-size").value = pObj[num - 1][0];
					document.getElementById("custombb-sizeEditor-label").value = pObj[num - 1][1];
					document.getElementById("custombb-sizeEditor-styleSize").value = stlNum;
					document.getElementById("custombb-sizeEditor-styleType").value = stlTp;

					this.textToSize();
				break;

				case "font":
					document.getElementById("custombb-fontEditor-font").value = pObj[num - 1][0];
					document.getElementById("custombb-fontEditor-label").value = pObj[num - 1][1];

					this.textToFont();
				break;

				case "symbol":
					document.getElementById("custombb-symbolEditor-symbol").value = pObj[num - 1][0];
					document.getElementById("custombb-symbolEditor-label").value = pObj[num - 1][1];
				break;

				case "smiley-code":
					document.getElementById("custombb-smileyEditor-preview").hidden = true;
					var numL = document.getElementById("custombb-smileyEditor-num");
					numL.setAttribute("width", "120px");
					numL.removeAttribute("flex");
				case "smiley-url":
					document.getElementById("custombb-smileyEditor-ins").value = pObj[num - 1][0];
					document.getElementById("custombb-smileyEditor-src").value = pObj[num - 1][1];

					colsIt.value = custombbPrefs.getPref(colsPref, 4);

					var hasImg = true;
				break;

				case "custom":
				case "custom-b":
					document.getElementById("custombb-customEditor-top").value = pObj[num - 1][0];
					document.getElementById("custombb-customEditor-tcl").value = pObj[num - 1][1];
					document.getElementById("custombb-customEditor-lbl").value = pObj[num - 1][2];
					document.getElementById("custombb-customEditor-src").value = pObj[num - 1][3];

					document.getElementById("custombb-customEditor-quantityBox").hidden = tp == "custom-b";

					var hasImg = true;
				break;
			}
			var q = custombbPrefs.getPref("custombb." + qpId + "sQuantity", 15);
			if(!cbNum)
				document.getElementById("custombb-" + qId + "Editor-quantity").value = q;

			var numIt = document.getElementById("custombb-" + qId + "Editor-num");
			numIt.value = num;
			numIt.setAttribute("label", num);


			if(keyIt) {
				var keyVal = custombbPrefs.getPref(keyId, 1);
				keyIt.checked = keyVal == num;
				if(tp == "custom")
					keyIt.removeAttribute("hidden");
			}
		}
		if(save || apply) {
			switch(tp) {
				case "color":
					pObj[num - 1][0] = document.getElementById("custombb-colorEditor-color").value;
					pObj[num - 1][1] = document.getElementById("custombb-colorEditor-label").value;
					pObj[num - 1][2] = document.getElementById("custombb-colorEditor-style").value;
				break;

				case "size":
					pObj[num - 1][0] = document.getElementById("custombb-sizeEditor-size").value;
					pObj[num - 1][1] = document.getElementById("custombb-sizeEditor-label").value;
					pObj[num - 1][2] = document.getElementById("custombb-sizeEditor-styleSize").value +
						document.getElementById("custombb-sizeEditor-styleType").value;
				break;

				case "font":
					pObj[num - 1][0] = document.getElementById("custombb-fontEditor-font").value;
					pObj[num - 1][1] = document.getElementById("custombb-fontEditor-label").value;
				break;

				case "symbol":
					pObj[num - 1][0] = document.getElementById("custombb-symbolEditor-symbol").value;
					pObj[num - 1][1] = document.getElementById("custombb-symbolEditor-label").value;
				break;

				case "smiley-code":
				case "smiley-url":
					pObj[num - 1][0] = document.getElementById("custombb-smileyEditor-ins").value;
					pObj[num - 1][1] = this.repairSrc(document.getElementById("custombb-smileyEditor-src").value);

					var cols = parseInt(colsIt.value);
					if(!cols || cols == 0) cols = 4;
					custombbPrefs.setPref(colsPref, cols);
				break;

				case "custom-b":
				case "custom":
					pObj[num - 1][0] = document.getElementById("custombb-customEditor-top").value;
					pObj[num - 1][1] = document.getElementById("custombb-customEditor-tcl").value;
					pObj[num - 1][2] = document.getElementById("custombb-customEditor-lbl").value;
					pObj[num - 1][3] = this.repairSrc(document.getElementById("custombb-customEditor-src").value);
				break;
			}

			if(!cbNum) {
				var q = parseInt(document.getElementById("custombb-" + qId + "Editor-quantity").value);
				if(!q || q == 0) q = 15;

				if(q < num)
					if(confirm(custombbCommon.getLocalised("lossCurrentPrefs")))
						q = pObj.nums;
					else
						var wcl = true;
				else
					if(q < pObj.nums)
						if(confirm(custombbCommon.getLocalised("lossSomePrefs")))
							q = pObj.nums;
						else
							var wcl = true;

				custombbPrefs.setPref("custombb." + qpId + "sQuantity", q);
				pObj.nums = q;
			}
			pServ.setAll(pObj);

			if(keyIt && keyIt.checked)
				custombbPrefs.setPref(keyId, num);

			if(apply)
				this.settings("load");
			else
				if(wcl)
					window.close();
		}

		if(def) {
			custombbCmmSet.toDefault(pServ.srcId);
			pServ.init(pId, true);
			var dpObj = pServ.getAll();

			for(var i = 0; i <= pObj.aNums; i++)
				pObj[num - 1][i] = dpObj[num - 1][i];

			pServ.setAll(pObj);
			this.settings("load");
		}

		if(load) {
			this.disApply(true);
			this.checkAll(true);
			if(hasImg)
				this.textToImg();
		}

		if(save || apply || def)
			if(tp == "custom-b")
				//custombbCmmSet.execInAllWindows("mw.custombb.initCustomItems('button');");
				custombbCmmSet.execInAllWindows(function(w) {
					w.custombb.initCustomItems("button");
				});
			else
				if(tp == "color" || tp == "symbol" || tp == "custom")
					//custombbCmmSet.execInAllWindows("mw.custombb.initKeyCommands();");
					custombbCmmSet.execInAllWindows(function(w) {
						w.custombb.initKeyCommands();
					});
	},

	textToColor: function() {
		var clr = document.getElementById("custombb-colorEditor-color").value;
		clr = custombbCommon.repairStyle.color(clr, true);
		document.getElementById("custombb-colorEditor-colorpicker").color = clr;

		this.setColorExStyle();
	},

	setColorExStyle: function() {
		var clr = document.getElementById("custombb-colorEditor-colorpicker").color;
		var stl = document.getElementById("custombb-colorEditor-style").value;

		var ex = document.getElementById("custombb-colorEditor-example");
		ex.setAttribute("style", custombbCommon.repairStyle.color(clr));
		ex.setAttribute("class", "custombb-bg-" + stl);
	},

	colorToText: function(color) {
		document.getElementById("custombb-colorEditor-color").value = color;
		custombbEdit.setColorExStyle();
	},

	textToSize: function() {
		var size = document.getElementById("custombb-sizeEditor-styleSize").value.replace(/^['"]*/, "").replace(/['"]*$/, "")
				+ document.getElementById("custombb-sizeEditor-styleType").value;

		size = custombbCommon.repairStyle.size(size);

		document.getElementById("custombb-sizeEditor-example").setAttribute("style", size);
	},

	convertSize:  function() {
		var szIt = document.getElementById("custombb-sizeEditor-styleSize");
		var sz = szIt.value;
		var oldUnit = document.getElementById("custombb-sizeEditor-example").getAttribute("style")
			.replace(/^font-size: *[\d\.,]*/, "")
			.replace(/ *;$/, "");
		var newUnit = document.getElementById("custombb-sizeEditor-styleType").value;

		switch(oldUnit) {
			case 'pt': sz /= 8.25; break;
			case '%' : sz /= 100;  break;
			case 'px': sz /= 11;   break;
			case 'em': sz /= 1;
		}
		switch(newUnit) {
			case 'pt': sz *= 8.25; break;
			case '%' : sz *= 100;  break;
			case 'px': sz *= 11;   break;
			case 'em': sz *= 1;
		}

		szIt.value = sz;
		this.textToSize();
	},

	textToFont: function() {
		var fnt = document.getElementById("custombb-fontEditor-font").value;
		fnt = custombbCommon.repairStyle.font(fnt);
		document.getElementById("custombb-fontEditor-example").setAttribute("style", fnt);
	},

	textToImg: function() {
		var tp = window.arguments[1].replace(/-[a-z]+$/, "");
		var imgIt = document.getElementById("custombb-" + tp + "Editor-img");
		var srcIt = document.getElementById("custombb-" + tp + "Editor-src");

		var newSrc = srcIt.value;
		var savedSrc = srcIt.getAttribute("saved_value");

		var newSrcT = this.repairSrc(custombbCommon.testPatch(newSrc));
		var savedSrcT = custombbCommon.testPatch(savedSrc);

		imgIt.setAttribute("src", newSrcT);

		if(newSrcT != savedSrcT || (newSrcT == savedSrcT && /^%profile%/.test(newSrc) && !/^%profile%/.test(savedSrc))) {
			custombbCommon.setAttributes(imgIt, {
				"class": "custombb-not-saved",
				line1: custombbCommon.getLocalised("imageNotSaved")
			});
		}
		else {
			imgIt.removeAttribute("class");
			imgIt.removeAttribute("line1");
		}
		this.startImgResize(imgIt);
	},

	selectImg: function(id) {
			// Thanks to Custom Buttons
		var nsIfp = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIfp);

		fp.init(window, custombbCommon.getLocalised("selectImage"), 0);
		fp.appendFilters(nsIfp.filterImages);
		if(fp.show() == nsIfp.returnOK) {
			var url = unescape(fp.fileURL.spec).replace(/\\/g, "/");
			var pDir = custombbCommon.gProfileDir;
			var pL = pDir.length;
			if(url.substring(0, pL) == pDir)
				url = "%profile%" + url.substring(pL, url.length);

			document.getElementById("custombb-" + id + "-src").value = url;
			this.textToImg();
		}
	},

	repairSrc : function(src) {
		src = src
			.replace(/^\s*/, "")
			.replace(/\s*$/, "")
			.replace(/\\/g, "/");
		if(/^[a-z]:\//i.test(src)) // if(!/^(file|https?|chrome):\/\//.test(src))
			src = "file:///" + src;
		return src;
	},

	fillImgInTooltip: function() {
		var url = document.getElementById("custombb-smileyEditor-ins").value;
		var errIt = document.getElementById("custombb-loadsmiley-error");
		var imgIt = document.getElementById("custombb-loadsmiley-img");

		//var ok = /^(https?|file):\/\//i.test(url);	// test
		var ok = /^https?:\/\//i.test(url);
		errIt.hidden = ok;
		imgIt.hidden = !ok;
		if(ok)
			imgIt.setAttribute("src", url);
	},

	initImgs: function() {
		var imgs = document.getElementsByTagName("image");
		if(!imgs) return;

		for(var i = 0; i < imgs.length; i++)
			imgs[i].setAttribute("onclick", "custombbEdit.startImgResize(this, true);");
	},

	startImgResize: function(img, toggle) {
			// Thanks to CacheViewer
		var rs = img.hasAttribute("cbbresize")
			? img.getAttribute("cbbresize") == "true"
			: false;

		if(toggle) {
			rs = !rs;
			img.setAttribute("cbbresize", rs.toString());
		}
		img.removeAttribute("style");
		img.removeAttribute("line2");
		if(!rs) return;

		setTimeout(function() {custombbEdit.imgResize(img);}, 30);
	},

	imgResize: function(img) {
		var mW = 240, mH = 180; // max

		var width = parseInt(window.getComputedStyle(img, null).width);
		var height = parseInt(window.getComputedStyle(img, null).height);
		var rFl = false; // resize flag

		if(width > mW) {
			var zoomX = mW/width;
			width = mW;
			height = height*zoomX;
			rFl = true;
		}
		if(height > mH) {
			var zoomY = mH/height;
			height = mH;
			width = width*zoomY;
			rFl = true;
		}
		if(rFl) {
			custombbCommon.setAttributes(img, {
				style: "width: " + width + "px; height: " + height + "px;",
				line2: custombbCommon.getLocalised("resizedImage")
			});
		}
	},

	fillInTooltip: function(tt) {
		var L1 = tt.firstChild;
		var L2 = tt.lastChild;

		var dtn = document.tooltipNode;

		var v1 = dtn.getAttribute("line1");
		var v2 = dtn.getAttribute("line2");

		L1.hidden = !v1;
		L1.value = v1;

		L2.hidden = !v2;
		L2.value = v2;

		if(!v1 && !v2)
			return false; // hide tooltip

		return true;
	}
};