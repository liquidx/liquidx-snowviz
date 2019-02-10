// import gpxparse from "gpx-parse";
import * as d3 from "d3";

var allCharts = [];

// global chart consts
const margin = {left: 10, right: 10, top: 10, bottom: 10};
const width = 240;
const height = 240;
const barWidth = 1;

const visualExtent = [[margin.left, margin.top], [width - margin.left - margin.right, height - margin.top - margin.bottom]];
const xExtent = [margin.left, width - margin.left - margin.right];
const yExtent = [margin.top, height - margin.top - margin.bottom];


var getPoints = function(gpxObjects) {
  var points = [];  // lat, lon, elevation, time (2019-01-16T01:40:28.710Z)
  for (var gpxObject of gpxObjects) {
    for (var track of gpxObject.tracks) {
      console.log(`-- Track ${track.name}`);
      for (var segment of track.segments) {
        console.log(`  -- Segment: Length ${segment.length}`);
        for (var point of segment) {
          points.push(point);
        }
      }
    }
  }
  return points;
}

function plot(groupId, svgId, gpxObjects) {
  var points = getPoints(gpxObjects);


  var datetimeParse = d3.isoParse;

  points = points.map(p => { return {lat: p.lat, lon: p.lon, elevation: p.elevation, time: datetimeParse(p.time)} });
  d3.select(groupId).select('.points').html(points.length);

  var x = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent);

  var y = d3.scaleLinear()
    .domain(d3.extent(points, d => d.elevation))
    .range(yExtent);

  var chart1 = d3.select(svgId)
    .attr('height', height)
    .attr('width', width);

  var area = d3.area()
      .x(d => x(d.time))
      .y0(height)
      .y1(d => y(d.elevation));

  var line = d3.line()
      .defined(d => !isNaN(d.time))
      .x(d => x(d.time))
      .y(d => { return height - y(d.elevation); });  // svg's (0, 0) starts from the top.

  // line chart

  chart1.append('path')
    .datum(points)
    .attr('class', 'line')
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")    
    .attr('d', d => line(d));

  // zooming functionality.

  var zoomed = function() {
    var t = d3.event.transform;
    massZoom(t);
  };

  var zoom = d3.zoom()
    .scaleExtent([1, 32])
    .translateExtent(visualExtent)
    .extent(visualExtent)
    .on('zoom', zoomed);

  chart1.call(zoom);
  return {chart: chart1, x: x, y: y, line: line};
}

var massZoom = function(transform) {
  for (var chart of allCharts) {
    chart.x.range(xExtent.map(d => transform.applyX(d)));
    chart.chart.select('.line').attr('d', d => chart.line(d));
  }
};

function main() {
  fetch("/data/2019-01-16/tracesnow-2019-01-16-10-40-28-suginohara.gpx")
    .then(response => response.json())
    .then(jsonResponse => {
      var chart = plot('#tracesnow', '#chart-tracesnow', [jsonResponse]);
      allCharts.push(chart);
    });

    fetch("/data/2019-01-16/ios-slopes-2019-01-16.gpx")
    .then(response => response.json())
    .then(jsonResponse => {
      var chart = plot('#slopes', '#chart-slopes', [jsonResponse]);
      allCharts.push(chart);
    });   

    fetch("/data/2019-01-16/ios-snoww-2019_01_16_10_41_42.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/ios-snoww-2019_01_16_01_20_09.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#snoww', '#chart-snoww', [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });

    fetch("/data/2019-01-16/SkiTracker-export-2019-01-16-10-40.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/SkiTracker-export-2019-01-16-13-18.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#skitracker', '#chart-skitracker', [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });
    
    fetch("/data/2019-01-16/skitracks-2018-01-16a.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/skitracks-2018-01-16b.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#skitracks', '#chart-skitracks', [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });
  }

main();

// go();