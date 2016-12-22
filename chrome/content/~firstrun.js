var custombbFirstrun = {

	convert: function() {
		window.removeEventListener("load", custombbFirstrun.convert, false);

		var pSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);

		var gSep = custombbCommon.prefs.gSep;
		var sep = custombbCommon.prefs.sep;

		var getNewSmileyPref = function(smt) {
			var def = true;
			var res = [];

			for(var i = 1; i <= 20; i++) {
				var ins = "custombb.smile." + smt + "." + i + ".ins";
				var src = "custombb.smile." + smt + "." + i + ".src";

				var insv = nsPreferences.copyUnicharPref(ins, "");
				var srcv = nsPreferences.copyUnicharPref(src, "");

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
			nsPreferences.setUnicharPref("custombb.smileysCodes", scPref);

		var suPref = getNewSmileyPref("url");
		if(suPref)
			nsPreferences.setUnicharPref("custombb.smileysURLs", suPref);

		var getNewCustomPref = function(b, n) {
			var ncp = "";
			var def = true;
			var res = [];

			for(var i = 1; i <= n; i++) {		// "custombb.custom.1"
				var ins = "custombb.custom." + b + i;
				var src = "custombb.custom." + b + i + ".src";

				var insv = nsPreferences.copyUnicharPref(ins, "");
				var srcv = nsPreferences.copyUnicharPref(src, "");

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
			nsPreferences.setUnicharPref("custombb.customs", cPref);

		var cbPref = getNewCustomPref("b", 5);
		if(cbPref)
			nsPreferences.setUnicharPref("custombb.customButtons", cbPref);

		function newCharId(pId, newpId) {
			var idArr = [".main", ".locale"];
			for(var i = 0; i < idArr.length; i++) {
				var cpId = "custombb.key." + pId + idArr[i];
				var pVal = nsPreferences.copyUnicharPref(cpId, "");
				if(pVal)
					nsPreferences.setUnicharPref("custombb.key." + newpId + idArr[i], pVal);
				pSvc.deleteBranch(cpId);
			}
		}
		newCharId("inv_commas", "invCommas");
		newCharId("show_toolbar", "showToolbar");

		var pArr = ["color", "size", "font", "symbol"];
		for(var i = 0; i < pArr.length; i++) {
			var id = "custombb." + pArr[i] + "s";
			var cPref = nsPreferences.copyUnicharPref(id, "");
			var nPref = cPref.replace(/^[a-z]+\d+=\{/i, "")
				.replace(/\}$/, "")
				.replace(RegExp("\\} +" + pArr[i] + "\\d+=\\{", "ig"), gSep)
				.replace(/\} +[a-z]+\d+=\{/ig, sep);

			nsPreferences.setUnicharPref(id, nPref);
		}

		pSvc.deleteBranch("custombb.tempReplaceCache");
		pSvc.deleteBranch("custombb.profileDir");

		nsPreferences.setBoolPref("custombb.firstRun", false);
	}
};
if(nsPreferences.getBoolPref("custombb.firstRun", false))
	window.addEventListener("load", custombbFirstrun.convert, false);