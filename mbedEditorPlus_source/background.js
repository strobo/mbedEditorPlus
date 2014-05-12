var fontName, fontSize, markColor, mark_, tabId;

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.req === "init") {
			tabId = sender.tab.id;
			fontName = localStorage["font_name"];
			if(!fontName) fontName = "Courier New";
			fontSize = localStorage["font_size"];
			if(!fontSize) fontSize = "13px";
            markColor = localStorage["mark_color"];
            if(!markColor) markColor = "#af0";
			mark_ = localStorage["mark"];
			if(!mark_ === undefined) mark_ = false;
			chrome.pageAction.show(tabId);
			sendResponse(
				{
					font: fontName,
					size: fontSize,
                    color: markColor,
					mark: mark_
				}
			);
		} else if(request.req === "getInfo") {
			fontName = localStorage["font_name"];
			if(!fontName) fontName = "Courier New";
			fontSize = localStorage["font_size"];
            if(!fontSize) fontSize = "13px";
            markColor = localStorage["mark_color"];
            if(!markColor) markColor = "#af0";
			mark_ = localStorage["mark"];
			if(!mark_ === undefined) mark_ = false;
			sendResponse(
				{
					font: fontName,
					size: fontSize,
                    color: markColor,
					mark: mark_
				}
			);
		} else if(request.req === "setInfo") {
			localStorage["font_name"] = request.font;
			localStorage["font_size"] = request.size;
            localStorage["mark_color"] = request.color;
			localStorage["mark"] = request.mark;
			chrome.tabs.getSelected(null, function(tab) {
				chrome.tabs.sendMessage(
					tab.id,
					{
						req: "reload",
						font: request.font,
						size: request.size,
						color: request.color,
						mark: request.mark
					},
					function(response) {}
				)
			} );
		} else sendResponse({});
	}
);
