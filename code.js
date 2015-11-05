var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=";
var url_mid = "&tags=mountains&per_page=50&page=";
var url_last = "&format=json&jsoncallback=?";
var apiKey = "ef61aea8f1d3fcdcda5e0294f0f7fea2";
var currentPage = 1;
var totalPages = 0;

function GetImages(pageNum)
{
	$.getJSON(url + apiKey + url_mid + pageNum.toString() + url_last, function(data) {
		totalPages = data.photos.pages;
	    $.each(data.photos.photo, function(i, item) {
	        var photoURL = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_m.jpg";
	        var imgCont = '<div class="image-container" style="background: url(' + photoURL + ');"><div class="image-info"><p class="top"><a class="title" href="http://www.flickr.com/photos/';
	        var username = item.owner;
	        imgCont += item.owner + "/" + item.id + '">' + item.title + '</a> <span class="author">by <a href="http://flickr.com/photos/' + item.owner + '">' + username;
	        imgCont += "</a></span></p></div></div>";
	        $(imgCont).appendTo("#image-container");
	    });
	});
}

$(document).ready(function() {
  GetImages(1);
});

$(document).on("mouseenter", "div.image-container", function() {
    $(this).children("div").attr("class", "image-info-active");
});

$(document).on("mouseleave", "div.image-container", function() {
    $(this).children("div").attr("class", "image-info");
});

function element_in_scroll(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();
 
    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

$(document).scroll(function(e){
   	if (element_in_scroll("#image-container .image-container:last")) {
        if (currentPage < totalPages) {
        	currentPage += 1;
        	GetImages(currentPage);
    	}
    }
});