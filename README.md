# Flickr-Feedr

Simple single-page application to pull an image feed from Flickr's API and display it in a browser.

Currently, the feed is:

* Implemented using jQuery for simplicity
* Based on a fixed search term - 'mountains'
* Produces an 'infinite scrolling' output
* Displays image title & author when the user hovers their mouse over the image in question
* Title and author are hyperlinks to relevant locations in Flickr

To do:

* Possibly reformat title/author display under the images (pending feedback)
* Add in floating search box so user can search by any keyword or name
* Use nodeJS or backbone to provide the necessary functionality for more complex features as required