 /* mbedEditor++         */
 /* created by @_strobo  */
 
 var mark_flag;
 var StyleElement = {
	 text      : "",
	 tag       : "",
	 element   : document.createElement('style'),
	 modifyTag : function() {
		 this.tag.innerText = this.text;
	 },
	 appendTag : function() {
		 this.element.innerText = this.text;
		 this.tag = document.head.appendChild( this.element );
	 },
	 setStyleText : function(font, size) {
		this.text =  ".editor_cursor, .editor_line, .editor_line_test, .editor_number{font-family:'" + font + "',Courier,monospace;font-size:" + size + "};";
	 }
 };

// initialize
chrome.extension.sendRequest(
	{ text :"init" },
	function(res) {
		StyleElement.setStyleText(res.font, res.size);
		mark_flag = res.mark;
	}
);
// reload font
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if (request.text === "reload") {	
			StyleElement.setStyleText(request.font, request.size);
			StyleElement.modifyTag();
			mark_flag = request.mark;
			sendResponse({});
		}
		else sendResponse({});
	}
);


EditorBoard = function() {
	this.line = parseInt(document.getElementById('sb_line').value.split(' ')[1]);	// line
	this.col = parseInt(document.getElementById('sb_col').value.split(' ')[1]);		// col
	
	var lineArea = document.getElementById('aboutedit_ln');
	this.lineCount = document.getElementById('aboutedit_ln').childElementCount;		// Line
	for(var i=0; i < this.lineCount; i++){
		if(parseInt(lineArea.childNodes[i].innerText) === this.line) break;
	}
	this.lineOfDom = i;																// Cursor Position on DOM
	this.editorText = document.getElementById('aboutedit_text');					// Displayed editor text 
	this.lineText = this.editorText.childNodes[i].innerText;						// Text of selected line
	this.charOfAroundCursor = [this.lineText.charAt(this.col - 2), this.lineText.charAt(this.col - 1)];
	this.targetChar = "";

	this.homu = function(){alert("homuhomu!");};

	// returns target possition
	this.getTargetPos = function(){
		var i, j, offset, count;
		var PAREN = ['[' , ']' ,'(' , ')' , '{' , '}'];				// [] () {}
		var target = {};
		offset = count = 0;

		// gets target text
		// target.direction  -1:front           1:back
		// target.cursor      0:front of braket 1:back of braket
		// target.current     current braket
		// target.target      target braket
		var finishGetTargetText = false;
		for( i = 1; (i >= 0) && (!finishGetTargetText); i--) {
			for(j = 0; (j < PAREN.length) && (!finishGetTargetText); j++) {
				if(this.charOfAroundCursor[i] === PAREN[j]) {
					if(j%2 === 0) {								// [ ( {
						this.targetChar = PAREN[j+1];
						finishGetTargetText = true;
						target =  { direction : 1, cursor : i, current : PAREN[j], target : PAREN[j+1] };
					} else {									// ] ) }
						this.targetChar = PAREN[j-1];
						finishGetTargetText = true;
						target =  { direction : -1, cursor : i, current : PAREN[j], target : PAREN[j-1] };
					}
				}
			}
		}
		if(!this.targetChar) return 0;
		// getTargetTextPosition
		if(target.direction === 1) {								// [ ( {
			(target.cursor === 1) ? offset = 0 : offset = -1;
			for(i = this.lineOfDom; i < this.lineCount; i++) {
				for(j = this.col + offset; j < this.editorText.childNodes[i].innerText.length; j++) {
					if(this.editorText.childNodes[i].innerText.charAt(j) === target.current) count++;
					if(this.editorText.childNodes[i].innerText.charAt(j) === target.target) {
						if((count--) === 0) return {line: i, col: j};
					}
				}
				if(i === this.lineCount - 1) return 0;
				this.col = offset = 0;
			}
		} else {													// ] ) }
			(target.cursor === 1) ? offset = -2 : offset = -3;
			for(i = this.lineOfDom; i >= 0; i--) {
				for(j = this.col + offset; j >= 0; j--) {
					if(this.editorText.childNodes[i].innerText.charAt(j) === target.current) count++;
					if(this.editorText.childNodes[i].innerText.charAt(j) === target.target) {
						if((count--) === 0) return {line: i, col: j};
					}
				}
				if(i === 0) return 0;
				this.col = 0; offset = this.editorText.childNodes[i-1].innerText.length
			}
		}
	}
	this.getLineHTML = function(line) {
		return this.editorText.childNodes[line].innerHTML;
	}
	this.setLineHTML = function(line, html) {
		this.editorText.childNodes[line].innerHTML = html;
	}
	this.getText = function(line, col) {
		return this.editorText.childNodes[line].innerText.charAt(col);
	}
	this.getHTML = function(line, col) {
		return this.editorText.childNodes[line].innerHTML.charAt(col);
	}
}

function mark(){
	var count, col;
	var editorArea = {};
	var targetPosition = {};
	var resultHTML;

	count = col = 0;
	var marked = document.getElementById('_marked');
	if(marked) marked.outerHTML = marked.innerHTML;
	if(!mark_flag) return 0;
	editorArea = new EditorBoard();

	targetPosition = editorArea.getTargetPos();
	if(!targetPosition) return 0;

	col = targetPosition.col;
	do {
		if(editorArea.getText(targetPosition.line, col) === editorArea.targetChar) count++;
	} while(col--);
	col = 0;
	do {
		if(editorArea.getHTML(targetPosition.line, col++) === editorArea.targetChar) count--;
	} while(count != 0);

	var lineText = editorArea.getLineHTML(targetPosition.line);
	resultHTML = lineText.slice(0, col-1);
	resultHTML += "<span id='_marked'style='background-color:#af0'>" + editorArea.targetChar + "</span>";
	resultHTML += lineText.slice(col, lineText.length);

	editorArea.setLineHTML(targetPosition.line, resultHTML);
}

document.head.addEventListener('DOMNodeInserted',function() {
    if(document.head.childElementCount === 13){
		StyleElement.appendTag();
		var aboutedit = document.getElementById('aboutedit');
		aboutedit.addEventListener('mousedown', mark, false);
		document.body.addEventListener('keyup', mark, false);
		document.head.removeEventListener('DOMNodeInserted', arguments.callee, false);
		}
	}, false);
