'use strict';

var markup = '<link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css"/><div id="map"></div>';
var utils = require('lightning-client-utils');
var L = require('leaflet')
var F = require('leaflet.freedraw-browserify')
F(L)

// code adopted from http://kempe.net/blog/2014/06/14/leaflet-pan-zoom-image.html

var Img = function(selector, data, images, opts) {

    console.log(images)
    console.log(data)

    var image = images[0];
    var geojson = data.geojson
    var coords = [];

    this.$el = $(selector).first();
    this.$el.append(markup);

    var self = this;

    opts = opts || {};

    var maxWidth = this.$el.width();

    // create an image so we can get aspect ratio
    var img = new Image();
    var self = this
    img.src = image

    img.onload = function() {

        // get image dimensions
        var imw = img.width
        var imh = img.height

        // use image dimensions to set css
        var w = maxWidth,
            h = maxWidth * (imh / imw)

        self.$el.find('#map').width(w).height(h)


        var center = [37.7757491923, -122.4503856]

        //create the map
        var map = L.map('map', {
            minZoom: 18.1,
            maxZoom: 25,
            center: center,
            zoom: 18.1,
            attributionControl: false,
            zoomControl: false,
            crs: L.CRS.Simple,
        });

        var a = center[0]
        var b = center[1]

        var scale = 18.2
        var shifty = Math.pow(2, scale-1) * (a - h / Math.pow(2, scale+1))
        var shiftx = Math.pow(2, scale-1) * (b - w / Math.pow(2, scale+1))

        var southWest = map.unproject([0+shiftx*2, -h-shifty*2], scale);
        var northEast = map.unproject([w+shiftx*2, -0-shifty*2], scale);
        var bounds = new L.LatLngBounds(southWest, northEast);

        map.setMaxBounds(bounds);

        L.imageOverlay(image, bounds).addTo(map);

        var svg = d3.select(map.getPanes().overlayPane).append("svg")
        var g = svg.append("g").attr("class", "leaflet-zoom-hide")

        var transform = d3.geo.transform({point: projectPoint})
        var path = d3.geo.path().projection(transform)

        var feature = g.selectAll("path")
            .data(geojson.features)
          .enter()
            .append("path")
            .style('stroke', 'rgb(255,100,0)')
            .style('fill', 'rgb(255,100,0)')
            .style('fill-opacity', 0.25);

        map.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            var bounds = path.bounds(geojson);
            var topLeft = bounds[0];
            var bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

            feature.attr("d", path);
          }

          function latLngToPoint(latlng) {
            return map.project(latlng)._subtract(map.getPixelOrigin());
            };


          // Use Leaflet to implement a D3 geometric transformation.
          function projectPoint(x, y) {
            //var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            var point = latLngToPoint(new L.LatLng(y, x));
            //console.log(L.geoJson().pointToLayer(new L.LatLng(y, x)))
            this.stream.point(point.x, point.y);
          }

          var popup = L.popup();

            function onMapClick(e) {
                popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(map);
            }
            map.on('click', onMapClick);


        utils.getSettings(this, function(err, settings) {

            console.log(settings);
            if(!err) {
                coords = settings.coords;
            }
            
        });

    }

};


module.exports = Img;


Img.prototype.setImage = function(image) {
    this.img = image;
};


Img.prototype.updateData = function(image) {
    // in this case data should just be an image
    this.setImage(image);
};
