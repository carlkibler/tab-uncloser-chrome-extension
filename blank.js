

chrome.runtime.sendMessage({log: 'blank loading ' + document.URL});

// chrome-extension://kgbkepbalohojkgjekfbmemdmbapabfg/blank.html

if (!history.state || !history.state.sexyUrl) {

	chrome.runtime.sendMessage({log: 'blank nostate ' + document.URL});

	var currentUrl = 'http://stackoverflow.com/questions';
	var urls = ['https://www.google.hu/', 'http://www.apple.com/'] 

	// first url in the history
	history.replaceState({sexyUrl: urls[0]}, '', '');

	// other ones are pushed after that
	urls.slice(1).forEach(function (url) {
		history.pushState({sexyUrl: url}, '', '');
	});

	// current url pushed after all the BACK history
	history.pushState({sexyUrl: currentUrl}, '', '');
	window.location.replace(currentUrl);
}



window.onpopstate = function (e) {
	if (e.state && e.state.sexyUrl) {
		chrome.runtime.sendMessage({log: 'blank popstate ' + e.state.sexyUrl});
		window.location.replace(e.state.sexyUrl); // replace
		//document.body.insertAdjacentHTML('afterbegin', '<h1>'+ history.state.sexyUrl || document.URL +'</h1>')
	}
}



(function() {
    var link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel  = 'icon';
    link.href = 'http://cdn.sstatic.net/stackoverflow/img/favicon.ico';
    document.getElementsByTagName('head')[0].appendChild(link);
}());  




// start blocking
// visit pages
// stop blocking
// go back in history to the current index

/*
chrome.webRequest.onBeforeRequest.addListener( function(details) {
	console.log("onBeforeRequest: " + details.tabId + " | " + details.url)
	return {redirectUrl: 'http://www.apple.com'};
}, {urls: ["*://stackoverflow.com/*"], types: ["main_frame"]}, ["blocking"]); // <all_urls>
*/




var urls = ['https://www.google.hu/', 'http://www.apple.com/', 'http://daringfireball.net/', 'http://stackoverflow.com', 'http://edition.cnn.com/'] 
var targetIndex = 2;
var currentIndex = 0;

start = +new Date;

chrome.tabs.create({}, function (tab) {

	function step() {
		currentIndex += 1;
		if (currentIndex < urls.length) {
			setTimeout(function(){
				chrome.tabs.update(tab.id, {url: urls[currentIndex]});
			}, 100)
		} else {
			chrome.webRequest.onBeforeRequest.removeListener(blockingFunction);
			console.log(+new Date - start)
			// TODO: remove ourselves! 
		}		
	}

	function blockingFunction(details) {
		if (details.frameId != 0 || details.tabId != tab.id) return;
		step();
		return {cancel: true};
	}

	var filters = { tabId: tab.id, urls: ["<all_urls>"], types: ["main_frame"] };

	
	chrome.webRequest.onBeforeSendHeaders.addListener(
		blockingFunction, filters, ["blocking"]
	);


	/*
	chrome.webNavigation.onCommitted.addListener(function(details) {
		if (details.frameId != 0 || details.tabId != tab.id) return;
		step();
	});
	*/

	// init
	chrome.tabs.update(tab.id, {url: urls[0]});



	//urls.forEach(function (url) {
	//	chrome.tabs.update(tab.id, {url: url});
	//});
	//chrome.webRequest.onBeforeRequest.removeListener(blockingFunction); 
});