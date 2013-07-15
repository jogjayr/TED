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
	events: {
		// 'mouseover .video_pane': 'showDetails',
		// 'mouseout .video_pane': 'hideDetails'
	},
	_processTitle: function(title) {
		var char_truncate = 40;
		var title_without_ted_and_year = title.replace('TED:', '').replace('(' + new Date(Date.now()).getFullYear() + ')', '').trim();
		var index_of_word_after_30_chars = title_without_ted_and_year.slice(char_truncate).indexOf(' ');
		if(index_of_word_after_30_chars !== -1) index_of_word_after_30_chars = index_of_word_after_30_chars + char_truncate;
		return title_without_ted_and_year.slice(0, index_of_word_after_30_chars) + '...';
	},
	compiledTpl: _.template($('#videoItemTemplate').html()),
	showDetails: function() {
		this.$el.addClass('video_details');
	},
	hideDetails: function() {
		this.$el.removeClass('video_details');
	},
	toggleShow: function(feed_entry) {
		if(feed_entry.attributes.isVisible) this.$el.show();
		else this.$el.hide();
	},
	render: function() {
		var titleAndSpeaker = {
			videoTitle: this._processTitle(this.model.attributes.title)
		};
		titleAndSpeaker.thumbnailUrl = this.model.attributes.mediaGroups[0].contents[0].thumbnails[0].url;
		titleAndSpeaker.videoBlurb = this.model.attributes.contentSnippet;
		this.$el.html(this.compiledTpl(titleAndSpeaker));
		return this;
	},
	initialize: function() {
		this.model.on("change:isVisible", this.toggleShow, this);
	}
});
var FeedListView = Backbone.ViewCollection.extend({

});

var SearchView = Backbone.View.extend({
	events: {
		"keyup": "filterEntries"
	},
	filterEntries: function() {
		var collection = this.collection;
		var entered_text = this.$el.val();
		//we can limit filtering to certain attributes of the model in the collection
		//by passing an "attributes" option
		var search_attributes = this.attributes;
		//no attributes specified to search on, so search every attribute
		if(!search_attributes) {
			// has complexity of approx n (collection.length)* m (model_attrs.length) * o (comparison_property.length); 
			// rather unfortunate
			collection.each( function(model, key, collection ) {
				var model_attrs = model.attributes;
				for(var key in model_attrs) {
					if(model_attrs.hasOwnProperty(key)) {
						var comparison_property = model_attrs[key];
						if(comparison_property !== undefined) {
							if(typeof comparison_property === 'number') comparison_property = comparison_property.toString();
							comparison_property = comparison_property.toLowerCase();
							if(comparison_property.indexOf(entered_text) === -1) model.set('isVisible', false);
							else model.set('isVisible', true);
						}
					}
				}
			});
		}
		else if(typeof search_attributes === 'object') {
			collection.each( function( model, key, collection ) {
				for (var i = search_attributes.length - 1; i >= 0; i--) {
					var attr = search_attributes[i];
					var comparison_property = model.get(attr);
					if(comparison_property !== undefined) {
						if(typeof comparison_property === 'number') comparison_property = comparison_property.toString();
						comparison_property = comparison_property.toLowerCase();
						if(comparison_property.indexOf(entered_text) === -1) model.set('isVisible', false);
						else model.set('isVisible', true);
					}
				};
					
				
			});
		}

	},
	initialize: function(config) {
		if(!config.collection || !config.collection instanceof Backbone.Collection) throw new Error('No collection specified for search view');
		if(config.attributes && typeof config.attributes === 'object') {
			for(var attr in config.attributes) {
				if(config.attributes.hasOwnProperty(attr) && typeof attr !== 'string') throw new Error('Attributes must be a string or an array of strings');
			}
		}
		else if(config.attributes && typeof config.attributes !== 'string') throw new Error('Attributes must be a string or an array of strings');
	}

});