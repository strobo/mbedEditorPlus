
function init() {
	var fontName = document.getElementById('font_name'),
        fontNameInput = document.getElementById('font_name_input'),
        fontSize = document.getElementById('font_size'),
        fontSizeInput = document.getElementById('font_size_input'),
        color = document.getElementById('color'),
        colorInput = document.getElementById('color_input'),
        colorSample = document.getElementById('color_sample'),
        mark_text = document.getElementById('mark_text'),
        mark_box = document.getElementById('mark_box'),
        save_button = document.getElementById('save');

    
	chrome.extension.sendRequest
	(
		{
			req:"getInfo"
		},
		function(res)
		{
			fontName.innerText = res.font;
			fontSize.innerText = res.size;
            color.innerText = res.color;
            colorSample.style.backgroundColor = res.color;
            mark_box.checked = (res.mark === "true") ? true : false;
            var msg = (window.navigator.language === "ja") ? "対応する括弧を強調表示": "Highlights matching brackets";
            mark_text.innerText = msg;
		}
	);
	fontName.addEventListener('click', function()
	{
		fontName.style.display = "none";
		fontNameInput.type = "text";
		fontNameInput.focus();
		fontNameInput.value = fontName.innerText;
		
		fontNameInput.addEventListener('blur', function(){
			fontName.innerText = fontNameInput.value;
			fontNameInput.type = "hidden";
			fontName.style.display = "inline";
			
		}, false);
	}, false);
	fontSize.addEventListener('click', function()
	{
		fontSize.style.display = "none";
		fontSizeInput.type = "text";
		fontSizeInput.focus();
		fontSizeInput.value = fontSize.innerText;
		
		fontSizeInput.addEventListener('blur', function(){
			fontSize.innerText = fontSizeInput.value;
			fontSizeInput.type = "hidden";
			fontSize.style.display = "inline";
			
		}, false);
	}, false);

    color.addEventListener('click', function()
	{
		color.style.display = "none";
		colorInput.type = "text";
		colorInput.focus();
		colorInput.value = color.innerText;
		
		colorInput.addEventListener('blur', function(){
            colorSample.style.backgroundColor = colorInput.value;
			color.innerText = colorInput.value;
			colorInput.type = "hidden";
			color.style.display = "inline";
		}, false);
        
		colorInput.addEventListener('keyup', function(){
            colorSample.style.backgroundColor = colorInput.value;
        }, false);
	}, false);

	save_button.addEventListener('click', function()
	{
		chrome.extension.sendRequest(
		{
			req: "setInfo",
			font: fontName.innerText,
			size: fontSize.innerText,
            color: color.innerText,
			mark: mark_box.checked
		});
	});
}
window.addEventListener('load', init, false);
