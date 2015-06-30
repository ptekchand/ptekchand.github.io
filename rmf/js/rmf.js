/**
 * RoomMateFinder
 */
var RMF = {
	map: {},
	clickedInfo: false,
	
	// Assuming index 0 is the visitor. "me"
	peopleAreaData: [
		{
			"person": 1,
			"center": [59.312768,18.0735245],
			"radius": 5000
		},
		{
			"person": 2,
			"center": [59.416615,17.9331547],
			"radius": 7000
		},
		{
			"person": 3,
			"center": [59.316756,17.9859225],
			"radius": 3000
		}
	],

	aptDataList: [],
	
	
	Init: function() {
		var aCentralLat = 59.312768;
		var aCentralLon = 18.0735245;

		// Remember to get the element id right otherwise, you might run into a "Uncaught TypeError: Cannot read property 'offsetWidth' of null" in the map api's main.js
		RMF.map = new google.maps.Map(document.getElementById("map_canvas"), {
			center: new google.maps.LatLng(aCentralLat, aCentralLon),
			zoom: 12//,
			//mapTypeId: google.maps.MapTypeId.SATELLITE
		});
		
		RMF.aptDataList = ResponseJSON;

		RMF.DrawMarkers();
		var overlapIndices = RMF.FindOverlaps();
		if(overlapIndices!==false) {
			RMF.FindCommonApartments(overlapIndices);
		}
		
		RMF.map.controls[google.maps.ControlPosition.RIGHT_TOP].push( 
			document.getElementById('map_legend')
		);
	},

	
	FindOverlaps: function() {
		if(RMF.peopleAreaData.length == 1) {
			return false;
		}
		overlapIndices = [];
		// Find all the other people who are within my preferred search range and I'm in theirs.
		var myPreference = RMF.peopleAreaData[0];
		var myLatLng = new google.maps.LatLng(myPreference["center"][0], myPreference["center"][1])
		for (var i = 0; i < RMF.peopleAreaData.length; i++) {
			var personData = RMF.peopleAreaData[i];
			
			var blue = '#2E2EFE'; // Me
			
			var yellow = '#F7FE2E'; // Others
			var green = '#2EFE2E'; // Others with potential overlaps
			
			var baseColor = (i==0)? blue: yellow;

			var theLatLng = new google.maps.LatLng(personData["center"][0], personData["center"][1]);
			personData["LatLng"] = theLatLng;
			if(i>0) {
				var distance = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, theLatLng); // Remember to load the geometry library
				if( distance <= myPreference["radius"]+personData["radius"] ) {
					baseColor = green;
					overlapIndices.push( i );
				}
			}

			var circleOptions = {
			  strokeColor: baseColor,
			  strokeOpacity: 0.7,
			  strokeWeight: 1,
			  fillColor: baseColor,
			  fillOpacity: 0.35,
			  map: RMF.map,
			  center: theLatLng,
			  radius: personData["radius"]
			};
			
			personCircle = new google.maps.Circle(circleOptions);
		}
		
		return overlapIndices;
	},
	
	
	FindCommonApartments: function(overlapIndices) {
		
		var myPreference = RMF.peopleAreaData[0]; // Move up to RMF.
		var myLatLng = new google.maps.LatLng(myPreference["center"][0], myPreference["center"][1])

		for (var p=0; p<overlapIndices.length; p++) {
			var personData = RMF.peopleAreaData[ overlapIndices[p] ];
			
			for (var i = 0; i < RMF.aptDataList.length; i++) {
				var markerData = RMF.aptDataList[i];
				var distanceMe = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, markerData["LatLng"]); // Remember to load the geometry library
				if( distanceMe <= myPreference["radius"] ) {
					var distancePerson = google.maps.geometry.spherical.computeDistanceBetween(personData["LatLng"], markerData["LatLng"]); // Remember to load the geometry library
					if( distancePerson <= personData["radius"] ) {
						markerData["marker"].setIcon( RMF.GetStandardMarkerIcon( "green" ) );
					}
				}
			}
		}
	},
	
	GetStandardMarkerIcon: function(color) {
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
	},
	
	// Apartment location markers from "various sources"
	DrawMarkers: function() {
		var infoWindow = new google.maps.InfoWindow;

		for (var i = 0; i < RMF.aptDataList.length; i++) {
			var markerData = RMF.aptDataList[i];
			//if(!filterMarkerData(markerData)) {
			//	continue;
			//}
			var duration_str = markerData["duration"];
			
			var name = markerData["item_id"];
			var address = markerData["street"];
			var type = markerData["category"];
			var id = markerData["item_id"];
			var gps_comps = markerData["gps"].split(",");
			var point = new google.maps.LatLng(
					parseFloat( gps_comps[0] ),
					parseFloat( gps_comps[1] )
				);
			markerData["LatLng"] = point;
			var baseUrl = 'hand.se';
			baseUrl = 'http://www.andra' + baseUrl;
			var html = '<div class="map_tooltip"><b>' + type + '</b> ' + name + '<br/>';
			var showImages = false;
			if(markerData["image"] && showImages) {
				html += '<img class="preview_pic" src="'+baseUrl+markerData["image"]+'" /><br/>';
			}
			html += '<span class="address">' +address + '</span><br/>' + ' <br/> Rent: <strong>'+markerData["rent"] + '</strong> Size: ' + markerData["size"] + ' / ' + markerData["rooms"] + ' <br/> Posted: ' + markerData["datetime"] + '<br/> Duration: ' + duration_str + '<br/>';
			var contact = markerData["contact"];
			if(contact != "") {
				html += 'Contact: '+contact+'<br/>';
			}
			html += '<a href="' + baseUrl + markerData["url"] + '" target="_new" >More Info</a>' ;
			//html += '<span class="adicon adtype_'+categoryImageMap[type]+'"></span>';
			html += '</div>';
			
			//var icon = customIcons[type] || {};
			var marker = new google.maps.Marker({
					map : RMF.map,
					position : point//,
					//icon : icon.icon,
					//shadow : icon.shadow,
					//animation : google.maps.Animation.BOUNCE
				});

			markerData["marker"] = marker;
			RMF.BindMarkerEvents(marker, RMF.map, infoWindow, html);
		}
	},
	
	BindMarkerEvents: function(marker, map, infoWindow, html) {
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.setContent(html);
			infoWindow.open(map, marker);
			RMF.clickedInfo = true;
		});
		google.maps.event.addListener(infoWindow, 'closeclick', function () {
			RMF.clickedInfo = false;
		});
		google.maps.event.addListener(marker, 'mouseover', function () {
			if(!RMF.clickedInfo) {
				infoWindow.setContent(html);
				infoWindow.open(map, marker);
			}
		});
		google.maps.event.addListener(marker, 'mouseout', function () {
			if(!RMF.clickedInfo) {
				infoWindow.close();
			}
		});
	}
};

jQuery(document).ready(function() {

	var legendJq = $('#map_legend');
	legendJq.find('li').hide();
	var shownPoints = 0;
	function showNext() {
		shownPoints++;
		var theLi = legendJq.find('li');
		for(var l=0;l<theLi.length; l++) {
			if(l<shownPoints) {
				$(theLi[l]).show();
			}
		}
	}
	showNext();
	$('#legend_next').click( showNext );
	
	RMF.Init();

});