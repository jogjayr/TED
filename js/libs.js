'use strict';
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
	tagName: 'li',
	attributes: {
		'class': 'span4'
	},
	_processTitle: function(title) {
		var char_truncate = 40;
		var title_without_ted_and_year = title.replace('TED:', '').replace('(' + new Date(Date.now()).getFullYear() + ')', '').trim();
		var index_of_word_after_30_chars = title_without_ted_and_year.slice(char_truncate).indexOf(' ');
		if(index_of_word_after_30_chars !== -1) index_of_word_after_30_chars = index_of_word_after_30_chars + char_truncate;
		return title_without_ted_and_year.slice(0, index_of_word_after_30_chars) + '...';
	},
	compiledTpl: _.template($('#videoItemTemplate').html()),
	render: function() {
		var titleAndSpeaker = {
			videoTitle: this._processTitle(this.model.attributes.title)
		};
		titleAndSpeaker.thumbnailUrl = this.model.attributes.mediaGroups[0].contents[0].thumbnails[0].url;
		titleAndSpeaker.videoBlurb = this.model.attributes.contentSnippet;
		this.$el.html(this.compiledTpl(titleAndSpeaker));
		return this;
	}
});
var FeedListView = Backbone.ViewCollection.extend({

});