var custombbCommon = {

	testPatch: function(patch) {
		if(patch.match(/^%profile%/i))		// %profile%/dir/... => file://.../dir/...
			patch = nsPreferences.copyUnicharPref("custombb.profileDir", "") + patch.replace(/^%profile%/i, "");
		return patch;
	},

	cutPref: function(prefSource, prefType, N) {
		var pref = prefSource.match(RegExp(prefType + N + "=\\{.*\\}", "i"), "")
			? prefSource.replace(RegExp("^.*" + prefType + N + "=\\{", "i"), "").replace(/\}([^\}]?(color|symbol|font|size|label|style)\d{1,2}=\{.*$|$)/i, "")
			: "";

		return pref;
	},

	repairColor: function(c) {
		c = c.replace(/^['"]*/, "").replace(/['"]*$/, "");

		if( !c.match(/^(#?([a-f0-9]{3}|[a-f0-9]{6})|[a-z]{2,20})$/i) && !c.match(/rgb *\(\d{1,3}, *\d{1,3}, *\d{1,3}\)/i) )
			c = "";
		else
			if(c.match(/^([a-f0-9]{3}|[a-f0-9]{6})$/i))
				c = "#" + c;

		return c;
	},

	repairColorStyle: function(c, s) {
		s = s.match(/^(black|white)$/)
			? "background-image: url(chrome://custombb/skin/img/back_" + s + ".png); -moz-appearance: none !important;"
			: "";

		if(c)
			s = "color: " + c + "; " + s;

		return s;
	},

	repairSizeStyle: function(s) {
		s = s.match( /^\d+(\.\d+)?(px|pt|em|%)$/ )
			? "font-size: " + s + ";"
			: "";

		return s;
	},

	repairFontStyle: function(f) {
		f = f.replace(/^['"]*/, "").replace(/['"]*$/, "");

		f = f.match( /[a-z ]+/i )		// ??? other RegExp ???
			? "font-family: " + f + ";"
			: "";

		return f;
	},
};