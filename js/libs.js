var FeedEntries = Backbone.Collection.extend({
	fetch: function() {
		var feed = new google.feeds.Feed(this.feedUrl);
		feed.setNumEntries(50);
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
var FeedItemView = Backbone.View.extend({
	tagName: "li",
	attributes: {
		"class": "span4"
	},
	_processTitle: function(title) {
		var titleMinusTed = title.split("TED: ")[1];
		var titleAndSpeaker = titleMinusTed.split(":");
		return {
			videoTitle: titleAndSpeaker[1].split(titleAndSpeaker[0])[0].replace("-", "").trim(),
			speaker: titleAndSpeaker[0].trim()
		};
	},
	compiledTpl: _.template($('#videoItemTemplate').html()),
	render: function() {
		var titleAndSpeaker = this._processTitle(this.model.attributes.title);
		titleAndSpeaker.thumbnailUrl = this.model.attributes.mediaGroups[0].contents[0].thumbnails[0].url;
		titleAndSpeaker.videoBlurb = this.model.attributes.contentSnippet;
		this.$el.html(this.compiledTpl(titleAndSpeaker));
		return this;
	}
});
var FeedListView = Backbone.ViewCollection.extend({

});