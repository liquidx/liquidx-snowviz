// import gpxparse from "gpx-parse";
import * as d3 from "d3";

function plot(gpxObject) {
  let points = [];  // lat, lon, elevation, time (2019-01-16T01:40:28.710Z)
  for (var track of gpxObject.tracks) {
    console.log(`-- Track ${track.name}`);
    for (var segment of track.segments) {
      console.log(`  -- Segment`);
      points = segment;
      console.log(points[0]);
    }
  }

  var width = 240;
  var height = 240;
  var barWidth = 1;

  var datetimeParse = d3.isoParse;

  var x = d3.scaleTime()
    .domain([d3.min(points, d => { return datetimeParse(d.time)}),
             d3.max(points, d => { return datetimeParse(d.time)})])
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain([d3.min(points, d => d.elevation), d3.max(points, d => d.elevation)])
    .range([0, height]);

  var chart = d3.select('#chart1')
    .attr('height', height)
    .attr('width', width);

  var bar = chart.selectAll('g')
    .data(points)
    .enter().append('g')
      .attr('transform', function(d, i) { 
        var xs = x(datetimeParse(d.time));
        return `translate(${xs * barWidth}, 0)`
      });

  bar.append('rect')
    .attr('width', barWidth)
    .attr('height', d => y(d.elevation))
    .attr('y', d => { return height - y(d.elevation)});
}

function main() {
  fetch("/data/2019-01-16/tracesnow-2019-01-16-10-40-28-suginohara.gpx")
    .then(response => response.json())
    .then(jsonResponse => {
      plot(jsonResponse);
    })
}

main();

// go();