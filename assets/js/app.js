var map, featureList, activeRecord;

var hiddenSystemFields = ["Created At", "Updated At", "Created By", "Updated By", "System Created At", "System Updated At", "Version", "Project", "Assigned To", "Latitude", "Longitude", "Gps Altitude", "Gps Horizontal Accuracy", "Gps Vertical Accuracy", "Gps Speed", "Gps Course", "Address Sub Thoroughfare", "Address Thoroughfare", "Address Locality", "Address Sub Admin Area", "Address Admin Area", "Address Postal Code", "Address Suite", "Address Country"];
var hiddenUserFields = ["Photos", "Photos Caption", "Videos", "Videos Caption", "Signatures", "Signatures Caption"];

var urlParams = {};

if (location.search) {
  var parts = location.search.substring(1).split("&");
  for (var i = 0; i < parts.length; i++) {
    var nv = parts[i].split("=");
    if (!nv[0]) continue;
    urlParams[nv[0]] = nv[1] || true;
  }
}

/* Basemap Layers */
var mapboxOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-6l9yntw9/{z}/{x}/{y}.jpg70", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});
var mapboxSat = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-xkumo5oi/{z}/{x}/{y}.jpg70", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});

/* Overlay Layers */
var highlight = L.geoJson(null);

var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true
});

var markers = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      title: feature.properties[decodeURI(urlParams.title_field)],
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var title = decodeURI(urlParams.title_field);
      var content = "<table class='table table-striped table-bordered table-condensed'>";
      $.each(feature.properties, function(index, prop) {
        if (prop === null) {
          prop = "";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/photos/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View photos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/videos/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View videos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/signatures/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View signatures</a>";
        }
        if ($.inArray(index, hiddenSystemFields) == -1 && $.inArray(index, hiddenUserFields) == -1 && index !== "Fulcrum Id") {
          content += "<tr><th>" + index + "</th><td>" + prop + "</td></tr>";
        }
      });
      content += "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties[title]);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          activeRecord = feature.properties["Fulcrum Id"];
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '"><td class="feature-name">' + layer.feature.properties[title] + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
    }
  }
});

$(document).on("click", ".feature-row", function(e) {
  sidebarClick(parseInt($(this).attr('id')));
});

$(document).ready(function() {
  fetchRecords();
  if (!urlParams.id) {
    alert('URL missing data share "id" parameter!');
  }
});

$("#refresh-btn").click(function() {
  fetchRecords();
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(markerClusters.getBounds());
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

$("#share-btn").click(function() {
  var link = location.toString() + "&fulcrum_id=" + activeRecord;
  $("#share-hyperlink").attr("href", link);
  $("#share-twitter").attr("href", "https://twitter.com/intent/tweet?url=" + link + "&via=fulcrumapp");
  $("#share-facebook").attr("href", "https://facebook.com/sharer.php?u=" + link);
});

function zoomToFeature(id) {
  markers.eachLayer(function (layer) {
    if (layer.feature.properties["Fulcrum Id"] == id) {
      map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 18);
      layer.fire("click");
    }
  });
}

function sidebarClick(id) {
  if (!map.hasLayer(markerClusters)) {
    map.addLayer(markerClusters);
  }
  var layer = markers.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 18);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function fetchRecords() {
  $("#loading").show();
  highlight.clearLayers();
  markers.clearLayers();
  markerClusters.clearLayers();
  $("#feature-list tbody").empty();
  $.getJSON("https://web.fulcrumapp.com/shares/" + urlParams.id + ".geojson?human_friendly=true", function (data) {
    markers.addData(data);
    markerClusters.addLayer(markers);
    featureList = new List("features", {valueNames: ["feature-name"]});
    featureList.sort("feature-name", {order:"asc"});
    $("#loading").hide();
  });
}

map = L.map("map", {
  zoom: 10,
  layers: [mapboxOSM, markerClusters, highlight],
  zoomControl: false
}).fitWorld();
map.attributionControl.setPrefix("Powered by <a href='http://fulcrumapp.com/' target='_blank'>Fulcrum</a>");

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": mapboxOSM,
  "Aerial Imagery": mapboxSat
};

var overlays = {
  "<span name='title'>Fulcrum Data</span>": markerClusters
};

var layerControl = L.control.layers(baseLayers, overlays, {
  collapsed: isCollapsed
}).addTo(map);


/* After GeoJSON loads */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  /* Update navbar & layer title from URL parameter */
  if (urlParams.title && urlParams.title.length > 0) {
    var title = decodeURI(urlParams.title);
    $("[name='title']").html(title);
  }
  /* Add navbar logo from URL parameter */
  if (urlParams.logo && urlParams.logo.length > 0) {
    $("#navbar-title").prepend("<img src='" + urlParams.logo + "'>");
  }

  $("#csv-download").attr("href", "https://web.fulcrumapp.com/shares/" + urlParams.id + ".csv");
  $("#geojson-download").attr("href", "https://web.fulcrumapp.com/shares/" + urlParams.id + ".geojson");
  $("#raw-kml-download").attr("href", "https://web.fulcrumapp.com/shares/" + urlParams.id + ".kml");
  $("#kml-feed-download").attr("href", "https://web.fulcrumapp.com/shares/" + urlParams.id + "feed");

  /* If fulcrum_id param passed in URL, zoom to feature, else fit to cluster bounds */
  if (urlParams.fulcrum_id && urlParams.fulcrum_id.length > 0) {
    zoomToFeature(urlParams.fulcrum_id);
  } else {
    map.fitBounds(markerClusters.getBounds());
  }
});
