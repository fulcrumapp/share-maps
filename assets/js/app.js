var map, autoRefresh, featureList, activeRecord, titleField, cluster;
var hiddenSystemFields = ["marker-color", "Created At", "Updated At", "Created By", "Updated By", "System Created At", "System Updated At", "Version", "Assigned To", "Latitude", "Longitude", "Gps Altitude", "Gps Horizontal Accuracy", "Gps Vertical Accuracy", "Gps Speed", "Gps Course", "Address Sub Thoroughfare", "Address Thoroughfare", "Address Locality", "Address Sub Admin Area", "Address Admin Area", "Address Postal Code", "Address Suite", "Address Country"];
var userFields = [];
var legendItems = {};

/* Get URL parameters */
var urlParams = {};

if (location.search) {
  var parts = location.search.substring(1).split("&");
  for (var i = 0; i < parts.length; i++) {
    var nv = parts[i].split("=");
    if (!nv[0]) continue;
    urlParams[nv[0]] = nv[1] || true;
  }
}

if (urlParams.title_field) {
  titleField = decodeURI(urlParams.title_field);
} else {
  titleField = "Fulcrum Id";
}

if (urlParams.fields) {
  fields = urlParams.fields.split(",");
  $.each(fields, function(index, field) {
    field = decodeURI(field);
    userFields.push(field);
  });
}

if (urlParams.cluster && (urlParams.cluster === "false" || urlParams.cluster === "False" || urlParams.cluster === "0")) {
  cluster = false;
} else {
  cluster = true;
}

/* Basemap Layers */
var cartoVoyager = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png", {
  maxZoom: 19,
  subdomains: ["a", "b", "c"],
  attribution: 'Basemap © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>'
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
      title: feature.properties[titleField],
      riseOnHover: true,
      icon: L.icon({
        iconUrl: "assets/img/markers/cb0d0c.png",
        iconSize: [30, 40],
        iconAnchor: [15, 32]
      })
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var title = titleField;
      var content = "<table class='table table-striped table-bordered table-condensed'>";
      $.each(feature.properties, function(index, prop) {
        if (prop === null) {
          prop = "";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/photos/") === 0) {
          prop = "<a href='#' onclick='photoGallery(\"" + prop + "\"); return false;'>View Photos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/videos/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View videos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/signatures/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View signatures</a>";
        } else if (prop.toString().indexOf("https://") === 0 || prop.toString().indexOf("http://") === 0) {
          prop = "<a href='" + prop + "' target='blank'>" + prop + "</a>";
        }
        if (userFields.length > 0) {
          if ($.inArray(index, hiddenSystemFields) == -1 && $.inArray(index, userFields) !== -1 && index !== "Fulcrum Id") {
            content += "<tr><th>" + index + "</th><td>" + prop + "</td></tr>";
          }
        } else {
          if ($.inArray(index, hiddenSystemFields) == -1 && index !== "Fulcrum Id") {
            content += "<tr><th>" + index + "</th><td>" + prop + "</td></tr>";
          }
        }
      });
      if (feature.properties["marker-color"]) {
        layer.setIcon(
          L.icon({
            iconUrl: "assets/img/markers/" + feature.properties["marker-color"].replace("#",'').toLowerCase() + ".png",
            iconSize: [30, 40],
            iconAnchor: [15, 32]
          })
        );
        legendItems[feature.properties.Status] = feature.properties["marker-color"];
      }
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
  sidebarClick(parseInt($(this).attr("id"), 10));
});

$(document).ready(function() {
  if (!urlParams.id) {
    alert("URL missing data share 'id' parameter!");
  } else {
    fetchRecords();
  }
});

$("#refresh-btn").click(function() {
  fetchRecords();
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#auto-refresh").click(function() {
  fetchRecords();
  if ($(this).prop("checked")) {
    autoRefresh = window.setInterval(fetchRecords, 60 * 1000);
  } else {
    clearInterval(autoRefresh);
  }
});

$("#full-extent-btn").click(function() {
  map.fitBounds(markers.getBounds());
  $(".navbar-collapse.in").collapse("hide");
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
  $("#share-twitter").attr("href", "https://twitter.com/intent/tweet?url=" + encodeURIComponent(link) + "&via=fulcrumapp");
  $("#share-facebook").attr("href", "https://facebook.com/sharer.php?u=" + encodeURIComponent(link));
});

function photoGallery(photos) {
  var photoArray = [];
  var photoIDs = photos.split("photos=")[1];
  $.each(photoIDs.split("%2C"), function(index, id) {
    photoArray.push({href: "https://web.fulcrumapp.com/shares/" + urlParams.id + "/photos/" + id});
  });
  $.fancybox(photoArray, {
    "type": "image",
    "showNavArrows": true,
    "padding": 0,
    "scrolling": "no",
    beforeShow: function () {
      this.title = "Photo " + (this.index + 1) + " of " + this.group.length + (this.title ? " - " + this.title : "");
    }
  });
  return false;
}

function zoomToFeature(id) {
  markers.eachLayer(function (layer) {
    if (layer.feature.properties["Fulcrum Id"] == id) {
      map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 18);
      layer.fire("click");
    }
  });
}

function sidebarClick(id) {
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
  legendItems = {};
  $("#feature-list tbody").empty();
  $.getJSON("https://web.fulcrumapp.com/shares/" + urlParams.id + ".geojson?human_friendly=true", function (data) {
    markers.addData(data);
    markerClusters.addLayer(markers);
    featureList = new List("features", {valueNames: ["feature-name"]});
    featureList.sort("feature-name", {order:"asc"});
    updateLegend();
    $("#loading").hide();
  });
}

function updateLegend() {
  if (! $.isEmptyObject(legendItems)) {
    $(".legend").remove();
    $("#fulcrum-layer").append("<div class='legend'></div>");
    $.each(legendItems, function(index, value) {
      $(".legend").append("<div><img src='assets/img/markers/" + value.replace("#",'').toLowerCase() + ".png' height='20px' width='15px'>" + index + "</div>");
    });
  }
}

map = L.map("map", {
  zoom: 10,
  layers: [cartoVoyager, highlight],
  zoomControl: false
}).fitWorld();
map.attributionControl.setPrefix("");

var fulcrumControl = new L.control({
  position: "bottomleft"
});
fulcrumControl.onAdd = function (map) {
  var div = L.DomUtil.create("div");
  div.innerHTML = "<a href='http://fulcrumapp.com/' target='_blank'><img src='assets/img/fulcrum-power.png'></a>";
  return div;
};
map.addControl(fulcrumControl);

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
  "Street Map": cartoVoyager
};

var overlays = {};

var layerControl = L.control.layers(null, overlays, {
  collapsed: isCollapsed
}).addTo(map);

if (cluster === true) {
  map.addLayer(markerClusters);
  layerControl.addOverlay(markerClusters, "<span name='title' id='fulcrum-layer'>Fulcrum Data</span>");
} else {
  map.addLayer(markers);
  layerControl.addOverlay(markers, "<span name='title' id='fulcrum-layer'>Fulcrum Data</span>");
}

/* After GeoJSON loads */
$(document).one("ajaxStop", function () {
  /* Build social share button links */
  $("#twitter-share").attr("src", "//platform.twitter.com/widgets/tweet_button.html?url="+document.URL+"&via=fulcrumapp");
  $(".fb-share-button").attr("data-href", document.URL);

  /* Update navbar & layer title from URL parameter */
  if (urlParams.title && urlParams.title.length > 0) {
    var title = decodeURI(urlParams.title);
    $("[name='title']").html(title);
  }

  /* Add legend with status values */
  updateLegend();

  /* Add navbar logo from URL parameter */
  if (urlParams.logo && urlParams.logo.length > 0) {
    $("#navbar-title").prepend("<img src='" + urlParams.logo + "'>");
  }

  /* Build data download links */
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
