var http = require('http');
var fs = require('fs');
var tumblr = require('tumblr.js');
var settings = require('./env.json');

var client = tumblr.createClient(settings);
var likes = [];
var imageURLs = [];
var likeCount;
var pageCount;
var completedPages = 0;

function writeJSON(filename, json) {
  fs.writeFile(filename, JSON.stringify(json, null, 4), function (err) {
    if (err) {
      console.log(err);
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

    completedPages++;
    console.log('Grabbed Page: ' + completedPages + ' / ' + pageCount);

    if (completedPages === pageCount) {
      // Store JSON cause it might be useful later
      writeJSON('likes.json', likes);
      writeJSON('photos.json', imageURLs);

      fetchImages();
    }
  });
}

function fetchImages() {
  imageURLs.forEach(function (imageURL, index) {
    var filename = imageURL.split('/').pop();

    // Make sure file doesn't already exist before fetching
    fs.exists('favorites/' + filename, function (exists) {
      if (!exists) {
        var file = fs.createWriteStream('favorites/' + filename);

        http.get(imageURL, function (response) {
          response.pipe(file);
          console.log('Downloaded: ' + filename);
        });
      } else {
        console.log('Already have: ' + filename);
      }
    });
  });
}

// Get number of likes and start scraping
client.likes(function (err, resp) {
  if (err) {
    console.log(err);
    return;
  }

  likeCount = resp.liked_count;

  // Number of pages of favorites that must be parsed for the full set
  // API returns a max of 20 per request
  pageCount = Math.ceil(likeCount / 20);

  console.log('Total favorites: ' + likeCount);
  console.log('Page requests necessary: ' + pageCount);

  for (var i = 0; i < likeCount; i += 20) {
    grabLikes(i);
  }
});
