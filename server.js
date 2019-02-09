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

app.get("/c/:seq", (request, response) => {
  response.render('practice', {seq: request.params.seq});
});

app.get('/data/:datestring/:filename', (request, response) => {
  console.log(request.params);
  var gpxPath = 'data/' + request.params.datestring + '/' + request.params.filename;
  console.log(gpxPath);
//    response.send(JSON.stringify({'tracks': []}));
  gpxParse.parseGpxFromFile(gpxPath, function(err, data) {
    if (err != null) {
      console.error(err);
      return;
    }
    response.send(JSON.stringify(data));
  });
});


var listener = app.listen(process.env.PORT, function () {
  console.log('http://localhost:' + listener.address().port + "/");
});
