var fs = require('fs');
var tumblr = require('tumblr.js');
var settings = require('./env.json');

var client = tumblr.createClient(settings);
var likes = [];
var imageURLs = [];

function writeJSON(filename, json) {
  fs.writeFile(filename, JSON.stringify(json, null, 4), function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Likes JSON saved.");
    }
  });
}

function grabLikes(offset) {
  client.likes({
    offset: offset,
    limit: 20
  }, function (err, resp) {
    if (err) {
      console.log(err);
      return;
    }

    resp.liked_posts.forEach(function (post) {
      likes.push(post);

      if (post.type === 'photo') {
        post.photos.forEach(function (photo) {
          imageURLs.push(photo.original_size.url);
        });
      }
    });

    // hacky multiple file writes; should just write at end of session
    writeJSON('likes.json', likes);
    writeJSON('photos.json', imageURLs);

    console.log(likes.length);
  });
}

// Get number of likes and start scraping
client.likes(function (err, resp) {
  if (err) {
    console.log(err);
    return;
  }

  for (var i = 0; i < resp.liked_count; i += 20) {
    grabLikes(i);
  }
});
