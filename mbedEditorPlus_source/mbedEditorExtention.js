 /* mbedEditor++         */
 /* created by @_strobo  */

var mark_flag,
    mark_color;
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
chrome.runtime.sendMessage(
	{ req :"init" },
	function(res) {
		StyleElement.setStyleText(res.font, res.size);
		mark_flag = res.mark;
        mark_color = res.color;
	}
);
// reload font
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.req === "reload") {
			StyleElement.setStyleText(request.font, request.size);
			StyleElement.modifyTag();
			mark_flag = request.mark;
            mark_color = request.color;
			sendResponse({});
		}
		else sendResponse({});
	}
);

EditorBoard = function() {
	this.line = parseInt(document.getElementById('ed_line').innerHTML.split(' ')[1]);	// line
	this.col = parseInt(document.getElementById('ed_col').innerHTML.split(' ')[1]);		// col
	
	var lineArea = document.getElementById('aboutedit_ln');
	this.lineCount = document.getElementById('aboutedit_ln').childElementCount;		// Line
	for(var i=0; i < this.lineCount; i++){
		if(parseInt(lineArea.childNodes[i].innerText) === this.line) break;
	}
	this.lineOfDom = i;																// Cursor Position on DOM
	this.editorText = document.getElementById('aboutedit_screen');					// Displayed editor text 
	this.lineText = this.editorText.childNodes[i].innerText;						// Text of selected line
	this.charOfAroundCursor = [this.lineText.charAt(this.col - 2), this.lineText.charAt(this.col - 1)];
	this.targetChar = "";

	// returns target possition
	this.getTargetPos = function(){
		var i, j, offset, count;
		var PAREN = ['[' , ']' ,'(' , ')' , '{' , '}'];
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

    this.getCurrentBracket = function() {
		var PAREN = ['[' , ']' ,'(' , ')' , '{' , '}'];
		var finishGetTargetText = false;

		for(var i = 1; (i >= 0) && (!finishGetTargetText); i--) {
			for(var j = 0; (j < PAREN.length) && (!finishGetTargetText); j++) {
				if(this.charOfAroundCursor[i] === PAREN[j]) {
					if(j%2 === 0) {								// [ ( {
						this.targetChar = PAREN[j+1];
						finishGetTargetText = true;
                        return {line:this.lineOfDom, col:this.col+(-i), bracket:PAREN[j]};
					} else {									// ] ) }
						this.targetChar = PAREN[j-1];
						finishGetTargetText = true;
                        return {line:this.lineOfDom, col:this.col+(-i), bracket:PAREN[j]};
					}
				}
			}
		}
        return 0;
    }

    this.markChar = function(line, col, targetChar) {
        var resultHTML;
        var lineText = this.getLineHTML(line);

        resultHTML = lineText.slice(0, col-1);
        resultHTML += "<span class='_marked'style='background-color:"+ mark_color + "'>" + targetChar + "</span>";
        resultHTML += lineText.slice(col, lineText.length);
        this.setLineHTML(line, resultHTML);
    }

    this.convertCol = function(line, col, targetChar) {
        var count = 0;

        do {
            if(this.getText(line, col) === targetChar) count++;
        } while(col--);
        col = 0;
        do {
            if(this.getHTML(line, col++) === targetChar) count--;
        } while(count != 0);
        return col;
    }
}

/* main function of highlighting */
function mark(){
	var col;
	var editorArea = {};
	var targetPosition = {};
	var marked = document.getElementsByClassName('_marked');

    /* unmark previous marked bracket */
    var i = marked.length;
    while(i){
        marked[i-1].outerHTML = marked[i-1].innerHTML;
        i--;
    }

	if(!mark_flag) return 0;

	editorArea = new EditorBoard();

    /* mark current bracket */
    currentPosition  = editorArea.getCurrentBracket();
    if(!currentPosition) return 0;
    col = editorArea.convertCol(currentPosition.line,currentPosition.col, currentPosition.bracket);
    editorArea.markChar(currentPosition.line, col, currentPosition.bracket);

    /* mark matched bracket */
	targetPosition = editorArea.getTargetPos();
	if(!targetPosition) return 0;
    col = editorArea.convertCol(targetPosition.line,targetPosition.col, editorArea.targetChar);
    editorArea.markChar(targetPosition.line, col, editorArea.targetChar);
}

document.head.addEventListener('DOMNodeInserted',function() {
    if(document.head.childElementCount === 11){
		StyleElement.appendTag();
		var aboutedit = document.getElementById('aboutedit_plotter');
		aboutedit.addEventListener('mousedown', mark, false);
		document.body.addEventListener('keyup', mark, false);
		document.head.removeEventListener('DOMNodeInserted', arguments.callee, false);
		}
	}, false);
