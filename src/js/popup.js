
var bg = chrome.extension.getBackgroundPage();
var settings = bg.settings;


// onload
window.addEventListener('load', function(){

	loadContent();
	document.body.onselectstart = function(){ return false; };

	document.getElementById("clr").onclick    = reset;
	document.getElementById("delete").onclick = deleteFoundTabs;
	document.getElementById("prev").onclick   = prev;
	document.getElementById("next").onclick   = next;

	document.getElementById("searchQ").onkeyup  = function(){ searchFor(this.value); };

}, false);


//
// Double-Click feature
//

localStorage.lastOpened || (localStorage.lastOpened = '0');
localStorage.lastClosed || (localStorage.lastClosed = '0');

bg.console.log('popup_opened')///

// Double click restores the last closed tab
var opened = +new Date;
function unload() {
	localStorage.lastClosed = +new Date;
	localStorage.lastOpened = opened;
	var isFastClose = +new Date - opened < 400;
	// Double click when popup was closed
	if (!settings.disableDClick && isFastClose) {
		bg.console.log('double click popup was closed')///
		bg.getLastTab();
		window.close();
	}
}
window.addEventListener("unload", unload);

var isReopenedFast   = opened - localStorage.lastClosed < 300
var wasLastCloseFast = localStorage.lastClosed - localStorage.lastOpened < 400
//bg.console.log('reopen time: ' + (opened - localStorage.lastClosed))///
//bg.console.log('last close time: ' + (localStorage.lastClosed - localStorage.lastOpened))///

if (!settings.disableDClick && isReopenedFast && wasLastCloseFast) {
	bg.console.log('double click popup was opened')///
	// This will trigger a fast close
	// Just like a double click
	window.removeEventListener("unload", unload);
	window.close();
}

var pageNo = 0;
var popupLoaded = false;

var filterTimeOut;
var filterStrings;
var filterRegEx;

function createLink(id, url) {
  var link = document.createElement('a');
  link.href="";
  link.id = 'ClosedTab-' + i;
  link.onclick = function (e) {
  	if (e.target.classList.contains('del')) {
  		var parent = e.target.parentNode;
  		deleteSingleTab(parent.id);
  		parent.parentNode.removeChild(parent);
  		e.preventDefault();
  		e.stopPropagation();
  	} 
  	else if (e.button == 1){ 
			e.preventDefault();
			e.stopPropagation();
			showUrl(id,false); 
			loadContent();
		} 
		else { 
			e.preventDefault();
			showUrl(id,true);
			//loadContent();
		}
  };
  link.title = url;
  return link;
}

var nowtime,currentTime;
var content;

function loadContent() {

	var docEl = document.documentElement;
	var currentHeight = docEl.offsetHeight;
	var minHeight = docEl.style.minHeight;
	minHeight = minHeight ? parseInt(minHeight, 10) : currentHeight;
	minHeight = Math.max(minHeight, currentHeight); // we never get smaller
	minHeight = Math.min(minHeight, 600);           // but are limited to 600px
	docEl.style.minHeight = minHeight + "px";


  content = document.getElementById("content");
	// Don't popup if there's nothing to show
	var n = localStorage["closedTabCount"];
	

	/// TODO: review if it's used
	nowtime = new Date();
	currentTime = nowtime.getTime(); 
	
	popupLoaded=false;


	if (settings.menuTop == true) document.body.classList.add("menuTop");
	if (settings.boldFont == true) content.className+=" bold";
	
	if (settings.showSearch == true) 
		document.getElementById("searchQ").focus(); 
	else 
		document.getElementById("searchQ").style.display="none";
	

	content.innerHTML="<center><b>Loading...</b></center>";

	if (settings.showClear == true) 
		document.getElementById("clr").style.display=""; 
	else 
		document.getElementById("clr").style.display="none";

	document.getElementById("prev").disabled = "disabled";
	document.getElementById("next").disabled = "disabled";
	
	if (filterStrings!=null) {
		document.getElementById("delete").style.display="";
		document.getElementById("prev").style.display="none";
		document.getElementById("next").style.display="none";
	} else{
		document.getElementById("delete").style.display="none";
		document.getElementById("prev").style.display="";
		document.getElementById("next").style.display="";
	}
	
	if (parseInt(n) == 0){
		content.innerHTML="<center><b>0 Closed tabs, only new opened tabs are registered<br><br>Old tabs opened BEFORE installing this extension will NOT appear.</b></center>";
	}else{
		loadPage();
		//content.innerHTML="<center>"+JSON.stringify(settings)+"</center>";
	}
}

function loadPage(){

	if (!popupLoaded) {
		content.innerHTML="";
		popupLoaded=true;
	}

	var items_to_display=settings.numItems;
	if (filterStrings!=null) items_to_display=1000;


	nowtime = new Date();
	currentTime = nowtime.getTime(); 

	var min_limit = localStorage["minimumTabInc"];

	for (j = 0, i = localStorage["uniqueTabInc"] - 1; i>=0 && j<pageNo*items_to_display; i--) if (localStorage["ClosedTab-"+i]) j++;

	for (j = 0; i>=min_limit && j<items_to_display; i--){
		var closedTab = localStorage["ClosedTab-"+i];
		if (closedTab){
			if (filterStrings==null || (filterStrings!=null && closedTab.multiFind(filterStrings))){
				//setTimeout(ShowEntry, 0,i,closedTab);
				ShowEntry(i,closedTab);
				j++;
			}
		}
	}

	if (filterStrings==null) {
		if (pageNo > 0) 
			document.getElementById("prev").disabled = "";
		if (localStorage["closedTabCount"] > (pageNo+1) * settings.numItems) 
			document.getElementById("next").disabled = "";
	}else{
		if (j==0) 
			content.innerHTML="<center><b>No closed tabs containing \'"+unescape(filterStrings.join(" "))+"\'  found</b></center>";
	}
	/*
	var nowtime = new Date();
	var end = nowtime.getTime();
	var took = (end - currentTime);

	var textdiv = document.createElement('div');
	textdiv.innerHTML = "This took : " + took + " ms"; 
	content.appendChild(textdiv);*/
}

function ShowEntry(i,closedTab) {

	if (!popupLoaded) return;
	
	var split = closedTab.split("%%");
	tabTime = split[1];
	tabUrl = split[2];

	var text_link = createLink(i, tabUrl);
	var html;


	html="<img src=\"chrome://favicon/"+tabUrl+"\" alt=\""+tabUrl+"\" width=16 height=16>"; 

	if (filterStrings!=null) split[4]=split[4].multiReplace(filterStrings);
	
	
	html+="<div";
	if (settings.numLines!=0 && !isNaN(settings.numLines) && filterStrings==null) html+=" class=\"maxh"+settings.numLines+"\"";
	html+="> "+ split[4]+"</div>";
	
	if (settings.showTime){
		var timeTextz;

		var difference = currentTime - tabTime; 
		var hoursDifference = Math.floor(difference/1000/60/60); 
		difference = difference - hoursDifference*1000*60*60 
		var minutesDifference = Math.floor(difference/1000/60); 
		difference = difference - minutesDifference*1000*60 
		var secondsDifference = Math.floor(difference/1000); 
		if ( hoursDifference < 1 &&  minutesDifference < 1 &&secondsDifference < 60) timeTextz = '<b>'+ secondsDifference + 's</b> ago'; 
		else if (hoursDifference < 1) timeTextz ='<b>'+ minutesDifference + ' min</b> ago'; 
		else if (hoursDifference < 4) timeTextz= '<b>' + hoursDifference + 'h ' + minutesDifference + 'min</b>'; 
		else if (hoursDifference < 24) timeTextz='<b>' + hoursDifference + 'h</b> ago'; 
		else {
			var daysDiff=Math.floor(hoursDifference/24);
			timeTextz='<b>' + daysDiff + ' days</b> '; 
		}
		html+="<span class='time'>"+timeTextz+"</span>";

		//if (settings.largeRemove)
		//	html+="<span class='del'>remove</span>";
		//else
	}

	html+="<span class='del del-small'>x</span>";
	
	text_link.innerHTML=html;
	content.appendChild(text_link);
	//pause(10);
}
/*
function pause(millis) 
{
        var date = new Date();
        var curDate = null;
 
        do { curDate = new Date(); } 
        while(curDate-date < millis)
}
*/


function searchFor(string) {
	string = string.replace(/(\%)/g, "%25");
	string = string.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	string = stripVowelAccent(string);

	if ((filterStrings==null && string=="") || (filterStrings!=null && string==filterStrings.join(" "))) return;

	if (string==""){
		pageNo=0;
		filterStrings = null;
	}else{
		pageNo=0;
		//for(var i=0; i < filterStrings.length-1; i=i+1) { 
		string=string.toLowerCase();
		filterStrings = string.split(" "); 
	}
	clearTimeout(filterTimeOut);
	filterTimeOut=setTimeout(loadContent,200);
}
function next() {
	if (localStorage["closedTabCount"] > (pageNo+1) * settings.numItems) pageNo++;
	loadContent();
}

function prev() {
	if (pageNo > 0) pageNo--;
	loadContent();
}

function reset(){
	if (document.getElementById("searchQ").value!=""){
		document.getElementById("searchQ").value="";
		searchFor("");
	}else{
		resetData();
		pageNo = 0;
		window.close();
	}
}

function deleteSingleTab(id) {
		if (localStorage[id]) {
			delete localStorage[id];
			localStorage["closedTabCount"]--;
		}
		//loadContent();
		setBadgeText();
}

function deleteFoundTabs() {
if (filterStrings==null) return;
	  for (i = localStorage["uniqueTabInc"] - 1; i>=0; i--){
		var closedTab = localStorage["ClosedTab-"+i];
		if (closedTab){
			if (filterStrings!=null && closedTab.multiFind(filterStrings)){
				delete localStorage["ClosedTab-"+i];
				localStorage["closedTabCount"] --;
			}
		}
	}
	loadContent();
	setBadgeText();
}


function stripVowelAccent(str)
{
	var rExps=[ /[\xC0-\xC2]/g, /[\xE0-\xE2]/g,
		/[\xC8-\xCA]/g, /[\xE8-\xEB]/g,
		/[\xCC-\xCE]/g, /[\xEC-\xEE]/g,
		/[\xD2-\xD4]/g, /[\xF2-\xF4]/g,
		/[\xD9-\xDB]/g, /[\xF9-\xFB]/g ];

	var repChar=['A','a','E','e','I','i','O','o','U','u'];

	for(var i=0; i<rExps.length; ++i)
		str=str.replace(rExps[i],repChar[i]);

	return str;
}

String.prototype.multiFind = function ( strings ) {
	var str = this, i;
	str = stripVowelAccent(str);
	str = str.toLowerCase();
	var foundAmount=0;
	for (i = 0; i < strings.length; i++ ) {
		if (str.indexOf(strings[i])!= -1) foundAmount++;
	}
	return (foundAmount==strings.length);
};
String.prototype.multiReplace = function ( strings ) {
	var str_real = this, i;
	var str = str_real;
	str = stripVowelAccent(str);
	str = str.toLowerCase();
	var position=-1;
	for (i = 0; i < strings.length; i++ ) {
		position = str.indexOf(strings[i]);
		if (position!= -1) {
			str_real = str_real.substr(0,position) + "<u>" + str_real.substr(position, strings[i].length) + "</u>" + str_real.substr(position + strings[i].length); 
			str = stripVowelAccent(str_real).toLowerCase();
		}
		//str = str.replace(new RegExp('(' + strings[i] + ')','gi'), replaceBy);
	}
	return str_real;
};





/*
window.addEventListener("load", function() {
	if (!localStorage.message_shown_745) {
	  document.getElementById('message').style.display = 'block';
	}
	//document.getElementById('close-message').onclick = close_message;
})

document.getElementById('message').onclick = function(e) {
	if (e.target.classList.contains('close')) {
		close_message();
	}
}

function close_message() {
	localStorage.message_shown_745 = "true";
	document.getElementById('message').style.display = 'none';
}
*/