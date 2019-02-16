import * as d3 from "d3";
import * as THREE from 'three';
import * as dat from 'dat.gui';
import * as OrbitControls from 'three-orbitcontrols';

var allCharts = [];

// global chart consts
const margin = {left: 10, right: 10, top: 10, bottom: 10};
const width = 480;
const height = 480;
const barWidth = 1;

const visualExtent = [[margin.left, margin.top], [width - margin.left - margin.right, height - margin.top - margin.bottom]];
const xExtent = [margin.left, width - margin.left - margin.right];
const yExtent = [margin.top, height - margin.top - margin.bottom];


var getPoints = function(gpxObjects) {
  var datetimeParse = d3.isoParse;
  var points = [];  // lat, lon, elevation, time (2019-01-16T01:40:28.710Z)
  var lastPoint = null;
  for (var gpxObject of gpxObjects) {
    for (var track of gpxObject.tracks) {
      //console.log(`-- Track ${track.name}`);
      for (var segment of track.segments) {
        //console.log(`  -- Segment: Length ${segment.length}`);
        for (var point of segment) {
          // convert timestamp
          point.time = datetimeParse(point.time);

          if (lastPoint) {
            var eleDiff = point.elevation - lastPoint.elevation;
            var latDiff = point.lat - lastPoint.lat;
            var lonDiff = point.lon - lastPoint.lon;
            var timeDiff = point.time - lastPoint.time; // ms
            point.diff = {elevation: eleDiff, lat: latDiff, lon: lonDiff, time: timeDiff};
            var timeDiffSecs = timeDiff / 1000;
            point.velocity = {elevation: eleDiff / timeDiffSecs, lat: latDiff / timeDiffSecs, lon: lonDiff / timeDiffSecs};
          }
          points.push(point);
          lastPoint = point;
        }
      }
    }
  }
  return points;
}

var plot = function(groupId, gpxObjects) {
  var points = getPoints(gpxObjects);
  //points = points.map(p => { return {lat: p.lat, lon: p.lon, elevation: p.elevation, time: p.time, diff: p.diff} });
  d3.select(groupId).select('.points').html(points.length);

//  var altChart = d3.select(groupId).select('.chart-altitude');
//  plotAltitude(altChart, points);

  var mapChart = d3.select(groupId).select('.chart-map');
  plotMap(mapChart, points, true, true);

  var map3d = d3.select(groupId).select('.chart-3d');
  var p = plot3DMap(map3d, points, false, false);
  if (p) {
    var gui = new dat.GUI();
    gui.add(p, 'autorotate');
    gui.add(p.camera.rotation, 'x', -Math.PI / 2, Math.PI / 2);
    gui.add(p.camera.rotation, 'y', -Math.PI / 2, Math.PI / 2);
    gui.add(p.camera.rotation, 'z', -Math.PI , Math.PI);  
    gui.add(p.camera.position, 'x', -100, 100);
    gui.add(p.camera.position, 'y', -100, 100);
    gui.add(p.camera.position, 'z', -100, 100);  
  }
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
  
  var plot = {autorotate: true};

  const xExtent3d = [20, -20];
  const yExtent3d = [-20, 20];
  const zExtent3d = [0, 20];

  var xt = d3.scaleTime()
    .domain(d3.extent(points, d => d.time))
    .range(xExtent3d);

  var xlat = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lat))
    .range(xExtent3d);

  var ylon = d3.scaleLinear()
    .domain(d3.extent(points, d => d.lon))
    .range(yExtent3d);

  var zalt = d3.scaleLinear()
    .domain(d3.extent(points, d => d.elevation))
    .range(zExtent3d);

  var line = d3.line()
    //.defined(d => !isNaN(d.time))
    .x(d => { return flipCoordinate(xlat(d.lat), width, flipX)} )
    .y(d => { return flipCoordinate(ylon(d.lon), height, flipY)} );

  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 60, width / height, 1, 1000 );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor( 0x000000, 0.0 );
  renderer.setSize(width, height);
  chart.append(_ => { return renderer.domElement});

  // can't figure out camera. y and z seem to be swapped.
  camera.position.set(-50, 35, 35);
  //camera.lookAt(new THREE.Vector3(0, 0, 0));
  //camera.rotateOnAxis(new THREE.Vector3(1, 1, 0), Math.PI / 2);
  camera.rotation.set(-Math.PI / 4, -Math.PI / 4, -Math.PI * 0.8);
  camera.up = new THREE.Vector3(0, 0, 1);
  console.log(camera.up);

  var vector = new THREE.Vector3(0, 0, 1);
  //camera.setRotationFromAxisAngle(vector);

  // camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.enableKeys = false;
  // controls.minDistance = 20;
  // controls.maxDistance = 100;  

  //controls.maxPolarAngle = Math.PI / 2;

  controls.update();

  // lighting
  //lights
  //https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
  var dirLight = new THREE.DirectionalLight(0x999999,3);
  dirLight.position.set(0, 80, 80);
  dirLight.position.multiplyScalar(10);
  dirLight.name = "dirlight";
  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 768;//4096;
  dirLight.shadow.mapSize.height = 768; //4096;
  dirLight.shadow.camera.near = -10;
  dirLight.shadow.camera.far = 200;
  //dirLight.shadowBias = 0.0005;
  scene.add(dirLight);

  var light = new THREE.AmbientLight( 0x888888 );
  scene.add( light );

  // scene
  var object;

  var subjects = new THREE.Group();
  var base = new THREE.Group();
  var groundGeometry = new THREE.BoxBufferGeometry(40, 40, 5);
  var soil = new THREE.MeshPhongMaterial( { color: 0x724412, flatShading: true} );
  var grass = new THREE.MeshPhongMaterial({ color: 0x427212, flatShading: true}); 
  object = new THREE.Mesh(groundGeometry, soil);
  object.position.set(0, 0, -10);
  object.receiveShadow = true;
  base.add( object );

  object = new THREE.Mesh(groundGeometry, grass);
  object.position.set( 0, 0, -5);
  object.receiveShadow = true;
  base.add( object );

  subjects.add(base);

  // ski track
  var linePoints = [];
  var lineColors = [];
  for (var p of points) {
    linePoints.push(new THREE.Vector3(xlat(p.lat), ylon(p.lon), zalt(p.elevation)));
    if (p.diff && p.diff.elevation > 0) { // going up.
      lineColors.push(new THREE.Color(0, 0, 1));
    } else if (p.diff && p.velocity.elevation < -3) {  // going down, fast!
      lineColors.push(new THREE.Color(1, 0, 0));
    } else {
      lineColors.push(new THREE.Color(1, 1, 1));
    }
  }
  var spline = new THREE.CatmullRomCurve3(linePoints);
  var lineGeometry = new THREE.BufferGeometry();
  var flatVerticies = [];
  var flatColors = [];
  var smoothed = true;
  if (smoothed) {
    var subdivisions = 6;
    linePoints = spline.getPoints(linePoints.length * subdivisions);

    // need to expand colors.
    var splinedColors = [];
    for (var color of lineColors) {
      for (var i = 0; i < subdivisions; i++) {
        splinedColors.push(color);
      }
    }
    // needs endcap
    splinedColors.push(splinedColors[splinedColors.length - 1]);
    lineColors = splinedColors;
  } 

  // flatten arrays
  for (var p of linePoints) {
    flatVerticies.push(p.x, p.y, p.z);
  }
  for (var c of lineColors) {
    flatColors.push(c.r, c.g, c.b);
  }
  lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(flatVerticies, 3));
  lineGeometry.addAttribute('color', new THREE.Float32BufferAttribute(flatColors, 3));

  var	lineMaterial = new THREE.LineBasicMaterial( {
    color: 0xffffff,
    vertexColors: THREE.VertexColors} );
  var track = new THREE.Line(lineGeometry, lineMaterial);
  track.castShadow = true;
  subjects.add(track);

  scene.add(subjects);

  // Add debug axis
  var xaxisPoints = [0, 0, 0, 100, 0, 0];
  var xaxisGeo = new THREE.BufferGeometry();
  xaxisGeo.addAttribute('position', new THREE.Float32BufferAttribute(xaxisPoints, 3));
  var xaxis = new THREE.Line(xaxisGeo, new THREE.LineBasicMaterial({color: 0xff0000}));
  scene.add(xaxis);
  var yaxisPoints = [0, 0, 0, 0, 100, 0];
  var yaxisGeo = new THREE.BufferGeometry();
  yaxisGeo.addAttribute('position', new THREE.Float32BufferAttribute(yaxisPoints, 3));
  var yaxis = new THREE.Line(yaxisGeo, new THREE.LineBasicMaterial({color: 0x00ff00}));
  scene.add(yaxis);


  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    if (plot.autorotate) {
      subjects.rotation.z += 0.002;
    }
    renderer.render( scene, camera );
  }
  animate();

  plot.camera = camera;
  plot.subjects = subjects;
  plot.track = track;

  return plot;
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