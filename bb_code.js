var app = {};  // Create namespace for the app

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
    tags: [ ]
  },
  getAuthorName: function() {
    app.GetPhotoInfo(this.get('id'), '', this);
  },
  // Add a tag to this image - note the clone workaround to
  // ensure events are fired when a new tag is added
  addTag: function (tag) {
    var newTags = _.clone(this.get('tags'));
    newTags.push(tag);
    this.set('tags', newTags);
  }
});

// ------------
// Views
// ------------

// This view renders an individual photo
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
  clicked: function(e){
        e.preventDefault();
        var searchTerm = e.currentTarget.innerHTML;
        commalessTerm = searchTerm.substr(0, searchTerm.length - 1);
        $("#searchinput").val(commalessTerm);
        app.Search(commalessTerm);
  },
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this; // enable chained calls
  }
});

// renders a photo to the DOM
app.FeedView = Backbone.View.extend({
  el: '#flickrFeedApp',
  addOne: function(photo){
    var view = new app.PhotoView({model: photo});
    $('#image-container').append(view.render().el);
  }
});

// Get the feed - this function acquires and parses a JSON feed
// from the flickr API and creates a new Photo model for each entry
app.GetImages = function(pageNum)
{
	$.getJSON(url + apiKey + url_mid + searchTag + url_mid2 + pageNum.toString() + url_last, function(data) {
		totalPages = data.photos.pages;
	  $.each(data.photos.photo, function(i, item) {
	      var photoURL = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_m.jpg";
        var authURL = "http://flickr.com/photos/" + item.owner;
        // If the image has no title, set it to 'Untitled'
        var imageTitle = (item.title != "") ? imageTitle = item.title : imageTitle = 'Untitled';
        var imageEntry = new app.Photo({title: imageTitle, url: photoURL, id: item.id, author: item.owner, author_id: item.owner, author_url: authURL});
        imageEntry.getAuthorName();
        app.feedView.addOne(imageEntry);
	  });
    isLoading = false;
	});
}

// ------------
// Initializers
// ------------
app.feedView = new app.FeedView();    // Instantiate a view for the collection
app.GetImages(currentPage);           // Fill the collection with the initial search results

// Handle the input of a new search parameter and update
// the feed accordingly
app.Search = function(searchParameter) {
	if (searchParameter != "") {
		searchTag = searchParameter;
		$('#image-container').empty();
		app.GetImages(1);
	}
}

// Returns true if docView has almost reached bottom of page
// (and top of page isn't visible)
app.element_in_scroll = function(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom - 1000 <= docViewBottom) && (elemTop >= docViewTop));
}

// Interrogate the flickr API to get photo information, including username and tags...
app.GetPhotoInfo = function(photo_ID, secret, caller)
{
  var photoInfURL = '';
  if (secret !== '') {
    photoInfURL = photoInfoURL + apiKey + "&photo_id=" + photo_ID + "&secret=" + secret + url_last;
  } else {
    photoInfURL = photoInfoURL + apiKey + "&photo_id=" + photo_ID + url_last;
  }
	$.getJSON(photoInfURL, function(returndata) {
    if (typeof returndata.photo !== 'undefined') {
		  var utext = (returndata.photo.owner.username != "") ? utext = returndata.photo.owner.username : utext = 'Unknown';
      app.RecursiveGetProperty(returndata, 'raw', caller);
      caller.set({author: utext});
    }
	});
}

// Navigate the returned photo data to find tags
// (Couldn't find a way to get them directly!) :(
app.RecursiveGetProperty = function(obj, lookup, callback) {
    for (property in obj) {
        if (property == lookup) {
            callback.addTag(obj[property]);
        } else if (obj[property] instanceof Object) {
            app.RecursiveGetProperty(obj[property], lookup, callback);
        }
    }
}

// -----------------------
//  jQuery code follows
// -----------------------

// User has clicked the search button
$("#search").click(function() {
  app.Search($("#searchinput").val());
});

// User has pressed Enter in the search box
$("#searchinput").keyup(function (e) {
  if (e.keyCode == 13) {
    app.Search($("#searchinput").val());
  }
});

// If scrolling, check to see if more images need to be loaded
$(document).scroll(function(e){
   	if (!isLoading && app.element_in_scroll("#image-container .image-container:last")) {
        if (currentPage < totalPages) {
          isLoading = true;
        	currentPage += 1;
        	app.GetImages(currentPage);
    	}
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
$(window).scroll(function () {
  if ($(this).scrollTop() != 0) {
		$('#toTop').fadeIn();
	} else {
		$('#toTop').fadeOut();
	}
});

// Animate scroll back to top of document on button clicked
$('#toTop').click(function(){
  $("html, body").animate({ scrollTop: 0 }, 600);
  return false;
});
