var custombbPrefs = {
	get prefs() {
		delete this.prefs;
		return this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
           .getService(Components.interfaces.nsIPrefService)
           .QueryInterface(Components.interfaces.nsIPrefBranch2 || Components.interfaces.nsIPrefBranch);
	},
	getPref: function(pName, defaultVal, prefBranch) {
		var ps = prefBranch || this.prefs;
		switch(ps.getPrefType(pName)) {
			case ps.PREF_BOOL:   return ps.getBoolPref(pName);
			case ps.PREF_INT:    return ps.getIntPref(pName);
			case ps.PREF_STRING: return ps.getComplexValue(pName, Components.interfaces.nsISupportsString).data;
		}
		return defaultVal;
	},
	setPref: function(pName, val, prefBranch) {
		var ps = prefBranch || this.prefs;
		var pType = ps.getPrefType(pName);
		if(pType == ps.PREF_INVALID)
			pType = this.getValueType(val);
		switch(pType) {
			case ps.PREF_BOOL:   ps.setBoolPref(pName, val); break;
			case ps.PREF_INT:    ps.setIntPref(pName, val);  break;
			case ps.PREF_STRING:
				var ss = Components.interfaces.nsISupportsString;
				var str = Components.classes["@mozilla.org/supports-string;1"]
					.createInstance(ss);
				str.data = val;
				ps.setComplexValue(pName, ss, str);
		}
		return this;
	},
	getValueType: function(val) {
		switch(typeof val) {
			case "boolean": return this.prefs.PREF_BOOL;
			case "number":  return this.prefs.PREF_INT;
		}
		return this.prefs.PREF_STRING;
	}
};