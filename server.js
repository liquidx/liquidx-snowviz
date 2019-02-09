var express = require('express');
var sassMiddleware = require("node-sass-middleware");
var gpxParse = require('gpx-parse');
var app = express();

// Compile sass.
app.use(sassMiddleware({
  src: __dirname + '/public',
  dest: '/dist'
}));

// Setup Handlebars.
var exphbs = require('express-handlebars');
var hbs = exphbs.create({
  layoutsDir: __dirname + "/views",
  extname: '.hbs.html'
});

app.engine('.hbs.html', hbs.engine);
app.set('views', __dirname + '/views');
app.set('view engine', '.hbs.html');

app.use(express.static('public'));
app.use(express.static('g'));
app.use(express.static('node_modules/p5/lib'));
app.use(express.static('node_modules/p5/lib/addons'));
app.use(express.static('node_modules/dat.gui/build'));

app.get("/g/:seq", (request, response) => {
  response.render('run', {seq: request.params.seq});
});

app.get("/c/:seq", (request, response) => {
  response.render('practice', {seq: request.params.seq});
});

app.get("/t/:name", (request, response) => {
  var gpxUrl = "https://cdn.glitch.com/5874eab4-a913-4022-82c7-c42ab13dae78%2Fskitracks-2018-01-16a.gpx?1549628411552";
//    response.send(JSON.stringify({'tracks': []}));
  gpxParse.parseRemoteGpxFile(gpxUrl, function(err, data) {
    response.send(JSON.stringify(data));
  });
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
