window.onload = function() {
	main();
};


var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";
var map;

var road, hybrid, aerial, markers;

var iconSize 	= new OpenLayers.Size(35,35);
var iconOffset 	= new OpenLayers.Pixel(-(iconSize.w / 2), -iconSize.h);
var icon 		= new OpenLayers.Icon('img/marker.png'	, iconSize, iconOffset);
var iconOn 		= new OpenLayers.Icon('img/markerOn.png', iconSize, iconOffset);

var markersIcons = {};

var count, total;

function initMap() {
	map = new OpenLayers.Map(
		"map",
		{
			projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326")
		}
	);
			
	map.addControl(new OpenLayers.Control.LayerSwitcher());

	road = new OpenLayers.Layer.Bing({
		name: "Road",
		key: apiKey,
		type: "Road"
	});
	hybrid = new OpenLayers.Layer.Bing({
		name: "Hybrid",
		key: apiKey,
		type: "AerialWithLabels"
	});
	aerial = new OpenLayers.Layer.Bing({
		name: "Aerial",
		key: apiKey,
		type: "Aerial"
	});
	markers = new OpenLayers.Layer.Markers(
		"Markers"
	);

	map.addLayers([road, hybrid, aerial, markers]);
	map.zoomDuration = 0;
	map.panDuration = 0;
	map.setCenter(new OpenLayers.LonLat(0, 3000000), 2.5);
}

function clearMarkers() {
	markers.destroy();
	markers = new OpenLayers.Layer.Markers(
		"Markers"
	);
	map.addLayers([markers]);
}

function mark(lon, lat, id) {
	var lonlat = new OpenLayers.LonLat(lon, lat);
	lonlat.transform(map.displayProjection, map.baseLayer.projection);
	var marker  = new OpenLayers.Marker(lonlat, icon.clone());
	markersIcons[id] = marker;
	markers.addMarker(marker);
}

function getTweets(hashTagParams, next) {
	var lang = document.getElementById('country').value;
	if (lang != '') {
		lang = '&lang=' + lang;
	}
	var queryUrl = 'geotweet.php?twitter_query=' + encodeURIComponent('https://api.twitter.com/1.1/search/tweets.json?q=' + encodeURIComponent('#' + hashTagParams) + '&count=100' + lang);
	if (next) {
		queryUrl = 'geotweet.php?twitter_query=' + encodeURIComponent('https://api.twitter.com/1.1/search/tweets.json' + hashTagParams);
	} else {
		count = 0;
		total = 0;
		document.getElementById('spinner').style.display = 'block';
		document.getElementById('resultsList').innerHTML = '';
		clearMarkers();
	}
	httpGet(
		queryUrl,
		function(result){
			if (result.status) {
				var data = JSON.parse(result.response);
				tweets = data.statuses;
				if (!tweets) {
					document.getElementById('spinner').style.display = 'none';
					return;
				}
				for (var i = tweets.length - 1; i >= 0; i--) {
					var coords = tweets[i].coordinates;
					if (coords) {
						displayTweet(tweets[i], count);
						mark(coords.coordinates[0], coords.coordinates[1], count);
						count++;
					}
					total++;
				};
				if (data.search_metadata.next_results) {
					getTweets(data.search_metadata.next_results, true);
				} else {
					document.getElementById('spinner').style.display = 'none';
				}
				document.getElementById('resultsPages').innerHTML = '(' + count + '/' + total + ')';
			}
		}
	);
}

function isMobileDisplay() {
	return document.body.clientWidth <= 480;
}


function zoomOn(tweet, id) {
	if (isMobileDisplay()) {
		window.location = "#";
	}
	var lonlat = new OpenLayers.LonLat(tweet.attributes.lon.value, tweet.attributes.lat.value);
	lonlat.transform(map.displayProjection, map.baseLayer.projection);
	map.zoomTo(10);
	setTimeout(function(){
		map.panTo(lonlat);
	}, 100);
}

function focus(id) {
	console.log(id);
	markersIcons[id].icon = iconOn.clone();
	markersIcons[id].draw();
}

function displayTweet(data, id) {
	var html = '';
	html += '<div class="tweetResult" lon="';
	html += data.coordinates.coordinates[0];
	html += '" lat="';
	html += data.coordinates.coordinates[1];
	html += '" onclick="zoomOn(this);" onmouseover="focus(' + id + ');">';
	html += '	<div class="tweetUsername">';
	html += '		' + data.user.name;
	html += '	</div>';
	html += '	<div class="tweetContent">';
	html += '		' + data.text;
	html += '	</div>';
	html += '</div>';
	document.getElementById('resultsList').innerHTML = html + document.getElementById('resultsList').innerHTML;
}

function httpGet(url, callbackResult) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function (e) {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				callbackResult(
					{
						'response'	: xhr.responseText,
						'status'	: true
					}
					
				);
			} else {
				callbackResult(
					{
						'response'	: null,
						'status'	: false
					}
					
				);
			}
		}
	};
	xhr.onerror = function (e) {
		callbackResult(
			{
				'response'	: null,
				'status'	: false
			}
		);
	};
	xhr.send(null);
}

function main() {
	initMap();
}
