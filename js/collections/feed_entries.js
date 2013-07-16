//Collection that fetches holds the RSS feed entries
//Fetching 51 to have a multiple of 3 (looks good on my screen)
var FeedEntries = Backbone.Collection.extend({
	fetch: function() {
		var feed = new google.feeds.Feed(this.feedUrl);
		feed.setNumEntries(51);
		feed.includeHistoricalEntries();
		var me = this;
		feed.load(function(result) {
			me.reset(result.feed.entries);
		});
	},
	initialize: function(config) {
		this.feedUrl = config.feedUrl;
	}
});