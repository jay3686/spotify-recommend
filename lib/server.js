'use strict';

var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function getFromApi(endpoint, args) {
  var emitter = new events.EventEmitter();
  unirest.get('https://api.spotify.com/v1/' + endpoint).qs(args).end(function (response) {
    if (response.ok) {
      emitter.emit('end', response.body);
    } else {
      emitter.emit('error', response.code);
    }
  });
  return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function (req, res) {
  var searchReq = getFromApi('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  });

  searchReq.on('end', function (item) {
    var artist = item.artists.items[0];
    if (artist !== undefined) {
      var relatedArtists = getFromApi('artists/' + artist.id + '/related-artists');

      relatedArtists.on('end', function (related) {
        artist.related = related.artists;
        console.log('artist:', artist);
        res.json(artist);
      });

      relatedArtists.on('error', function () {
        res.sendStatus(404);
      });
    }
  });

  searchReq.on('error', function (code) {
    res.sendStatus(code);
  });
});

app.listen(8080);