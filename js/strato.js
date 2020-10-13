/*
**	strato.js
**	JavaScript to support the web interface
**  University of Southampton
**	Niccolo' Zapponi, nz1g10@soton.ac.uk, 12/04/2013
*/


/*
*
* Global variables
*
*/

var markersArray = [];
var customMarkersArray = [];
var landingMarkersArray = [];
var pathsArray = [];
var pathPointsArray = [];
var heatmap;
var zoomListener;
// var map;

/*
*
* General options
*
*/
var TILE_SIZE = 256;
var desiredRadiusPerPointInMeters = 5000;

var MAX_ALLOWED_FLIGHT_TIME = 144; // hours

/*
*
* Google Maps custom markers
*
*/
var customDot = new google.maps.MarkerImage('img/customDot.png',
	new google.maps.Size(20, 20),
	// The origin for this image is 0,0.
	new google.maps.Point(0, 0),
	// The anchor for this image
	new google.maps.Point(10, 10));

var launchDot = new google.maps.MarkerImage('img/launchDot.png',
	new google.maps.Size(20, 20),
	// The origin for this image is 0,0.
	new google.maps.Point(0, 0),
	// The anchor for this image
	new google.maps.Point(10, 10));

var landDot = new google.maps.MarkerImage('img/landDot.png',
	new google.maps.Size(20, 20),
	// The origin for this image is 0,0.
	new google.maps.Point(0, 0),
	// The anchor for this image
	new google.maps.Point(10, 10));

var burstDot = new google.maps.MarkerImage('img/burstDot.png',
	new google.maps.Size(20, 20),
	// The origin for this image is 0,0.
	new google.maps.Point(0, 0),
	// The anchor for this image
	new google.maps.Point(10, 10));

var floatDot = new google.maps.MarkerImage('img/floatDot.png',
	new google.maps.Size(20, 20),
	// The origin for this image is 0,0.
	new google.maps.Point(0, 0),
	// The anchor for this image
	new google.maps.Point(10, 10));


/*
*
* Page initialization
*
*/

$(document).ready(function () {

	// Load the map
	// var mapOptions = {
	//       center: new google.maps.LatLng(45.31, -2.2),
	//       zoom: 4,
	//       streetViewControl: false,
	//       mapTypeId: google.maps.MapTypeId.TERRAIN,
	//       scaleControl: true
	//     };
	// map = new google.maps.Map(document.getElementById("map_area"),
	//         mapOptions);

	// Load the marker Info Box
	infobox = new InfoBox({
		content: document.getElementById("infoBox"),
		disableAutoPan: false,
		maxWidth: 200,
		pixelOffset: new google.maps.Size(-50, 5),
		closeBoxURL: "img/close.png",
		closeBoxMargin: "2px -6px 2px 2px",
		zIndex: null,
		boxStyle: {
			opacity: 0.9,
			width: "250px"
		},
		infoBoxClearance: new google.maps.Size(1, 1)
	});

	// Load the event listener to manage zoom of heat maps
	google.maps.event.addListener(map, 'zoom_changed', function () {
		if ($('#view_heatmap').hasClass('selected_view')) {
			heatmap.setOptions({ radius: getNewHeatMapRadius() });
		}
	});

	// Populate drop downs of parachute and balloon
	for (option in parachutes) {
		value = parachutes[option];
		$('<option/>').val(option).text(value).appendTo($('#flightInfo_chutetype'));
	}
	for (category in balloons) {
		var option_group = $('<optgroup/>').attr("label", category).appendTo($('#flightInfo_balloonweight'));
		var cat_opts = balloons[category];
		for (option in cat_opts) {
			value = cat_opts[option];
			$('<option/>').val(option).text(value).appendTo(option_group);
		}
	}

	// Load the date picker
	$('#flightInfo_date').datetimepicker({
		showButtonPanel: false,
		altField: "#flightInfo_dateandtime",
		altFieldTimeOnly: false,
		altFormat: "dd/mm/yy",
		altTimeFormat: "HH:mm",
		useLocalTimezone: false,
		altSeparator: " ",
		minDate: -30,
		maxDate: +8,
		onSelect: function (selectedDate) {
			console.warn(selectedDate)
			$('#flightInfo_datetimeFull').val($('#flightInfo_date').datetimepicker('getDate'));
		}
	});

	// Set date and time to current time
	$('#flightInfo_date').datetimepicker('setDate', (new Date()));
	$('#flightInfo_datetimeFull').val($('#flightInfo_date').datetimepicker('getDate'));

	// Load all button sets with jQueryUI
	$('#flightInfo_gastype').buttonset();
	$('#weatherData_source').buttonset();
	$('#simSettings_flightType').buttonset();
	$('#weatherData_definition').buttonset();

	// Load all tooltips
	$('#weatherData_definition').tooltip();
	$('#flightInfo_trainequivdiam').tooltip();
	$('#weatherData_loadBtn').tooltip();
	$('#simSettings_flightType').tooltip();
	$('#gps_lat').tooltip();
	$('#custom_gps_lat').tooltip();
	$('#gps_lon').tooltip();
	$('#custom_gps_lon').tooltip();
	$('#runButton').tooltip();
	$('#flightInfo_nozzlelift').tooltip();
	$('#custom_marker').tooltip();
	$('#simSettings_flightTime').tooltip();
	$('#local_time').tooltip();

	// Load slider for simulation runs
	var slider_values = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400];
	$('#simSettings_slider').slider({
		value: 5,
		min: 0,
		max: slider_values.length - 1,
		range: "min",
		step: 1,
		slide: function (event, ui) {
			$("#simSettings_simRuns").val(slider_values[ui.value]);
			$("#simSettings_sliderIndex").val(ui.value);
			if (slider_values[ui.value] > 49) {
				$('#timeWarning').removeClass('hidden');
				$('#warning_minutes').html(Math.ceil(slider_values[ui.value] / 10));
			} else {
				$('#timeWarning').addClass('hidden');
			}
		}
	});
	$("#simSettings_simRuns").val(10);
	$("#simSettings_sliderIndex").val(5);

	// Load pretty scrollbar
	$('#left_bar').niceScroll({
		cursorborder: "none",
		cursorcolor: "#FFFFFF",
		scrollspeed: 10
	});

	// Load progress bar
	$('#simRunning_progressBar').progressbar({
		max: 100,
		value: 0.1
	});

	// Initialize section heights correctly
	$('#flightInfo').css('height', $('#flightInfo').height());
	$('#launchSite').css('height', $('#launchSite').height());
	$('#launchSite').addClass('closed');

	// Bind event to check whether the chosen sounding file is valid
	$('#weatherData_file').change(function () {
		if (validateFile()) {
			$('#weatherData_loadBtn').removeClass('inactive');
			$('#weatherData_loadBtn').removeClass('soundingLoaded');
			$('#weatherData_loadBtn').html('Load sounding');
			$('#weatherData_loadBtn').tooltip("disable");
			$('#weatherFileStatus').val('1');
		} else {
			$('#weatherData_loadBtn').addClass('inactive');
			$('#weatherData_loadBtn').tooltip("enable");
			$('#weatherFileStatus').val('0');
		}
	});

	// Load Google's Autocomplete feature to search for cities
	// and bind the event to update lat/lon data and place the marker on the map.
	var input_google_search = document.getElementById('launchSite_search');
	autocomplete = new google.maps.places.Autocomplete(input_google_search, { types: ['(cities)'] });
	google.maps.event.addListener(autocomplete, 'place_changed', function () {
		clearOverlays();
		var place = autocomplete.getPlace();
		$('#launchSite_lat').val(place.geometry.location.lat());
		$('#launchSite_lon').val(place.geometry.location.lng());
		getElevation(place.geometry.location, $('#launchSite_elev'));
		placeMarker(place.geometry.location, map, 'Balloon Launch Site', '', '', 'launch');
		updateCoords();
	});

	// Bind event to show or hide weather data options when source is selected
	$('#weatherData_source').click(function () {
		if ($('input[name=weatherSource]:checked', '#flightInfoForm').val() == 'online') {
			if (new Date() < new Date('2015-07-01')) {
				$('#weatherData').height(250);
			} else {
				$('#weatherData').height(165);
			}
			$('#weatherData_extra_sounding').addClass('weatherData_extraSection_closed');
			$('#weatherData_extra_forecast').removeClass('weatherData_extraSection_closed');
		} else {
			$('#weatherData').height(340);
			$('#weatherData_extra_sounding').removeClass('weatherData_extraSection_closed');
			$('#weatherData_extra_forecast').addClass('weatherData_extraSection_closed');
		}
	});

	// Initialize dialog to enter GPS coords of launch site
	$('#launchSite_pickgps').click(function () {
		$('#gps_lat').val('');
		$('#gps_lon').val('');
		$('#gps_lat').removeClass('field_error');
		$('#gps_lon').removeClass('field_error');
		$('#shader').zIndex(998);
		$('#gps_dialog').zIndex(999);
		$('#shader').removeClass('hidden');
		$('#gps_dialog').removeClass('hidden');
	});


	// Bind event to hide all dialogs when clicking on the shaded area
	$('#shader').click(function () {
		$('#shader').addClass('hidden');
		$('#gps_dialog').addClass('hidden');
		$('#custom_gps_dialog').addClass('hidden');
		$('#about_dialog').addClass('hidden');
		$('#tac_dialog').addClass('hidden');
		$('#credits_dialog').addClass('hidden');
		$('#shader').zIndex(-2);
		$('#gps_dialog').zIndex(-1);
		$('#custom_gps_dialog').zIndex(-1);
		$('#about_dialog').zIndex(-1);
		$('#credits_dialog').zIndex(-1);
		$('#tac_dialog').zIndex(-1);
	});

	// Bind event to toggle sim settings options when flight type is selected
	$('#simSettings_flightType').click(function () {
		if ($('input[name=flightType]:checked', '#flightInfoForm').val() == 'standard') {
			$('#simSettings').height(150);
		} else {
			$('#simSettings').height(250);
		}
	});

	// Bind event to check whether a valid sounding file has been selected before uploading it
	$('#weatherData_loadBtn').click(function () {
		if (!$(this).hasClass('inactive') && !$(this).hasClass('soundingLoaded')) {
			$('#flightInfoForm').submit();
		}
	});

	// Bind event to load the user's current location
	$('#launchSite_pickuserloc').click(function () {
		if (navigator.geolocation) {
			// Load the map
			let mapOptions = {
				center: new google.maps.LatLng(45.31, -2.2),
				zoom: 4,
				streetViewControl: false,
				mapTypeId: google.maps.MapTypeId.TERRAIN,
				scaleControl: true
			};
			let map = new google.maps.Map(document.getElementById("map_area"),
				mapOptions);
			navigator.geolocation.getCurrentPosition(function (position) {
				$('#text_lat').html('LOCALIZING...');
				clearOverlays();
				var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				placeMarker(myLatlng, map, 'Balloon Launch Site', '', '', 'launch');

				$('#launchSite_lat').val(position.coords.latitude);
				$('#launchSite_lon').val(position.coords.longitude);
				map2.flyTo({
					center: [
						$('#launchSite_lon').val(),
						$('#launchSite_lat').val()
					],
					essential: true // this animation is considered essential with respect to prefers-reduced-motion
				});

				getElevation(myLatlng, $('#launchSite_elev'));

				updateCoords();

			}, function () {
				alert('Your location could not be retrieved. Change your privacy settings to allow location services to use this feature.');
			});
		} else {
			alert('Your browser does not support location services.');
		}
	});

	// *********************************** //
	// Event handler to RUN THE SIMULATION
	$('#runButton').click(function () {
		if (!$(this).hasClass('inactive')) {

			$('#simRunning_progressBar').progressbar("value", 100);
			$('#simRunning').removeClass('hidden');
			$('#simRunning').addClass('running');

			var data = $('#flightInfoForm').serialize();

			// CREATE AJAX REQUEST
			$.ajax({
				url: 'simulate.php',
				data: data,
				cache: false,
				type: 'POST',
				error: function (xhr, status, errorThrown) {
					clearInterval(updater);
					$('#simRunning_caption').html('An error has occured!');
					setTimeout(function () { window.location.reload(false) }, 5000);
				}
			});


			// Create timed function to request and update of the simulation progress
			// and show it in the progress bar
			var updater = setInterval(function () {
				$.getJSON("get_data.php?f=progress", function (result) {
					if (result != null) {
						new_width = $('#simRunning_progressBar').width() * result.progress;
						$("#simRunning_progressBar .ui-progressbar-value").animate({ width: new_width }, 300);
						if (result.action == 0) {
							$('#simRunning_caption').html('The simulation is running...');
							document.title = Math.ceil(result.progress * 100) + "% - ASTRA High Altitude Balloon Flight Planner";
							if (result.progress == 1) {
								$('#simRunning_caption').html('Done! Loading results...');
								setTimeout(function () { load_data() }, 800);
								clearInterval(updater);
							}
						}
						if (result.action == 1)
							$('#simRunning_caption').html('Loading weather forecast');
						if (result.action == 2)
							$('#simRunning_caption').html('Initializing the simulation');
					}
				});
			}, 500);
		}
	});
	// *********************************** //


	// Event handler to validate form every time any information changes
	$(':input').change(function () {
		validateForm();
	});


	// Event handlers not to allow the user to use tab to go to next field if the section is over

	$('#flightInfo_trainequivdiam').keydown(function (objEvent) {
		if (objEvent.keyCode == 9) {   // tab pressed
			objEvent.preventDefault(); // stops its action
		}
	});

	$('#weatherData_soundingTime').keydown(function (objEvent) {
		if (objEvent.keyCode == 9) {   // tab pressed
			objEvent.preventDefault(); // stops its action
		}
	});

	$('#simSettings_flightTime').keydown(function (objEvent) {
		if (objEvent.keyCode == 9) {   // tab pressed
			objEvent.preventDefault(); // stops its action
		}
	});


	// Event handler to open and close sections
	$('.section_header').click(function () {
		$('.section_header').addClass('closed');
		$('.section').addClass('closed');
		$(this).removeClass('closed');
		$(this).parent().removeClass('closed');
	});

	// Event handler to activate launch site picking with mouse click
	$('#launchSite_pickbtn').click(function () {
		$('#launchSite_pickbtn').addClass('button_clicked');
		$('#launchSite_instruction').removeClass('hidden');
		map.setOptions({ draggableCursor: 'pointer' });
		clearOverlays();
		google.maps.event.addListener(map, 'click', function (e) {
			placeMarker(e.latLng, map, 'Balloon Launch Site', '', '', 'launch');
			$('#launchSite_lat').val(e.latLng.lat());
			$('#launchSite_lon').val(e.latLng.lng());
			getElevation(e.latLng, $('#launchSite_elev'));

			google.maps.event.clearListeners(map, 'click');
			map.setOptions({ draggableCursor: null });
			$('#launchSite_pickbtn').removeClass('button_clicked');
			$('#launchSite_instruction').addClass('hidden');
			updateCoords();
		});
	});

	// Event handler to let the user download CSV file
	$('#export_csv').click(function () {
		window.location.href = "get_data.php?f=csv";
	});

	// Event handler to let the user download KML file
	$('#export_kml').click(function () {
		window.location.href = "get_data.php?f=kml";
	});

	// Event handler to switch view to heat map
	$('#view_heatmap').click(function () {
		$('#view_paths').removeClass('selected_view');
		$('#view_heatmap').addClass('selected_view');

		// Remove paths and markers from map
		for (var i = 0; i < markersArray.length; i++) {
			markersArray[i].setMap(null);
		}
		for (var i = 0; i < pathsArray.length; i++) {
			pathsArray[i].setMap(null);
		}

		heatmap.setMap(map);
		heatmap.setOptions({ radius: getNewHeatMapRadius() });

	});

	// Event handler to switch view to path lines
	$('#view_paths').click(function () {
		$('#view_heatmap').removeClass('selected_view');
		$('#view_paths').addClass('selected_view');

		// Remove paths and markers from map
		for (var i = 0; i < markersArray.length; i++) {
			markersArray[i].setMap(map);
		}
		for (var i = 0; i < pathsArray.length; i++) {
			pathsArray[i].setMap(map);
		}

		heatmap.setMap(null);
	});

	// Event handler to let the user add a custom marker to the map
	$('#custom_marker').click(function () {
		$('#custom_gps_lat').val('');
		$('#custom_gps_lon').val('');
		$('#custom_gps_name').val('');
		$('#custom_gps_lat').removeClass('field_error');
		$('#custom_gps_lon').removeClass('field_error');
		$('#shader').zIndex(998);
		$('#custom_gps_dialog').zIndex(999);
		$('#shader').removeClass('hidden');
		$('#custom_gps_dialog').removeClass('hidden');
	});

	// Event handler to save custom marker
	$('#custom_gps_save').click(function () {
		// Check if the GPS coordinates are valid
		if (validateGps($('#custom_gps_lat'), $('#custom_gps_lon'))) {
			// Hide the dialog and the shader
			$('#shader').addClass('hidden');
			$('#custom_gps_dialog').addClass('hidden');
			$('#shader').zIndex(-2);
			$('#custom_gps_dialog').zIndex(-1);


			//
			// Name the marker Custom marker, if no name is entered
			//
			if ($('#custom_gps_name').val() == '') {
				var customMarkerTitle = 'Custom marker';
			} else {
				var customMarkerTitle = $('#custom_gps_name').val();
			}

			//
			// Give a marker subtitle with the GPS coordinates
			//
			var customMarkerSubtitle = 'Lat: ' + $('#custom_gps_lat').val() + ', Lon: ' + $('#custom_gps_lon').val();

			//
			// Place the marker on the map
			//
			var markerLocation = new google.maps.LatLng($('#custom_gps_lat').val(), $('#custom_gps_lon').val());

			var marker = new google.maps.Marker({
				position: markerLocation,
				map: map,
				icon: customDot,
				title: customMarkerTitle
			});
			marker.setZIndex(999);

			//
			// Store the marker in the global custom markers array
			//
			customMarkersArray.push(marker);
			var markerid = customMarkersArray.length - 1;

			//
			// Handle the click on the marker to show up the correct information
			//
			google.maps.event.addListener(marker, 'click', function () {
				$('#infoBox_title').html(customMarkerTitle);
				$('#infoBox_subtitle').html(customMarkerSubtitle);
				$('#infoBox_content').css('margin-top', '5px');
				$('#infoBox_content').html('<div class="custom_marker_delete" onclick="removeMarker(' + markerid + ');">Remove</div>');
				infobox.open(map, this);
				infobox.show();
				map.panTo(marker.position);
			});

			//
			// Center the map on the newly created marker
			//
			map.panTo(markerLocation);
		}
	});

	// Event handler to open the about dialog
	$('#open_about_dialog').click(function () {
		$('#shader').trigger('click');
		$('#shader').zIndex(998);
		$('#about_dialog').zIndex(999);
		$('#shader').removeClass('hidden');
		$('#about_dialog').removeClass('hidden');
		return false;
	});

	// Event handler to open the credits dialog
	$('#open_credits_dialog').click(function () {
		$('#shader').trigger('click');
		$('#shader').zIndex(998);
		$('#credits_dialog').zIndex(999);
		$('#shader').removeClass('hidden');
		$('#credits_dialog').removeClass('hidden');
		return false;
	});

	// Event handler to open the terms and conditions dialog
	$('#open_tac_dialog').click(function () {
		$('#shader').trigger('click');
		$('#shader').zIndex(998);
		$('#tac_dialog').zIndex(999);
		$('#shader').removeClass('hidden');
		$('#tac_dialog').removeClass('hidden');
		return false;
	});

	// Event handlers to allow the user to submit GPS coordinates with the Enter key

	$('#gps_lat').keydown(function (objEvent) {
		if (objEvent.keyCode == 13) {
			$('#gps_save').trigger('click');
		}
	});

	$('#gps_lon').keydown(function (objEvent) {
		if (objEvent.keyCode == 13) {
			$('#gps_save').trigger('click');
		}
	});

	$('#custom_gps_lat').keydown(function (objEvent) {
		if (objEvent.keyCode == 13) {
			$('#custom_gps_save').trigger('click');
		}
	});

	$('#custom_gps_lon').keydown(function (objEvent) {
		if (objEvent.keyCode == 13) {
			$('#custom_gps_save').trigger('click');
		}
	});

	$('#custom_gps_name').keydown(function (objEvent) {
		if (objEvent.keyCode == 13) {
			$('#custom_gps_save').trigger('click');
		}
	});

});


/* ***********************************
*
*  Function to LOAD THE SIMULATION RESULTS
*
*/
function load_data() {
	// Delete all current markers and leave only the launch site
	clearOverlays();
	$('#view_heatmap').removeClass('selected_view');
	$('#view_paths').addClass('selected_view');
	if (typeof heatmap !== "undefined") {
		heatmap.setMap(null);
	}


	var myLatlng = new google.maps.LatLng($('#launchSite_lat').val(), $('#launchSite_lon').val());
	placeMarker(myLatlng, map, 'Balloon Launch Site', '', '', 'launch');


	// Retrieve results
	$.ajax({
		url: "get_data.php?f=json",
		dataType: "json",
		error: function (xhr, status, errorThrown) {
			if (typeof (updater) !== 'undefined') {
				clearInterval(updater);
			}
			$('#simRunning_caption').html('An error has occured!');
			setTimeout(function () { window.location.reload(false) }, 5000);
		}
	}).done(function (json) {
		// THIS IS WHERE DATA IS LOADED

		// Place landing markers on map, if available (floating flights don't)
		if (typeof (json.landingMarkers) !== 'undefined') {
			$.each(json.landingMarkers, function (markerNumber, markerInformation) {
				var myLatlng = new google.maps.LatLng(markerInformation.lat, markerInformation.lng);
				var markerSubtitle = "Simulation " + markerInformation.simNumber;
				placeMarker(myLatlng, map, markerInformation.label, markerSubtitle, markerInformation.otherData, 'land');
				landingMarkersArray.push(myLatlng);
			});
		}

		// Place burst markers on map, if available (floating flights don't)
		if (typeof (json.burstMarkers) !== 'undefined') {
			$.each(json.burstMarkers, function (markerNumber, markerInformation) {
				var myLatlng = new google.maps.LatLng(markerInformation.lat, markerInformation.lng);
				var markerSubtitle = "Simulation " + markerInformation.simNumber;
				placeMarker(myLatlng, map, markerInformation.label, markerSubtitle, markerInformation.otherData, 'burst');
			});
		}

		// Place float markers on map, if available (standard flights don't)
		if (typeof (json.floatMarkers) !== 'undefined') {
			$.each(json.floatMarkers, function (markerNumber, markerInformation) {
				var myLatlng = new google.maps.LatLng(markerInformation.lat, markerInformation.lng);
				var markerSubtitle = "Simulation " + markerInformation.simNumber;
				placeMarker(myLatlng, map, markerInformation.label, markerSubtitle, markerInformation.otherData, 'float');
			});
		}

		// Place flight paths on map
		$.each(json.flightPaths, function (lineNumber, lineInformation) {
			var linePointCoordinates = [];
			$.each(lineInformation.points, function (pointNumber, pointInfo) {
				linePointCoordinates.push(new google.maps.LatLng(pointInfo.lat, pointInfo.lng));
				pathPointsArray.push(new google.maps.LatLng(pointInfo.lat, pointInfo.lng));
			});

			var flightPath = new google.maps.Polyline({
				path: linePointCoordinates,
				strokeColor: "#0000FF",
				strokeOpacity: 0.8,
				strokeWeight: 1.5
			});

			flightPath.setMap(map);
			pathsArray.push(flightPath);
		});

		// Generate a heat map of the landing sites
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: landingMarkersArray,
			opacity: 0.6,
			maxIntensity: landingMarkersArray.length / 7
		});
		zoomToFit();

		// Remove the "sim running" overlay
		$('#simRunning').removeClass('running');
		$('#simRunning').addClass('hidden');
		setTimeout(function () { $('#simRunning_caption').html('Starting the simulation...') }, 1000);
		// Show view options
		$('#options_menu').removeClass('hidden');
		// Show hint for 4.5 seconds
		setTimeout(function () { $('#click_instruction').removeClass('hidden') }, 1500);
		setTimeout(function () { $('#click_instruction').addClass('hidden') }, 6000);
		// Reset the correct title
		document.title = "DONE - ASTRA High Altitude Balloon Flight Planner";
		setTimeout(function () { document.title = "ASTRA High Altitude Balloon Flight Planner" }, 5000);
	});


}
/* *********************************** */

/*
*
* Function to place a marker on the map with an info box
*
*/
function placeMarker(position, map, markerTitle, infoSubtitle, infoContent, markerType) {

	if (markerType == 'launch')
		var markerIcon = launchDot;
	if (markerType == 'land')
		var markerIcon = landDot;
	if (markerType == 'burst')
		var markerIcon = burstDot;
	if (markerType == 'float')
		var markerIcon = floatDot;

	var marker = new google.maps.Marker({
		position: position,
		map: map,
		icon: markerIcon,
		title: markerTitle
	});

	google.maps.event.addListener(marker, 'click', function () {
		$('#infoBox_title').html(markerTitle);
		$('#infoBox_subtitle').html(infoSubtitle);
		if (infoContent == '') {
			$('#infoBox_content').css('margin-top', '0px');
			$('#infoBox_content').html('');
		} else {
			$('#infoBox_content').css('margin-top', '5px');
			$('#infoBox_content').html(infoContent);
		}
		infobox.open(map, this);
		infobox.show();
		map.panTo(marker.position);
	});
	map.panTo(position);
	markersArray.push(marker);
}

/*
*
* Function to request the elevation of a location to Google
* (mostly used to get the launch site altitude)
* Returns the elevation in meters.
*/
function getElevation(location, field) {
	var out = $(field);

	// Get elevation
	elevator = new google.maps.ElevationService();
	var locations = [];
	locations.push(location);

	// Create a LocationElevationRequest object
	var positionalRequest = {
		'locations': locations
	}

	// Initiate the location request
	elevator.getElevationForLocations(positionalRequest, function (results, status) {
		if (status == google.maps.ElevationStatus.OK) {
			// Retrieve the first result
			if (results[0]) {
				if (results[0].elevation < 0) {
					out.val(0);
				} else {
					out.val(results[0].elevation);
				}
			} else {
				out.val(0);
			}
		} else {
			out.val(0);
		}
	});
}

/*
*
* Function to delete all the data from the map except the custom markers
* (used to update the map without keeping old stuff)
*
*/
function clearOverlays() {
	for (var i = 0; i < markersArray.length; i++) {
		markersArray[i].setMap(null);
	}
	for (var i = 0; i < pathsArray.length; i++) {
		pathsArray[i].setMap(null);
	}
	markersArray = [];
	landingMarkersArray = [];
	pathsArray = [];
	pathPointsArray = [];
}

/*
*
* Function to zoom the map to fit all the markers defined in markersArray
*
*/
function zoomToFit() {
	// Zoom map to markers
	var latlngbounds = new google.maps.LatLngBounds();
	for (var i = 0; i < markersArray.length; i++) {
		latlngbounds.extend(markersArray[i].position);
	}
	for (var i = 0; i < pathPointsArray.length; i++) {
		latlngbounds.extend(pathPointsArray[i]);
	}
	map.fitBounds(latlngbounds);
}

/*
*
* Function to update the coords fields
*
*/
function updateCoords() {
	$('#text_lat').html('Latitude: ' + $('#launchSite_lat').val().substring(0, 8));
	$('#text_lon').html('Longitude: ' + $('#launchSite_lon').val().substring(0, 8));
}

/*
*
* Function to manage form validation
*
*/
function validateForm() {
	if (checkFields() == false) {
		$('#runButton').addClass('inactive');
		$('#runButton').tooltip("enable");
		console.log("check false")

	} else {
		console.log("check true")
		$('#runButton').removeClass('inactive');
		$('#runButton').tooltip("disable");
	}
}

/*
*
* Function to check that the extension of the file is correct prior to uploading
*
*/
function validateFile() {
	if (validateNotEmpty($('#weatherData_file').val()) == false) {
		return false;
	} else {
		var parts = $('#weatherData_file').val().split('.');
		var extension = parts[parts.length - 1];
		switch (extension.toLowerCase()) {
			case 'sounding':
			case 'ftr':
				return true;
		}
		return false;
	}
}

/*
*
* Function that validates all form fields
*
*/
function checkFields() {
	var all_correct = true;
	if (validateNotEmpty($('#flightInfo_chutetype').val()) == false) {
		all_correct = false;
	}

	if ($('#flightInfo_balloonweight').val() == '0') {
		all_correct = false;
	}

	if (validateNumeric($('#flightInfo_payloadweight').val()) == false) {
		all_correct = false;
	} else {
		if ($('#flightInfo_payloadweight').val() <= 0) {
			all_correct = false;
			$('#flightInfo_payloadweight').addClass('mainfield_error');
		} else {
			$('#flightInfo_payloadweight').removeClass('mainfield_error');
		}
	}

	if (validateNumeric($('#flightInfo_nozzlelift').val()) == false) {
		all_correct = false;
	}

	if (validateNumeric($('#flightInfo_trainequivdiam').val()) == false) {
		all_correct = false;
	} else {
		if ($('#flightInfo_trainequivdiam').val() <= 0) {
			all_correct = false;
			$('#flightInfo_trainequivdiam').addClass('mainfield_error');
		} else {
			$('#flightInfo_trainequivdiam').removeClass('mainfield_error');
		}
	}

	if (validateNotEmpty($('#launchSite_lat').val()) == false) {
		all_correct = false;
	}

	if (validateNotEmpty($('#launchSite_lon').val()) == false) {
		all_correct = false;
	}

	if (validateNotEmpty($('#launchSite_elev').val()) == false) {
		all_correct = false;
	}

	if (!$("input[name='weatherSource']:checked", '#flightInfoForm').val()) {
		all_correct = false;
	} else {
		if ($("input[name='weatherSource']:checked", '#flightInfoForm').val() == 'sounding') {
			if ($('#weatherFileStatus').val() != "2") {
				all_correct = false;
			}
			if (validateNumeric($('#weatherData_temperature').val()) == false) {
				all_correct = false;
			}

			if (validateNumeric($('#weatherData_soundingDistance').val()) == false) {
				all_correct = false;
			} else {
				if ($('#weatherData_soundingDistance').val() < 0) {
					all_correct = false;
					$('#weatherData_soundingDistance').addClass('mainfield_error');
				} else {
					$('#weatherData_soundingDistance').removeClass('mainfield_error');
				}
			}

			if (validateNumeric($('#weatherData_soundingTime').val()) == false) {
				all_correct = false;
			} else {
				if ($('#weatherData_soundingTime').val() < 0) {
					all_correct = false;
					$('#weatherData_soundingTime').addClass('mainfield_error');
				} else {
					$('#weatherData_soundingTime').removeClass('mainfield_error');
				}
			}
		}
	}

	if ($("input[name='flightType']:checked", '#flightInfoForm').val() == 'floating') {
		if (validateNumeric($('#simSettings_floatAlt').val()) == false) {
			all_correct = false;
		} else {
			if ($('#simSettings_floatAlt').val() <= 0) {
				all_correct = false;
				$('#simSettings_floatAlt').addClass('mainfield_error');
			} else {
				$('#simSettings_floatAlt').removeClass('mainfield_error');
			}
		}

		if (validateNumeric($('#simSettings_flightTime').val()) == false) {
			all_correct = false;
		}

		if ((validateNotEmpty($('#simSettings_flightTime').val())) && ($('#simSettings_flightTime').val() > MAX_ALLOWED_FLIGHT_TIME || $('#simSettings_flightTime').val() <= 0)) {
			all_correct = false;
			$('#simSettings_flightTime').addClass('mainfield_error');
			$('#simSettings_flightTime').attr('title', 'Warning: the maximum allowed flight time is ' + MAX_ALLOWED_FLIGHT_TIME + ' hours!');
			$('#simSettings_flightTime').tooltip("enable");
		} else {
			$('#simSettings_flightTime').removeClass('mainfield_error');
			$('#simSettings_flightTime').tooltip("disable");
		}
	}

	if ((validateNotEmpty($('#flightInfo_nozzlelift').val())) && ($('#flightInfo_nozzlelift').val() - $('#flightInfo_payloadweight').val()) <= 0) {
		all_correct = false;
		$('#flightInfo_nozzlelift').addClass('mainfield_error');
		$('#flightInfo_nozzlelift').attr('title', 'Warning: the nozzle lift has to be greater than the payload weight!');
		$('#flightInfo_nozzlelift').tooltip("enable");
	} else {
		$('#flightInfo_nozzlelift').removeClass('mainfield_error');
		$('#flightInfo_nozzlelift').tooltip("disable");
	}

	return all_correct;
}

/*
*
* Function to validate GPS coordinates
*
*/
function validateGps(lat_field, lon_field) {
	lat_f = $(lat_field);
	lon_f = $(lon_field);

	var lat_err = 0;
	var lon_err = 0;
	lat_f.removeClass('field_error');
	lon_f.removeClass('field_error');
	if (validateNumeric(lat_f.val()) == false) {
		lat_err = 1;
	} else {
		if (lat_f.val() > 90 || lat_f.val() < -90) {
			lat_err = 1;
		}
	}
	if (validateNumeric(lon_f.val()) == false) {
		lon_err = 1;
	} else {
		if (lon_f.val() > 180 || lon_f.val() < -180) {
			lon_err = 1;
		}
	}

	if (lat_err == 1) {
		lat_f.addClass('field_error');
	}
	if (lon_err == 1) {
		lon_f.addClass('field_error');
	}
	if (lat_err == 1 || lon_err == 1) {
		return false;
	}
	return true;
}

/*
*
* Function to remove a custom marker
*
*/
function removeMarker(id) {
	customMarkersArray[id].setMap(null);
	infobox.hide();
}


/*
*
* Mercator projection functions
*
*/


//Mercator --BEGIN--
function bound(value, opt_min, opt_max) {
	if (opt_min !== null) value = Math.max(value, opt_min);
	if (opt_max !== null) value = Math.min(value, opt_max);
	return value;
}

function degreesToRadians(deg) {
	return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
	return rad / (Math.PI / 180);
}

function MercatorProjection() {
	this.pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2, TILE_SIZE / 2);
	this.pixelsPerLonDegree_ = TILE_SIZE / 360;
	this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
}

MercatorProjection.prototype.fromLatLngToPoint = function (latLng, opt_point) {
	var me = this;
	var point = opt_point || new google.maps.Point(0, 0);
	var origin = me.pixelOrigin_;

	point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

	// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
	// 89.189.  This is about a third of a tile past the edge of the world
	// tile.
	var siny = bound(Math.sin(degreesToRadians(latLng.lat())), - 0.9999, 0.9999);
	point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
	return point;
};

MercatorProjection.prototype.fromPointToLatLng = function (point) {
	var me = this;
	var origin = me.pixelOrigin_;
	var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
	var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
	var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
	return new google.maps.LatLng(lat, lng);
};

//Mercator --END--

/*
*
* Function to calculate the new heat map radius
*
*/
function getNewHeatMapRadius() {
	var numTiles = 1 << map.getZoom();
	var center = map.getCenter();
	var moved = google.maps.geometry.spherical.computeOffset(center, 10000, 90);
	var projection = new MercatorProjection();
	var initCoord = projection.fromLatLngToPoint(center);
	var endCoord = projection.fromLatLngToPoint(moved);
	var initPoint = new google.maps.Point(initCoord.x * numTiles, initCoord.y * numTiles);
	var endPoint = new google.maps.Point(endCoord.x * numTiles, endCoord.y * numTiles);
	var pixelsPerMeter = (Math.abs(initPoint.x - endPoint.x)) / 10000.0;
	var totalPixelSize = Math.floor(desiredRadiusPerPointInMeters * pixelsPerMeter);
	return totalPixelSize;
}

