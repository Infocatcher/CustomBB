var custombbCmmSet = {

	toDefault: function(pId){
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		if(prefs.prefHasUserValue(pId))
			prefs.clearUserPref(pId);
	},

	createNumPopup: function(mp, id, num) {
		var cc = custombbCommon;

		var n = num
			? num
			: nsPreferences.getIntPref("custombb." + id + "Quantity", 15);

		var pId = num
			? "customButtons"
			: id;

		var pServ = cc.prefs;
		pServ.init(pId);

		var cSrc = mp.getAttribute("cbb_current_src");
		var nSrc = pServ.src;
		var cNums = mp.getAttribute("cbb_current_num");
		if(!cSrc || nSrc != cSrc || n != cNums) {

			cc.erasePopup(mp);
			cc.setAttributes(mp, {
				cbb_current_src: nSrc,
				cbb_current_num: n
			});
			var crop = /smileysURL/.test(pId)
				? "center"
				: null;
			var sm = /smileys/.test(pId);
			var clr = /color/.test(pId);

			for(var i = 1; i <= n; i++) {
				var mi = document.createElement("menuitem");

				var lbl = i + ". ";
				lbl += sm
					? pServ.getAttr("smiley", i)
					: pServ.getAttr("label", i);

				if(clr) {
					mi.style.color = pServ.getAttr("color", i);
					var clss = pServ.getAttr("style", i);
					mi.className = clss == "black" || clss == "white"
						? "custombb-bg-" + clss
						: '';
				}
				cc.setAttributes(mi, {
					value: i,
					label: lbl,
					tooltiptext: lbl,
					crop: crop
				});
				mp.appendChild(mi);
			}
		}
		var sel = parseInt(mp.parentNode.value) - 1;
		var mis = mp.getElementsByTagName("menuitem");
		for(var i = 0; i < mis.length; i++) {
			var mi = mis[i];
			var clss = mi.className.replace(/ *custombb-selected-item */, "");
			if(i == sel)
				mi.className = clss + " custombb-selected-item";
			else
				mi.className = clss;
		}
	},

	get wm() {
		delete this.wm;
		return this.wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
	},

	execInMainWindow: function(func) {
		var mw = this.wm.getMostRecentWindow("navigator:browser");
		if(mw)
			return func(mw);
		Components.utils.reportError("[CustomBB]: can't find main window");
		return null;
	},

	execInAllWindows: function(func) { // Thanks to Firefox Showcase!
		var wm = this.wm;
		var ws = wm.getEnumerator("navigator:browser");

		while(ws.hasMoreElements())
			func(ws.getNext());
	},

	textToRegExp: function(str, strict) {
		var reMask = /^\/(.*)\/([img]{0,3})$/;
		var re = str, flgs = "g";
		if(reMask.test(str)) {
			var res = str.match(reMask);
			re = res[1];
			flgs = res[2];
			// test "iii"
		}
		else {
			re = re
				.replace(/\\/g, "\\\\")
				.replace(/\//g, "\\/")
				.replace(/\n/g, "\\n")
				.replace(/\t/g, "\\t")
				.replace(/\r/g, "\\r")
				.replace(/\./g, "\\.")
				.replace(/\$/g, "\\$")
				.replace(/\^/g, "\\^")
				.replace(/\(/g, "\\(")
				.replace(/\)/g, "\\)")
				.replace(/\{/g, "\\{")
				.replace(/\}/g, "\\}")
				.replace(/\[/g, "\\[")
				.replace(/\]/g, "\\]")
				.replace(/\|/g, "\\|")
				.replace(/\+/g, "\\+");

			re = strict
				? re
					.replace(/\*/g, "\\*")
					.replace(/\?/g, "\\?")
				: re
					.replace(/([^\\])\*/g, "$1.*")
					.replace(/\\{2}\*/g, "\\*")
					.replace(/([^\\])\?/g, "$1.")
					.replace(/\\{2}\?/g, "\\?");
		}
		return new RegExp(re, flgs);
	}
};