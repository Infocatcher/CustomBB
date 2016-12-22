var custombbCommon = {

	gProfileDir: "",

	getLocalised: function(sId) { // Get strings from locale
		return document.getElementById("custombb-strings").getString(sId);
	},

	getProfileDir: function() {
		// thanks to Edit Config Files
		var serv = Components.classes["@mozilla.org/file/directory_service;1"]
			.getService(Components.interfaces.nsIProperties);
		var path = "file:///" + serv.get("ProfD", Components.interfaces.nsIFile).path.replace(/\\/g, "/");
		this.gProfileDir = path;
		return path;
	},

	testPatch: function(patch) {
		return patch.replace(/^%profile%/i, this.gProfileDir || this.getProfileDir());
	},

	prefs: {
		pId: null,
		srcId: null,
		src: null,
		aNums: null,
		nums: null,
		gSep: "-}|@|{-",
		sep: "-}||{-",
		init: function(src, initNums) {
			this.pId = src;
			var srcId = "custombb." + src;
			this.srcId = srcId;
			this.src = nsPreferences.copyUnicharPref(srcId, "");

			if(initNums)
				this.initNums(src);
		},
		initNums: function(src) {
			var aNums, types;
			switch(src) {
				case "colors":
				case "sizes":
					aNums = 2;
				break;
				case "fonts":
				case "symbols":
				case "smileysCodes":
				case "smileysURLs":
					aNums = 1;
				break;
				case "customButtons":
					var q = 5;
				case "customs":
					aNums = 3;
				break;
				default:
					alert("prefs.initNums(src):\ninvalid src (" + src + ")");
			}
			this.aNums = aNums;
			this.nums = q ? q : nsPreferences.getIntPref(this.srcId + "Quantity", 1);
			this.cols = nsPreferences.getIntPref(this.srcId + "Columns", 1);
		},
		getAttr: function(attr, num) {
			var pId = this.pId;
			var attrs = [];
			var aNum = -1;
			switch(pId) {
				case "colors":
					attrs = ["color", "label", "style"];
				break;
				case "sizes":
					attrs = ["size", "label", "style"];
				break;
				case "fonts":
					attrs = ["font", "label"];
				break;
				case "symbols":
					attrs = ["symbol", "label"];
				break;
				case "smileysCodes":
				case "smileysURLs":
					attrs = ["smiley", "image"];
				break;
				case "customs":
				case "customButtons":
					attrs = ["openTag", "closeTag", "label", "image"];
				break;
				default:
					alert("prefs.getANum(type, attr) invalid pId:\n" + pId);
				break;
			}
			for(var i = 0; i < attrs.length && !complete; i++)
				if(attr == attrs[i]) {
					aNum = i;
					var complete = true;
				}
			if(aNum < 0) {
				alert("prefs.getAttr(attr, num):\naNum not found (" + aNum + ")\nattr = " + attr + "\npId = " + pId + "\nnum = " + num);
				return "";
			}
			return this.get(aNum, num);
		},
		get: function(aNum, num) {
			var aVal = "";
			var gPrefs = this.src.split(this.gSep);
			if(gPrefs.length >= num) {
				var prefs = gPrefs[num - 1].split(this.sep);
				if(prefs.length > aNum)
					var aVal = prefs[aNum];
			}
			return aVal;
		},
		pushAdd: function(arr, add) {
			if(add > 0)
				for(var i = 1; i <= add; i++)
					arr.push("");
			else
				for(var i = 1; i <= -add; i++)
					arr.pop();

			return arr;
		},
		getAll: function() {
			var res = {};
			var aNums = this.aNums;
			var nums = this.nums;
			var gPrefs = this.src.split(this.gSep);
			gPrefs = this.pushAdd(gPrefs, nums - gPrefs.length);
			for(var i = 0; i < nums; i++) {
				var p = gPrefs[i].split(this.sep);
				res[i] = this.pushAdd(p, aNums + 1 - p.length);
			}
			res.aNums = aNums;
			res.nums = nums;
			return res;
		},
		setAll: function(pObj) { // set new nums before call!
			var aNums = pObj.aNums;
			var nums = pObj.nums;
			var pref = [];
			for(var i = 0; i < nums; i++) {
				var prefs = pObj[i];
				if(!prefs)
					prefs = new Array(aNums + 1);
				else
					if(prefs.length < aNums + 1)
						prefs = this.pushAdd(prefs, aNums + 1 - prefs.length);
				pref.push(prefs.join(this.sep));
			}
			nsPreferences.setUnicharPref(this.srcId, pref.join(this.gSep));
		},
		swap: function(oldNum, newNum) {
			var pObj = this.getAll();
			for(var i = 0; i <= pObj.aNums; i++) {
				var tmp = pObj[oldNum - 1][i];
				pObj[oldNum - 1][i] = pObj[newNum - 1][i];
				pObj[newNum - 1][i] = tmp;
			}
			this.setAll(pObj);
		}
	},

	erasePopup: function(it) {
		while(it.hasChildNodes())
			it.removeChild(it.firstChild);
	},

	setAttributes: function(node, attrs) {
		for(var attr in attrs) if(attrs.hasOwnProperty(attr)) {
			var val = attrs[attr];
			if(val)
				node.setAttribute(attr, val);
			else
				node.removeAttribute(attr);
		}
	},

	repairStyle: {
		trim: function(str, trimCommas) {
			str = str.replace(/^\s+|\s+$/g, "");
			if(trimCommas)
				return str.replace(/^['"]|['"]$/g, "");
			return str;
		},

		color: function(clr, noCSS) {
			clr = this.trim(clr, true);

			if(!/^#?([a-f0-9]{3}|[a-f0-9]{6})$/i.test(clr) &&
			   !/^rgb\(\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\)$/i.test(clr) &&
			   !/^[a-z]{3,}$/i.test(clr) &&
			   !/^-moz-[a-z]+$/i.test(clr))
				clr = "";
			else
				if(/^([a-f0-9]{3}|[a-f0-9]{6})$/i.test(clr))
					clr = "#" + clr;

			if(noCSS)
				return clr ? clr : "-moz-Dialog";

			return "color: " + (!clr || clr == "-moz-Dialog" ? "-moz-DialogText" : clr) + ";";
		},
		size: function(sz) {
			sz = sz.replace(/\s*/g, "");
			return /^\d+(\.\d+)?(px|pt|em|%)$/.test(sz)
				? "font-size: " + sz + ";"
				: "";
		},
		font: function(fnt) {
			fnt = this.trim(fnt, true);
			return /[a-z ]+/i.test(fnt)		// ??? try other RegExp ???
				? "font-family: " + fnt + ";"
				: "";
		}
	},

	addToArr: function(add, arr) {
		for(var i = 0; i < arr.length; i++)
			arr[i] = "custombb." + add + arr[i];

		return arr;
	}
};