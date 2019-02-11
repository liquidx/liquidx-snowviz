import * as d3 from "d3";
import * as THREE from 'three';
import * as OrbitControls from 'three-orbitcontrols';

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
      //console.log(`-- Track ${track.name}`);
      for (var segment of track.segments) {
        //console.log(`  -- Segment: Length ${segment.length}`);
        for (var point of segment) {
          points.push(point);
        }
      }
    }
  }
  return points;
}

var plot = function(groupId, gpxObjects) {
  var points = getPoints(gpxObjects);
  var datetimeParse = d3.isoParse;
  points = points.map(p => { return {lat: p.lat, lon: p.lon, elevation: p.elevation, time: datetimeParse(p.time)} });
  d3.select(groupId).select('.points').html(points.length);

//  var altChart = d3.select(groupId).select('.chart-altitude');
//  plotAltitude(altChart, points);

  var mapChart = d3.select(groupId).select('.chart-map');
  plotMap(mapChart, points, true, true);

  var map3d = d3.select(groupId).select('.chart-3d');
  plot3DMap(map3d, points, true, true);
};

// helper method to flip the coordinate based on the extent and a bool 
var flipCoordinate = function(v, extent, flipOrNot) {
  if (flipOrNot) {
    return extent - v;
  }
  return v;
};

var plot3DMap = function(chart, points, flipX, flipY) {
  if (chart.empty()) { return; }

  var xt = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent);

  var xlat = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lat))
    .range(xExtent);

  var ylon = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lon))
    .range(yExtent);

  var line = d3.line()
    //.defined(d => !isNaN(d.time))
    .x(d => { return flipCoordinate(xlat(d.lat), width, flipX)} )
    .y(d => { return flipCoordinate(ylon(d.lon), height, flipY)} );

  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 60, width / height, 1, 1000 );
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  chart.append(_ => { return renderer.domElement});

  // can't figure out camera. y and z seem to be swapped.
  camera.position.set(60, 30, -50);

  // camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.enableKeys = false;
  controls.minDistance = 40;
  controls.maxDistance = 150;  

  controls.maxPolarAngle = Math.PI / 2;

  controls.update();

  // lighting
  var light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 1, 1, 1 );
  scene.add( light );
  var light = new THREE.AmbientLight( 0x222222 );
  scene.add( light );

  // scene
  var object;
  var groundGeometry = new THREE.BoxBufferGeometry(40, 5, 40);
  var soil = new THREE.MeshPhongMaterial( { color: 0x724412, flatShading: true } );
  var grass = new THREE.MeshPhongMaterial({ color: 0x427212, flatShading: true}); 
  object = new THREE.Mesh(groundGeometry, soil);
  object.position.set( 0, 0, 0 );
  scene.add( object );

  object = new THREE.Mesh(groundGeometry, grass);
  object.position.set( 0, 5, 0);
  scene.add( object );


  function animate() {
    requestAnimationFrame( animate );
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    console.log(camera.position);
    controls.update();
    renderer.render( scene, camera );
  }
  animate();
};

var plotMap = function(chart, points, flipX, flipY) {
  if (chart.empty()) { return; }

  var xt = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent);

  var xlat = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lat))
    .range(xExtent);

  var ylon = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lon))
    .range(yExtent);

  var line = d3.line()
    //.defined(d => !isNaN(d.time))
    .x(d => { return flipCoordinate(xlat(d.lat), width, flipX)} )
    .y(d => { return flipCoordinate(ylon(d.lon), height, flipY)} );

  var defs = chart.append('defs');
  var gradient = defs.append('linearGradient')
    .attr('id', 'pathGradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '100%');
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#666666');
  gradient.append('stop')
    .attr('offset', '90%')
    .attr('stop-color', '#666666');
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#ffffff');

  chart.append('path')
    .datum(points)
    .attr('id', 'trail')
    .attr("fill", "none")
    .attr("stroke", "#aaaaaa")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")    
    .attr('d', d => line(d));

  const headLength = 30;
  chart.append('path')
    .datum([])
    .attr('id', 'trailHead')
    .attr("fill", "none")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")    
    .attr('d', d => line(d));    

  // create dragging to scrub through time.
  var dragging = e => {
    var x = d3.event.x;
    var cutoff = parseInt((x / xExtent[1]) * points.length);
    var pointsSubset = points.slice(0, parseInt(cutoff));
    chart.select('#trail')
      .datum(pointsSubset)
      .attr('d', d => line(d));
    chart.select('#trailHead')
      .datum(pointsSubset.slice(Math.max(0, pointsSubset.length - headLength)))
      .attr('d', d => line(d));
  };

  var drag = d3.drag().on("drag", dragging);
  chart.call(drag);
};


var plotAltitude = function(chart, points) {

  var x = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent);

  var y = d3.scaleLinear()
    .domain(d3.extent(points, d => d.elevation))
    .range(yExtent);

  chart
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
  chart.append('path')
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

  chart.call(zoom);
  return {chart: chart, x: x, y: y, line: line};
};

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
      var chart = plot('#tracesnow', [jsonResponse]);
      allCharts.push(chart);
    });

    fetch("/data/2019-01-16/ios-slopes-2019-01-16.gpx")
    .then(response => response.json())
    .then(jsonResponse => {
      var chart = plot('#slopes', [jsonResponse]);
      allCharts.push(chart);
    });   

    fetch("/data/2019-01-16/ios-snoww-2019_01_16_10_41_42.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/ios-snoww-2019_01_16_01_20_09.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#snoww',  [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });

    fetch("/data/2019-01-16/SkiTracker-export-2019-01-16-10-40.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/SkiTracker-export-2019-01-16-13-18.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#skitracker', [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });
    
    fetch("/data/2019-01-16/skitracks-2018-01-16a.gpx")
    .then(response => response.json())
    .then(jsonResponse1 => {
      fetch("/data/2019-01-16/skitracks-2018-01-16b.gpx")
        .then(response => response.json())
        .then(jsonResponse2 => {
          var chart = plot('#skitracks', [jsonResponse1, jsonResponse2]);
          allCharts.push(chart);
        });
    });
  }

main();

// go();