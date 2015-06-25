jQuery(document).ready(function() {
	var categoryList = ["Annat", "Fritidshus", "L\u00e4genhet", "Radhus", "Rum", "Villa"];
	var categoryImageMap = {"Annat":"5", "Fritidshus":"6", "L\u00e4genhet":"2", "Radhus":"3", "Rum":"1", "Villa":"4"};
	//var baseImage = "img/ah_adtypes/adtype_";
	var aCentralLat = 59.312768;
	var aCentralLon = 18.0735245;
	// Remember to get the element id right otherwise, you might run into a "Uncaught TypeError: Cannot read property 'offsetWidth' of null" in the map api's main.js
	var map = new google.maps.Map(document.getElementById("map_canvas"), {
		center: new google.maps.LatLng(aCentralLat, aCentralLon),
		zoom: 13//,
		//mapTypeId: google.maps.MapTypeId.SATELLITE
	});
	var clickedInfo = false;
	var infoWindow = new google.maps.InfoWindow;
	var markers = ResponseJSON;
	for (var i = 0; i < markers.length; i++) {
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
		html += '<span class="address">' +address + '</span><br/>' + ' <br/> Rent: <strong>'+markers[i]["rent"] + '</strong> Size: '+markers[i]["size"] + ' / ' + markers[i]["rooms"] + ' <br/> Posted: ' + markers[i]["datetime"] + '<br/> Duration: ' + markers[i]["duration"] + '<br/>';
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