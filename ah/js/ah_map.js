jQuery(document).ready(function() {
	var categoryList = ["Annat", "Fritidshus", "L\u00e4genhet", "Radhus", "Rum", "Villa"];
	var categoryImageMap = {"Annat":"5", "Fritidshus":"6", "L\u00e4genhet":"2", "Radhus":"3", "Rum":"1", "Villa":"4"};
	//var baseImage = "img/ah_adtypes/adtype_";
	var aCentralLat = 59.312768;
	var aCentralLon = 18.0735245;
	
	function filterMarkerData(markerData) {
		var acceptDate = true;
		var monthZeroIdx = 10; // 10 = November(11)
		var minimumEndDate = new Date(2015, monthZeroIdx, 1);
		var svenskaMonths = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
		// "Idag (00:00) - Tills vidare."
		// "Omg\u00e5ende - Tills vidare."
		// "01 augusti 2015 - 01 september 2016"
		// "01 augusti 2015 - Tills vidare."
		var durationText = markerData["duration"].trim();
		//var durationRe = /[0-9a-z ]+ - ([0-9a-z ]+)/;
		//var durationParts = durationText.match( durationRe ); // Index 0 is the full match. Index 1 onwards are the capturing parenthesis.
		var durationParts = durationText.split('-');
		var durationTo = "";
		var dtParts = []
		var aDateRe = /([0-9]+) ([a-z]+) ([0-9]+)/;
		if(durationParts.length == 2) {
			durationTo = durationParts[1].trim()
			// Index 0 is the full match. Index 1 onwards are the capturing parenthesis.
			dtParts = durationTo.match( aDateRe );
		}
		else if(durationParts.length == 1) {
			durationTo = durationParts[0].trim()
			dtParts = durationTo.match( aDateRe );
		}
		
		// 3 capturing parentheses plus 1 full match
		if(dtParts != null && dtParts.length == 4) {
			var monthIdx = -1; // 0 
			for(var idx=0; idx<svenskaMonths.length; idx+=1 ) {
				if(svenskaMonths[idx] == dtParts[2]) {
					monthIdx = idx;
					break;
				}
			}
			if(monthIdx >= 0) {
				var durationDate = new Date(dtParts[3], monthIdx, dtParts[1]);
				if(durationDate > minimumEndDate) {
					acceptDate = true;
				}
				else {
					acceptDate = false;
				}
			}
		}
		else {
			console.log("DEBUG: Unknown duration: '"+durationText+"'");
		}
		
		return acceptDate;
	}

	//// Test filterMarkerData
	//var markers = ResponseJSON;
	//for (var i = 0; i < markers.length; i++) {
	//	console.log("DEBUG: filter("+markers[i]["duration"]+"): '"+filterMarkerData(markers[i])+"'");
	//}
	
	// Remember to get the element id right otherwise, you might run into a "Uncaught TypeError: Cannot read property 'offsetWidth' of null" in the map api's main.js
	var map = new google.maps.Map(document.getElementById("map_canvas"), {
		center: new google.maps.LatLng(aCentralLat, aCentralLon),
		zoom: 13//,
		//mapTypeId: google.maps.MapTypeId.SATELLITE
	});
	var clickedInfo = false;
	var infoWindow = new google.maps.InfoWindow;
	var markers = ResponseJSON;
	var svTodayRe = /Idag \(\d+:\d+\)/;
	for (var i = 0; i < markers.length; i++) {
		if(!filterMarkerData(markers[i])) {
			continue;
		}
		var duration_str = markers[i]["duration"];
		duration_str = duration_str.replace( svTodayRe, markers[i]["datetime"] );
		//duration_str = duration_str.replace("Omg\u00e5ende -", markers[i]["datetime"]+" -");
		
		var name = markers[i]["item_id"];
		var address = markers[i]["street"];
		var type = markers[i]["category"];
		var id = markers[i]["item_id"];
		var gps_comps = markers[i]["gps"].split(",");
		var point = new google.maps.LatLng(
				parseFloat( gps_comps[0] ),
				parseFloat( gps_comps[1] )
			);
		var baseUrl = 'hand.se';
		baseUrl = 'http://www.andra' + baseUrl;
		var html = '<div class="map_tooltip"><b>' + type + '</b> ' + name + '<br/>';
		var showImages = false;
		if(markers[i]["image"] && showImages) {
			html += '<img class="preview_pic" src="'+baseUrl+markers[i]["image"]+'" /><br/>';
		}
		html += '<span class="address">' +address + '</span><br/>' + ' <br/> Rent: <strong>'+markers[i]["rent"] + '</strong> Size: '+markers[i]["size"] + ' / ' + markers[i]["rooms"] + ' <br/> Posted: ' + markers[i]["datetime"] + '<br/> Duration: ' + duration_str + '<br/>';
		var contact = markers[i]["contact"];
		if(contact != "") {
			html += 'Contact: '+contact+'<br/>';
		}
		html += '<a href="' + baseUrl + markers[i]["url"] + '" target="_new" >More Info</a>' ;
		html += '<span class="adicon adtype_'+categoryImageMap[type]+'"></span>';
		html += '</div>';
		
		//var icon = customIcons[type] || {};
		var marker = new google.maps.Marker({
				map : map,
				position : point//,
				//icon : icon.icon,
				//shadow : icon.shadow,
				//animation : google.maps.Animation.BOUNCE
			});

		bindInfoWindow(marker, map, infoWindow, html);
	}

	function bindInfoWindow(marker, map, infoWindow, html) {
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.setContent(html);
			infoWindow.open(map, marker);
			clickedInfo = true;
		});
		google.maps.event.addListener(infoWindow, 'closeclick', function () {
			clickedInfo = false;
		});
		google.maps.event.addListener(marker, 'mouseover', function () {
			if(!clickedInfo) {
				infoWindow.setContent(html);
				infoWindow.open(map, marker);
			}
		});
		google.maps.event.addListener(marker, 'mouseout', function () {
			if(!clickedInfo) {
				infoWindow.close();
			}
		});
	}
});