jQuery(document).ready(function() {
	var categoryList = ["Annat", "Fritidshus", "L\u00e4genhet", "Radhus", "Rum", "Villa"];
	var categoryImageMap = {"Annat":"5", "Fritidshus":"6", "L\u00e4genhet":"2", "Radhus":"3", "Rum":"1", "Villa":"4"};
	//var baseImage = "img/ah_adtypes/adtype_";
	var aCentralLat = 59.312768;
	var aCentralLon = 18.0735245;
	
	function getFutureDateByMonths(monthsAhead) {
		var minimumEndDate = new Date();
		var futureMonth = minimumEndDate.getMonth() + monthsAhead;
		var futureYear = minimumEndDate.getYear() + 1900;
		while(futureMonth > 11) {
			futureMonth -= 11;
			futureYear += 1;
		}
		minimumEndDate = new Date(futureYear, futureMonth);
		return minimumEndDate;
	}
	
	function getPastDateByDays(daysInPast) {
		var daysToMsecFactor = 24*60*60*1000;
		return new Date(new Date() - daysInPast*daysToMsecFactor);
	}
	
	// To set colors
	var L1DaysAgo = getPastDateByDays(5);
	var L2DaysAgo = getPastDateByDays(21);
	
	function filterMarkerData(markerData, minimumEndDate, oldestPostDate) {
		var acceptData = true;
		
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
					acceptData = true;
				}
				else {
					acceptData = false;
				}
			}
		}
		else {
			var showUnknownDuration = true;
			if(durationParts.length==2 && durationParts[1].trim()=="Tills vidare.") {
				showUnknownDuration = false;
			}
			if(showUnknownDuration) {
				console.log("DEBUG: Unknown duration: '"+durationText+"'");
			}
		}
		//--------------------------------------------------------------
		// filter by age of data.
		if(acceptData) {
			var postDateStrParts = markerData["datetime"].split('-');
			//assert(postDateStrParts.length==3);
			var postDate = new Date(postDateStrParts[0], postDateStrParts[1]-1, postDateStrParts[2]);
			//markerData["postDate"] = postDate;
			markerData["iconColor"] = "red";
			if(postDate>L1DaysAgo) {
				markerData["iconColor"] = "green";
			} else if(postDate>L2DaysAgo) {
				markerData["iconColor"] = "yellow";
			}
			// Check the start date as well for ads that are posted well in advance.
			if(postDate < oldestPostDate) {
				acceptData = false;
			}
		}
		
		return acceptData;
	}

	//// Test filterMarkerData
	//var markerDataList = ResponseJSON;
	//for (var i = 0; i < markerDataList.length; i++) {
	//	console.log("DEBUG: filter("+markerDataList[i]["duration"]+"): '"+filterMarkerData(markerDataList[i])+"'");
	//}
	$('html').css('height', '100%');
	var the_body = $('body');
	the_body.css('min-height', '100%');
	$('#map_canvas').width(the_body.width());
	$('#map_canvas').height(the_body.height()-35);

	
	var monthsAhead = parseInt($('#i_monthsAhead').val());
	var daysInPast  = parseInt($('#i_daysInPast').val());
	var mapMarkerList = [];
	
	$('#filterBtn').bind("click", function() {
		monthsAhead = parseInt($('#i_monthsAhead').val());
		daysInPast  = parseInt($('#i_daysInPast').val());
		// Clear Markers
		for (var i = 0; i < mapMarkerList.length; i++) {
			mapMarkerList[i].setMap(null);
		}		
		mapMarkerList = [];
		// Re-draw
		setAndDrawMarkers();
	});
	
	// Remember to get the element id right otherwise, you might run into a "Uncaught TypeError: Cannot read property 'offsetWidth' of null" in the map api's main.js
	var map = new google.maps.Map(document.getElementById("map_canvas"), {
		center: new google.maps.LatLng(aCentralLat, aCentralLon),
		zoom: 13//,
		//mapTypeId: google.maps.MapTypeId.SATELLITE
	});
	var clickedInfo = false;
	var infoWindow = new google.maps.InfoWindow;
	
	setAndDrawMarkers();
	
	function getStandardMarkerIcon(color) {
		var markerColors = {
			"red": "FE7569", // Default
			"blue": "6991fd",
			"purple": "8e67fd",
			"yellow": "fdf569",
			"green": "00e64d"
		};
		var pinColor = markerColors[color];
		var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
			new google.maps.Size(21, 34),
			new google.maps.Point(0,0),
			new google.maps.Point(10, 34));
		//var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
		//	new google.maps.Size(40, 37),
		//	new google.maps.Point(0, 0),
		//	new google.maps.Point(12, 35));
		return pinImage;
	}
	
	function setAndDrawMarkers() {
		var minimumEndDate = getFutureDateByMonths(monthsAhead);
		var oldestPostDate = getPastDateByDays(daysInPast);
		console.log("DEBUG: minimumEndDate: '"+minimumEndDate+"'");
		console.log("DEBUG: oldestPostDate: '"+oldestPostDate+"'");
		var markerDataList = ResponseJSON;
		var svTodayRe = /Idag \(\d+:\d+\)/;
		for (var i = 0; i < markerDataList.length; i++) {
			var markerData = markerDataList[i];
			if(!filterMarkerData(markerData, minimumEndDate, oldestPostDate)) {
				continue;
			}
			var duration_str = markerData["duration"];
			duration_str = duration_str.replace( svTodayRe, markerData["datetime"] );
			//duration_str = duration_str.replace("Omg\u00e5ende -", markerData["datetime"]+" -");
			
			var name = markerData["item_id"];
			var address = markerData["street"];
			var type = markerData["category"];
			var id = markerData["item_id"];
			var gps_comps = markerData["gps"].split(",");
			var point = new google.maps.LatLng(
					parseFloat( gps_comps[0] ),
					parseFloat( gps_comps[1] )
				);
			var baseUrl = 'hand.se';
			baseUrl = 'http://www.andra' + baseUrl;
			var html = '<div class="map_tooltip"><b>' + type + '</b> ' + name;
			html += (markerData["furnished"])? " [F]": " [UF]";
			html += '<br/>';
			var showImages = false;
			if(markerData["image"] && showImages) {
				html += '<img class="preview_pic" src="'+baseUrl+markerData["image"]+'" /><br/>';
			}
			html += '<span class="address">' +address + '</span><br/>' + ' <br/> Rent: <strong>'+markerData["rent"] + '</strong> Size: '+markerData["size"] + ' / ' + markerData["rooms"] + ' <br/> Posted: ' + markerData["datetime"] + '<br/> Duration: ' + duration_str + '<br/>';
			var contact = markerData["contact"];
			if(contact != "") {
				html += 'Contact: '+contact+'<br/>';
			}
			html += '<a href="' + baseUrl + markerData["url"] + '" target="_new" >More Info</a>' ;
			html += '<span class="adicon adtype_'+categoryImageMap[type]+'"></span>';
			html += '</div>';
			
			//var icon = customIcons[type] || {};
			var marker = new google.maps.Marker({
					map : map,
					position : point,
					icon : getStandardMarkerIcon( markerData["iconColor"] ),
					//shadow : icon.shadow,
					//animation : google.maps.Animation.BOUNCE
				});
			mapMarkerList.push(marker);

			bindInfoWindow(marker, map, infoWindow, html);
		}
		$('#filterInfo').html("Showing " + mapMarkerList.length + " of " + markerDataList.length + ".");
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