(function() {
// Rewritten from old unsafe version, this is simplest way to make all thing looks like from <iframe>
var _window = top;
var _document = top.document;

var parent = _window;
var _args = _window.arguments[0];
var updTime = _args.time;
var updTimeout;
var customCSS = [];
var warnFlag = false;

var window, document;

var preview = _window.preview = {
	init: init,
	destroy: destroy,
	setColors: setColors,
	click: function(e) {
		var trg = e.target;
		if(trg.id == "toggleRes")
			toggleStat(false);
		else
			setColors(e);
	}
};

function init(event) {
	var frame = preview.frame = _document.getElementById("prevFrame");
	window = frame.contentWindow;
	document = frame.contentDocument;

	prev();
	setColors(event);

	document.getElementById("prev").style.whiteSpace =
		parent.nsPreferences.getBoolPref("custombb.previewShowAllSpaces", false)
			? "pre"
			: "normal";
}

function destroy() {
	window.clearTimeout(updTimeout);
	execInMw(function(w) { clearTimeout(w.custombb.getTaValTimeout); });
}

function prev() {
	warnFlag = false;

	var val = _args.value;

	var lb = _args.lb;
	if(!lb)
		lb = "\n";

	function noFormatting(op, opre, nOp, cl, clre, nCl, arrIt, resArr) {
		var ind = 0;
		var opRE = new RegExp(opre, "i");
		var opREg = new RegExp(opre, "ig");
		var clRE = new RegExp(clre, "i");
		var clREg = new RegExp(clre, "ig");

		var getRE = function(re) {
			return new RegExp(re.replace(/(\[|\]|\$)/g, "\\$1"), "ig");
		}
		var back = function(val) {
			return val.replace(getRE(nOp), op).replace(getRE(nCl), cl);
		}

		while(opRE.test(val) || clRE.test(val)) {
			var opInd = val.indexOf(op);
			var clInd = val.indexOf(cl);
			if(opInd < 0 || clInd < 0) {
				val = back(val);
				return;
			}
			if(opInd > clInd) // [/code]...[code]
				val = val.substring(0, opInd).replace(clREg, nCl) + val.substring(opInd, val.length);

			var sVal = val.substring(opInd + op.length, clInd);
			var bug = opREg.test(sVal);
			var opInd = val.indexOf(op);
			var clInd = val.indexOf(cl);

			while(bug && clInd <= val.length) {
				var bsVal = back(val.substring(opInd, clInd + cl.length));

				var opNum = bsVal.match(opREg);
				opNum = opNum ? opNum.length : 0;
				var clNum = bsVal.match(clREg);
				clNum = clNum ? clNum.length : 0;

				var num = opNum + clNum;

				if(opNum != clNum)
					clInd++;
				else
					bug = false;
			}
			var sVal = val.substring(opInd + op.length, clInd);

			resArr[ind++] = back(sVal);
			val = val.substring(0, opInd) + nOp + arrIt + nCl + val.substring(clInd + cl.length);
		}

		val = back(val);
	}

	var codes = [];
	noFormatting("[code]", "\\[code\\]", "[$code->$]", "[/code]", "\\[\\/code\\]", "[$<-code$]", "[$code$]", codes);

	var codeboxes = [];
	noFormatting("[codebox]", "\\[codebox\\]", "[$codebox->$]", "[/codebox]", "\\[\\/codebox\\]", "[$<-codebox$]", "[$codebox$]", codeboxes);

	var simpleTags = ["code", "codebox", "b", "i", "u", "s", "img", "center", "left", "right"];

	for(var i = 0; i < simpleTags.length; i++) {
		var st = simpleTags[i];
		dumpTags(
			val,
			"[" + st + "]",
			new RegExp("\\[" + st + "\\]", "ig"),
			"[/" + st + "]",
			new RegExp("\\[\\/" + st + "\\]", "ig")
		);
	}

	dumpTags(val, "[url]", /\[url(=(ht|f)tps?:\/\/[^\[\] \\]+?)?\]/ig, "[/url]", /\[\/url\]/ig);

	var colorRE = /\[color=(['"]?)(#?[a-z0-9]+)\1\]/ig; // |rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)
	dumpTags(val, "[color]", colorRE, "[/color]", /\[\/color\]/ig);

	var sizeRE = /\[size=(['"]?)(\d+)\1\]/ig;
	dumpTags(val, "[size]", sizeRE, "[/size]", /\[\/size\]/ig);

	var fontRE = /\[font=(['"]?)(([a-z]+( [a-z]+)?)+)\1\]/ig;
	dumpTags(val, "[font]", fontRE, "[/font]", /\[\/font\]/ig);

	dumpTags(val, "[quote]", /\[quote(?:[= ][^\[\]]+?)?\]/ig, "[/quote]", /\[\/quote\]/ig);
	dumpTags(val, "[list]", /\[list(=(['"]?)[1ia]\2)?\]/ig, "[/list]", /\[\/list\]/ig);

	dumpTags(val, "[acronym]", /\[acronym=(.+?)\]/ig, "[/acronym]", /\[\/acronym\]/ig);

	val = parent.insSmileys(val);

	if(!_args.isCE)
		val = val
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

	val = val
		.replace(new RegExp(lb.replace(/\n/, "\\n").replace(/\r/, "\\r"), "g"), "<br>")

		.replace(/\[(\/?[bius])\]/ig, "<$1>")
		.replace(colorRE, "<font color='$2'>")
		.replace(/\[\/color\]/ig, "</font>")

		.replace(fontRE, "<font face='$2'>")
		.replace(/\[\/font\]/ig, "</font>")

		.replace(sizeRE, "<font size='$2pt'>")
		.replace(/\[\/size\]/ig, "</font>")

		.replace(/\[url\](.+?)\[\/url\]/ig, "<a href='$1'>$1</a>")
		.replace(/\[url=(.+?)\]/ig, "<a href='$1'>")
		.replace(/\[\/url\]/ig, "</a>")

		.replace(/\[img\](.+?)\[\/img\]/ig, "<img src='$1'>")

		.replace(/\[list\]((.|\n)*?)\[\/list\]/ig, "<ul>$1</ul>")
		.replace(/\[list=(['"]?)1\1\]((.|\n)*?)\[\/list\]/ig, "<ol>$2</ol>")
		.replace(/\[list=(['"]?)(a|i)\1\]((.|\n)*?)\[\/list\]/ig, "<ol type='$2'>$3</ol>")

		.replace(/\[\*\]/g, "</li><li>")

		.replace(/\[(center|sub|sup)\]/ig, "<$1>")
		.replace(/\[\/(center|sub|sup)\]/ig, "</$1>")

		.replace(/\[(left|right)\]/ig, "<div align='$1'>")
		.replace(/\[\/(left|right)\]/ig, "</div>")

		.replace(/\[acronym=(.+?)\]/ig, "<acronym title='$1'>")
		.replace(/\[\/acronym\]/ig, "</acronym>")

		.replace(/\[hr *\/\]/ig, "<hr>")

		.replace(/\[code\]/ig, "<div class='codebox'><b>CODE:</b><div class='code'><pre>")
		.replace(/\[codebox\]/ig, "<div class='codebox'><b>CODE:</b><div class='code fixedh'><pre>")
		.replace(/\[\/code(box)?\]/ig, "</pre></div></div>")

		.replace( // [quote name='Author' timestamp='1327777806' post='123456']
			/\[quote(?: +\w+=[^\[\]]*?)* +name=('|")(.+?)\1(?: +\w+=[^\[\]]*?)*\]/ig,
			"<div class='quotebox'><b>QUOTE ($2):</b><div>"
		)
		.replace(/\[quote(=([^\[\]]+?))?\]/ig, "<div class='quotebox'><b>QUOTE &(&$2&)&:</b><div>")
		.replace(/\[\/quote\]/ig, "</div></div>")

		.replace(/ &\(&&\)&/g, "")
		.replace(/&([\(\)])&/g, "$1")

		.replace(/\[\$-/g, "<")
		.replace(/-\$\]/g, ">");

	for(var i = 0; i < codes.length; i++)
		val = val.replace(/\[\$code\$\]/, codes[i]);

	for(var i = 0; i < codeboxes.length; i++)
		val = val.replace(/\[\$codebox\$\]/, codeboxes[i]);

	val = val
		.replace(/\[\$~\|CurrentLine\|~\$\]/, "<a id='currentPosition'></a>")
		.replace(/\[\$~\|CurrentSelectionStart\|~\$\]/, "<a class='mark' id='currentSelectionStart'></a>");

	var pr = document.getElementById("prev");
	pr.innerHTML = val;

	setTimeout(
		function() {
			if(warnFlag)
				toggleStat(true);
			else {
				// scrollEnd();

				var cp = document.getElementById("currentPosition");
				var cs = document.getElementById("currentSelectionStart");
				if(!cp && !cs)
					return;

				window.scrollBy(0, 300);

				if(cp)
					cp.focus();
				else {
					cs.focus();
					window.scrollBy(0, - Math.round(parent.getH()/4));
					cs.innerHTML = "|";
					if(updTime > 500)
						setTimeout(
							function() {
								cs.parentNode.removeChild(cs);
							},
							500
						);
				}

				var _ta = _args.ta;
				if(_ta)
					_ta.focus();
			}
		},
		0
	);

	if(updTime >= 0)
		window.setTimeout(upd, updTime);
}

function upd() {
	var cVal = _args.value; // current value
	execInMw(function(w) { _args.value = w.custombb.taVal; });
	if(_args.value != cVal) {
		document.getElementById("res").innerHTML = "";
		prev();
	}
	updTimeout = window.setTimeout(upd, updTime);
}

function execInMw(func) {
	return parent.custombbCmmSet.execInMainWindow(func);
}

function toggleStat(show) {
	var bttn = document.getElementById("toggleRes");
	var it = document.getElementById("resT");
	var val = bttn.value.replace(/[<>]{2}$/, "");
	var st = it.hasAttribute("style");

	if(st || show)
		it.removeAttribute("style");
	else
		it.setAttribute("style", "display: none");

	bttn.setAttribute("value", val + (st ? "<<" : ">>"));
	scrollEnd();
}

function scrollEnd() {
	var html = document.body.parentNode;
	var h = parseInt(window.getComputedStyle(html, "").height.replace(/[^\d\.]/g, ""));
	window.scrollTo(0, h);
}

function stat(name1, val1, name2, val2, warn) {
	var it = document.getElementById("res");
	var cVal = it.innerHTML;

	var clss = warn ? " class='warn'" : "";

	it.innerHTML = cVal
		+ "<tr" + clss + ">"
			+ "<td class='stat_td'><b>" + name1 + ":</b></td><td>" + val1 + "</td>"
			+ "<td class='stat_td'><b>" + name2 + ":</b></td><td>" + val2 + "</td>"
		+ "</tr>";

	if(warn)
		warnFlag = true;
}

function dumpTags(val, t1Name, t1RegExp, t2Name, t2RegExp) {
	var tag1 = val.match(t1RegExp);
	var tag1L = tag1 ? tag1.length : 0;
	var tag2 = val.match(t2RegExp);
	var tag2L = tag2 ? tag2.length : 0;
	var warn = tag1L != tag2L;
	if(warn)
		warnFlag = true;

	if(tag1L != 0 || tag2L != 0)
		stat(t1Name, tag1L, t2Name, tag2L, warn);
}

function setColors(event, def) {
	if(event.type != "load")
		if(!event.ctrlKey)
			return;

	var styles = document.styleSheets[0];

	for(var i = 0; i < customCSS.length; i++) {
		var cc = customCSS[i];
		if(cc)
			styles.deleteRule(cc);
		customCSS[i] = null;
	}

	if(def)
		return;

	var pDoc = parent.document;
	var ind = 0;

	var bodyBGC = pDoc.getElementById("bodyBGColor").value;
	var bodyC = pDoc.getElementById("bodyColor").value;
	var bodySt = bodyC
		? "color: " + bodyC + ";"
		: "";
	if(bodyBGC)
		bodySt += "background-color: " + bodyBGC + " !important;";
	if(bodySt)
		customCSS[ind++] = styles.insertRule("body {" + bodySt + "}", 1);

	if(bodyC)
		customCSS[ind++] = styles.insertRule("table, td {border: 1px inset " + bodyC + " !important;}", 1);

	var codeBGC = pDoc.getElementById("codeBGColor").value;
	var codeBC = pDoc.getElementById("codeBColor").value;
	var codeSt = codeBC
		? "border: 1px dashed " + codeBC + " !important;"
		: "";
	if(codeBGC)
		codeSt += " background-color: " + codeBGC + " !important;"
	if(codeSt)
		customCSS[ind++] = styles.insertRule(".codebox {" + codeSt + "}", 1);

	var quoteBGC = pDoc.getElementById("quoteBGColor").value;
	var quoteBC = pDoc.getElementById("quoteBColor").value;
	var quoteSt = quoteBC
		? "border: 1px solid " + quoteBC + " !important;"
		: "";
	if(quoteBGC)
		quoteSt += " background-color: " + quoteBGC + " !important;"
	if(quoteSt)
		customCSS[ind++] = styles.insertRule(".quotebox {" + quoteSt + "}", 1);

	var linkC = pDoc.getElementById("linkColor").value;
	var linkSt = linkC
		? "color: " + linkC + " !important;"
		: "";

	if(linkSt)
		customCSS[ind++] = styles.insertRule("a {" + linkSt + "}", 1);
}
})();