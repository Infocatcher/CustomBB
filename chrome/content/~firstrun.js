var custombbFirstrun = {

	convert: function() {
		window.removeEventListener("load", custombbFirstrun.convert, false);

		var pSvc = custombbPrefs.prefs;

		var gSep = custombbCommon.prefs.gSep;
		var sep = custombbCommon.prefs.sep;

		var getNewSmileyPref = function(smt) {
			var def = true;
			var res = [];

			for(var i = 1; i <= 20; i++) {
				var ins = "custombb.smile." + smt + "." + i + ".ins";
				var src = "custombb.smile." + smt + "." + i + ".src";

				var insv = custombbPrefs.getPref(ins, "");
				var srcv = custombbPrefs.getPref(src, "");

				if(insv || srcv)
					def = false;

				res.push(insv + sep + srcv);

				pSvc.deleteBranch(ins);
				pSvc.deleteBranch(src);
			}
			return def ? null : res.join(gSep);
		}
		var scPref = getNewSmileyPref("code");
		if(scPref)
			custombbPrefs.setPref("custombb.smileysCodes", scPref);

		var suPref = getNewSmileyPref("url");
		if(suPref)
			custombbPrefs.setPref("custombb.smileysURLs", suPref);

		var getNewCustomPref = function(b, n) {
			var ncp = "";
			var def = true;
			var res = [];

			for(var i = 1; i <= n; i++) {		// "custombb.custom.1"
				var ins = "custombb.custom." + b + i;
				var src = "custombb.custom." + b + i + ".src";

				var insv = custombbPrefs.getPref(ins, "");
				var srcv = custombbPrefs.getPref(src, "");

				if(insv || srcv)
					def = false;

				var ot = /opentag=\{.*\}/i.test(insv)
					? insv.replace(/^.*opentag=\{/i, "").replace(/\}([^\}]?(closetag|label)=\{.*$|$)/i, "")
					: "";
				var ct = /closetag=\{.*\}/i.test(insv)
					? insv.replace(/^.*closetag=\{/i, "").replace(/\}([^\}]?(opentag|label)=\{.*$|$)/i, "")
					: "";
				var lb = /label=\{.*\}/i.test(insv)
					? insv.replace(/^.*label=\{/i, "").replace(/\}([^\}]?(opentag|closetag)=\{.*$|$)/i, "")
					: "";

				res.push(ot + sep + ct + sep + lb + sep + srcv);

				pSvc.deleteBranch(ins);
				pSvc.deleteBranch(src);
			}
			return def ? null : res.join(gSep);
		}

		var cPref = getNewCustomPref("", 20);
		if(cPref)
			custombbPrefs.setPref("custombb.customs", cPref);

		var cbPref = getNewCustomPref("b", 5);
		if(cbPref)
			custombbPrefs.setPref("custombb.customButtons", cbPref);

		function newCharId(pId, newpId) {
			var idArr = [".main", ".locale"];
			for(var i = 0; i < idArr.length; i++) {
				var cpId = "custombb.key." + pId + idArr[i];
				var pVal = custombbPrefs.getPref(cpId, "");
				if(pVal)
					custombbPrefs.setPref("custombb.key." + newpId + idArr[i], pVal);
				pSvc.deleteBranch(cpId);
			}
		}
		newCharId("inv_commas", "invCommas");
		newCharId("show_toolbar", "showToolbar");

		var pArr = ["color", "size", "font", "symbol"];
		for(var i = 0; i < pArr.length; i++) {
			var id = "custombb." + pArr[i] + "s";
			var cPref = custombbPrefs.getPref(id, "");
			var nPref = cPref.replace(/^[a-z]+\d+=\{/i, "")
				.replace(/\}$/, "")
				.replace(RegExp("\\} +" + pArr[i] + "\\d+=\\{", "ig"), gSep)
				.replace(/\} +[a-z]+\d+=\{/ig, sep);

			custombbPrefs.setPref(id, nPref);
		}

		pSvc.deleteBranch("custombb.tempReplaceCache");
		pSvc.deleteBranch("custombb.profileDir");

		custombbPrefs.setPref("custombb.firstRun", false);
	}
};
if(custombbPrefs.getPref("custombb.firstRun", false))
	window.addEventListener("load", custombbFirstrun.convert, false);