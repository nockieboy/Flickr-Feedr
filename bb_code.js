var app = {};  // Create namespace for the app

//
// Required variables for URL construction & API access
//
var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=";
var nameURL = "https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=";
var searchTag = "mountains";
var url_mid = "&tags="
var url_mid2 = "&per_page=50&page=";
var url_last = "&format=json&jsoncallback=?";
var apiKey = "ef61aea8f1d3fcdcda5e0294f0f7fea2";
var currentPage = 1;
var totalPages = 0;
var isLoading = false; // flag to ensure only one more page is loaded when reaching bottom of screen
// ------------
// Model
// ------------

app.Photo = Backbone.Model.extend({
  defaults: {
    title: '',
    url: '',
    id: '',
    author: 'Loading...',
    author_id: '',
    author_url: ''
  },
  getAuthorName: function() {
    app.GetUsername(this.get('author_id'), this);
  },
  showResult: function(result) {
    this.set({author: result});
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
  console.log("GetImages called.");
	$.getJSON(url + apiKey + url_mid + searchTag + url_mid2 + pageNum.toString() + url_last, function(data) {
		totalPages = data.photos.pages;
	  $.each(data.photos.photo, function(i, item) {
	      var photoURL = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_m.jpg";
        var authURL = "http://flickr.com/photos/" + item.owner;
        var imageEntry = new app.Photo({title: item.title, url: photoURL, id: item.id, author: item.owner, author_id: item.owner, author_url: authURL});
        imageEntry.getAuthorName();
        app.feedView.addOne(imageEntry);
	  });
    console.log("GetImages completed.");
    isLoading = false;
	});
}

// Handle the input of a new search parameter and update
// the feed accordingly
app.Search = function(searchParameter) {
	if (searchParameter != "") {
		searchTag = searchParameter;
		$('#image-container').empty();
		app.GetImages(1);
	}
}

// ------------
// Initializers
// ------------
app.feedView = new app.FeedView();    // Instantiate a view for the collection
app.GetImages(currentPage);           // Fill the collection with the initial search results

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

$(document).on("mouseenter", "div.image-container", function() {
    $(this).children("div").attr("class", "image-info-active");
});

$(document).on("mouseleave", "div.image-container", function() {
    $(this).children("div").attr("class", "image-info");
});

// Interrogate the flickr API to get a username from a userID
app.GetUsername = function(userID, caller)
{
	$.getJSON(nameURL + apiKey + "&user_id=" + userID + url_last, function(returndata) {
    if (typeof returndata.person.realname !== 'undefined') {
		  var utext = (returndata.person.realname._content != "") ? utext = returndata.person.realname._content : utext = userID;
      caller.showResult(utext);
    }
	});
}
