var custombbEdit = {

	textToColor: function() {
		var color = document.getElementById("custombb.colorEditor.color").value;
		color = custombbCommon.repairColor(color);
		var cp = document.getElementById("custombb.colorEditor.colorpicker");
		
		if(color)		
			cp.color = color;
		else
			cp.removeAttribute("color");

		this.setColorExStyle();
	},

	colorToText: function(color) {
		document.getElementById("custombb.colorEditor.color").value = color;
		custombbEdit.setColorExStyle();
	},

	setColorExStyle: function() {
		var color = document.getElementById("custombb.colorEditor.colorpicker").color;
		var style = document.getElementById("custombb.colorEditor.style").value;

		style = custombbCommon.repairColorStyle(color, style);

		document.getElementById("custombb.colorEditor.example").setAttribute("style", style);
	},

	textToImg: function() {
		var i = window.arguments[0];
		var type = window.arguments[1];		// 'smile-url' || 'custom'

		var src = nsPreferences.copyUnicharPref("custombb." + type.replace(/-/, ".") + "." + i + ".src", "");
		var img = "custombb." + type.replace(/-.*$/, "") + "Editor.img";

		var srcNew = document.getElementById(img.replace(/img$/, "src")).value;

		document.getElementById(img).setAttribute("src", custombbCommon.testPatch(srcNew));

		var srcNewP = custombbCommon.testPatch(srcNew);
		var srcP = custombbCommon.testPatch(src);

		if( srcNewP != srcP || (srcNewP == srcP && srcNew.match(/^%profile%/i) && !src.match(/^%profile%/i)) ) {
			document.getElementById(img).setAttribute("class", "custombb-notsaved");
			var strbundle = document.getElementById("custombb-strings");
			var notSaved=strbundle.getString("imageNotSaved");
			document.getElementById(img).setAttribute("tooltiptext", notSaved);
		}
		else {
			document.getElementById(img).removeAttribute("class");
			document.getElementById(img).removeAttribute("tooltiptext");
		}
	},

	repairSize: function() {
		var size = document.getElementById("custombb.sizeEditor.styleSize").value;
		size = size.replace(/,/g, ".");

		while(size.replace(/\./, "").match(/\./))
			size = size.replace(/\./, "");

		size = size.replace(/[^\d\.]/g, "");
		document.getElementById("custombb.sizeEditor.styleSize").value = size;
	},

	textToSize: function() {
		var size = document.getElementById("custombb.sizeEditor.styleSize").value.replace(/^['"]*/, "").replace(/['"]*$/, "")
				+ document.getElementById("custombb.sizeEditor.styleType").value;

		size = custombbCommon.repairSizeStyle(size);

		document.getElementById("custombb.sizeEditor.example").setAttribute("style", size);
	},

	convertSize:  function() {
		var size = document.getElementById("custombb.sizeEditor.styleSize").value;
		var oldUnit = document.getElementById("custombb.sizeEditor.example").getAttribute("style").replace(/^font-size: *[\d\.,]*/, "").replace(/ *;$/, "");
		var newUnit = document.getElementById("custombb.sizeEditor.styleType").value;

		switch(oldUnit) {
			case 'pt': size /= 8.25; break;
			case '%' : size /= 100;	 break;
			case 'px': size /= 11;	 break;
			case 'em': size /= 1;	 break;
		}

	//	alert("old unit = [" + oldUnit + "]\nnew unit = [" + newUnit + "]\nold abs size = " + size);

		switch(newUnit) {
			case 'pt': size *= 8.25; break;
			case '%' : size *= 100;	 break;
			case 'px': size *= 11;	 break;
			case 'em': size *= 1;	 break;
		}

		document.getElementById("custombb.sizeEditor.styleSize").value = size;
	},

	textToFont: function() {
		var font = document.getElementById("custombb.fontEditor.font").value;
		font = custombbCommon.repairFontStyle(font);

		document.getElementById("custombb.fontEditor.example").setAttribute("style", font);
	},

	loadImg: function() {
		var url = document.getElementById("custombb.smileEditor.ins").value;
	//	if(url.match(/^(https?|file):\/\//i)) {		// test
		if(url.match(/^https?:\/\//i)) {
			document.getElementById("custombb-loadSmile-error").hidden = true;
			document.getElementById("custombb-loadSmile-img").hidden = false;
			document.getElementById("custombb-loadSmile-img").setAttribute("src", url);
		}
		else {
			document.getElementById("custombb-loadSmile-error").hidden = false;
			document.getElementById("custombb-loadSmile-img").hidden = true;
		}
	}
};