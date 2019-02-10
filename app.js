// import gpxparse from "gpx-parse";
import * as d3 from "d3";

var getPoints = function(gpxObject) {
  var points = [];  // lat, lon, elevation, time (2019-01-16T01:40:28.710Z)
  for (var track of gpxObject.tracks) {
    console.log(`-- Track ${track.name}`);
    for (var segment of track.segments) {
      console.log(`  -- Segment`);
      points = segment;
    }
  }
  return points;
}

function plot(gpxObject) {
  var points = getPoints(gpxObject);

  const width = 240;
  const height = 240;
  const barWidth = 1;

  var datetimeParse = d3.isoParse;

  points = points.map(p => { return {lat: p.lat, lon: p.lon, elevation: p.elevation, time: datetimeParse(p.time)} });

  const visualExtent = [[0, 0], [width, height]];
  const xExtent = [0, width];
  const yExtent = [0, height];

  var x = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent);

  var y = d3.scaleLinear()
    .domain(d3.extent(points, d => d.elevation))
    .range(yExtent);

  var chart1 = d3.select('#chart1')
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

  // chart.append('path')
  //     .attr('class', 'area')
  //     .attr('d', d => { return area(d) });

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

  // bar chart

  var chart2 = d3.select('#chart2')
    .attr('height', height)
    .attr('width', width);
  
  var bar = chart2.selectAll('g')
    .data(points)
    .enter().append('g')
      .attr('transform', function(d, i) { 
        var xs = x(d.time);
        return `translate(${xs * barWidth}, 0)`
      });
  bar.append('rect')
    .attr('width', barWidth)
    .attr('height', d => y(d.elevation))
    .attr('y', d => { return height - y(d.elevation)});

  // zooming functionality.

  var zoomed = function() {
    var t = d3.event.transform;
    x.range(xExtent.map(d => t.applyX(d)));

    // force line to redraw.
    var l = chart1.select('.line');
    l.attr('d', d => line(d));
  };

  var zoom = d3.zoom()
    .scaleExtent([1, 32])
    .translateExtent(visualExtent)
    .extent(visualExtent)
    .on('zoom', zoomed);

  chart1.call(zoom);
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