var Ted = {};
$(document).ready(function() {
	Ted.Feed = new FeedEntries({
		feedUrl: 'http://feeds.feedburner.com/tedtalks_video'
	});
	Ted.SearchView = new SearchView({
		//this collection is only filtered, not rendered, by the view
		collection: Ted.Feed,
		el: '#filter',
		attributes: ['title', 'content']
	});
});