var custombbAbout = {

	openURL: function(item) {
		var url = item.getAttribute("tooltiptext");
		// Thanks to FlashGot
		try {

		var w = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getMostRecentWindow("navigator:browser");

		var browser = w.getBrowser();
		browser.selectedTab = browser.addTab(url, null);

		}
		catch(e) {
			alert("custombbAbout.openURL error:\n" + e);
		}
	}
};