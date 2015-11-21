var app = {}; // Create namespace for the app

//
// Required variables for URL construction & API access
//
var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=";
var nameURL = "https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=";
var photoInfoURL = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=";
var searchTag = "mountains";
var url_mid = "&tags="
var url_mid2 = "&per_page=50&page=";
var url_last = "&format=json&jsoncallback=?";
var apiKey = "ef61aea8f1d3fcdcda5e0294f0f7fea2";
var currentPage = 1;
var totalPages = 0;
var isLoading = false; // flag to ensure only one more page is loaded when reaching bottom of screen


// ------------
// Photo Model
// ------------
app.Photo = Backbone.Model.extend({
  defaults: {
    title: '',
    url: '',
    id: '',
    author: 'Loading...',
    author_id: '',
    author_url: '',
    tags: []
  },
  parse: function(item) {
    var photoURL = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_m.jpg";
    var authURL = "http://flickr.com/photos/" + item.owner;
    // If the image has no title, set it to 'Untitled'
    var imageTitle = (item.title != "") ? imageTitle = item.title : imageTitle = 'Untitled';
    return {
      title: imageTitle,
      url: photoURL,
      id: item.id,
      author: item.owner,
      author_id: item.owner,
      author_url: authURL
    };
  },
  initialize: function() {
    this.getAuthorName();
  },
  getAuthorName: function() {
    var self = this;
    var photo_ID = this.get('id');
    var secret = this.get('secret');
    var photoInfURL = '';
    if (secret !== '') {
      photoInfURL = photoInfoURL + apiKey + "&photo_id=" + photo_ID + "&secret=" + secret + url_last;
    } else {
      photoInfURL = photoInfoURL + apiKey + "&photo_id=" + photo_ID + url_last;
    }
    $.getJSON(photoInfURL, function(returndata) {
      if (typeof returndata.photo !== 'undefined') {
        var utext = (returndata.photo.owner.username != "") ? utext = returndata.photo.owner.username : utext = 'Unknown';
        var tags = returndata.photo.tags.tag;
        self.set({
          author: utext,
          tags: tags
        });
      }
    });
  }
});

// ------------
// Collections
// ------------

app.Photos = Backbone.Collection.extend({
  model: app.Photo,
  url: function () {
    var searchTag = $('#searchinput').val();
    if (searchTag === '') {
      searchTag = 'mountains';
    }
    return url + apiKey + url_mid + searchTag + url_mid2 + this.page.toString() + url_last;
  },
  parse: function(data) {
    return data.photos.photo;
  },
  page: 1,
  isLoading: false,
  searchTag: 'mountains'
});

// ------------
// Views
// ------------

// This view sets up events and shows an individual photo
app.PhotoView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#image-template').html()),
  initialize: function() {
    // Event listener set up to catch the update to the author name in the
    // model and trigger a re-render to update the DOM with the author name
    this.listenTo(this.model, 'change', this.render);
  },
  events: {
    "click li": "clicked"
  },
  clicked: function(e) {
    e.preventDefault();
    var searchTerm = e.currentTarget.innerHTML;
    commalessTerm = searchTerm.substr(0, searchTerm.length - 1);
    $("#searchinput").val(commalessTerm);
    app.Search(commalessTerm);
  },
  render: function() {
    this.$el.append(this.template(this.model.toJSON()));
  }
});

app.PhotoViews = Backbone.Collection.extend({
  model: app.PhotoView
});

// renders a photo to the DOM
app.FeedView = Backbone.View.extend({
  el: '#flickrFeedApp',
  initialize: function() {
    this.photos = new app.Photos();
    this.photoViews = new app.PhotoViews();
    this.photos.isLoading = true;
    this.photos.fetch();
    this.listenTo(this.photos, 'sync', this.loadPhotos);
    // Setting up scroll event
    $(document).on('scroll', _.bind(this.scroll, this));
  },
  loadPhotos: function() {
    this.photos.isLoading = false;
    var addOne = _.bind(this.addPhoto, this);
    this.photos.forEach(addOne);
  },
  addPhoto: function(photo) {
    var pView = new app.PhotoView({
      model: photo,
      el: '#image-container'
    });
    // Keep a record of this PhotoView for later clearing
    this.photoViews.add(this.pView);
  },
  clearAll: function() {
    this.photoViews.each(function(item) {
      item.remove();
    });
  },
  search: function (searchTerm) {
    this.clearAll();
    this.photos.searchTag = searchTerm;
    this.photos.isLoading = true;
    this.photos.fetch();
  },
  scroll: function() {
    if (!this.photos.isLoading && app.element_in_scroll("#image-container .image-container:last")) {
      this.photos.isLoading = true;
      this.photos.page += 1;
      this.photos.fetch();
    }
  }
});

// ------------
// Initializers
// ------------
app.feedView = new app.FeedView(); // Instantiate a view for the collection

// Handle the input of a new search parameter and update
// the feed accordingly
app.Search = function(searchParameter) {
  if (searchParameter != "") {
    $('#image-container').empty();
    app.feedView.search(searchParameter);
  }
}

// This clears any existing images from the page by clearing
// the #image-container div and then resets app.feedView by
// re-declaring it.
app.ResetView = function () {
  // Clear the html
  $("#image-container").empty();
  // Invoke a new view
  app.feedView = new app.FeedView();
}

// Returns true if docView has almost reached bottom of page
// (and top of page isn't visible)
app.element_in_scroll = function(elem) {
  var docViewTop = $(window).scrollTop();
  var docViewBottom = docViewTop + $(window).height();
  var elemTop = $(elem).offset().top;
  var elemBottom = elemTop + $(elem).height();

  return ((elemBottom - 1000 <= docViewBottom) && (elemTop >= docViewTop));
}

// -----------------------
//  jQuery code follows
// -----------------------

// User has clicked the search button
$("#search").click(function() {
  app.Search($("#searchinput").val());
});

// User has pressed Enter in the search box
$("#searchinput").keyup(function(e) {
  if (e.keyCode == 13) {
    app.Search($("#searchinput").val());
  }
});

// Display the image information when the user mouses over the image
$(document).on("mouseenter", "div.image-container", function() {
  $(this).children("div.image-info").attr("class", "image-info-active");
});

// Hide the information when the mouse leaves the image
$(document).on("mouseleave", "div.image-container", function() {
  $(this).children("div.image-info-active").attr("class", "image-info");
});

// Create a 'back to top' button and only make it visible
// when scrolling away from the top of the document
$('body').append('<div id="toTop" class="btn btn-info"><span class="glyphicon glyphicon-home"></span>&nbsp;&nbsp;Back to Top</div>');
$(window).scroll(function() {
  if ($(this).scrollTop() != 0) {
    $('#toTop').fadeIn();
  } else {
    $('#toTop').fadeOut();
  }
});

// Animate scroll back to top of document on button clicked
$('#toTop').click(function() {
  $("html, body").animate({
    scrollTop: 0
  }, 600);
  return false;
});
