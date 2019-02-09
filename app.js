// import gpxparse from "gpx-parse";
import d3 from "d3";

function main() {
    fetch("/data/2019-01-16/tracesnow-2019-01-16-10-40-28-suginohara.gpx")
        .then(response => response.json())
        .then(jsonResponse => {
            console.log(jsonResponse.tracks);
        })
}

main();

// go();