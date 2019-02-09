
var gpxUrl = "https://cdn.glitch.com/5874eab4-a913-4022-82c7-c42ab13dae78%2Fskitracks-2018-01-16a.gpx?1549628411552";
var gpxParse = require("gpx-parse");

gpxParse.parseRemoteGpxFile(gpxUrl, function(err, data) {
    console.log(gpxUrl);
});
