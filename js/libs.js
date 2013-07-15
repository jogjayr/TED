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
		'class': 'span4 thumbnail_item'
	},
	events: {
        //TODO: use event delegation for this
        'click .video_pane': 'playVideoInPlace',
        'click .more_info': 'toggleMoreInfo'
    },
    playVideoInPlace: function(evt) {
        var feed_entry_mediagroup_contents = this.model.attributes.mediaGroups[0].contents[0];
        this._videoPlayer = new VideoPlayer({
            videoUrl: feed_entry_mediagroup_contents.url,
            thumbnailUrl: feed_entry_mediagroup_contents.thumbnails[0].url,
            fileSize: feed_entry_mediagroup_contents.fileSize
        }).render();
        $(evt.currentTarget).replaceWith(this._videoPlayer.$el);
    },
	_processTitle: function(title) {
		var char_truncate = 50;
		var title_without_ted_and_year = title.replace('TED:', '').replace('(' + new Date(Date.now()).getFullYear() + ')', '').trim();
		var index_of_word_after_50_chars = title_without_ted_and_year.slice(char_truncate).indexOf(' ');
		if(index_of_word_after_50_chars !== -1) index_of_word_after_50_chars = index_of_word_after_50_chars + char_truncate;
		return title_without_ted_and_year.slice(0, index_of_word_after_50_chars) + '...';
	},
	compiledTpl: _.template($('#videoItemTemplate').html()),
	compiledMetaDataTpl: _.template($('#metaDataTemplate').html()),
	toggleShow: function(feed_entry) {
		if(feed_entry.attributes.isVisible) this.$el.show();
		else this.$el.hide();
	},
	toggleMoreInfo: function() {
		if(!this._isExpanded) {
			var model_attrs = this.model.attributes;
			var meta_data = {
				content: model_attrs.content,
				pubDate: model_attrs.publishedDate,
				fileSize: model_attrs.mediaGroups[0].contents[0].fileSize,
				link: model_attrs.link,
				videoUrl: model_attrs.mediaGroups[0].contents[0].url
			};
			this._$blurb.html(this.compiledMetaDataTpl(meta_data));
			this._$info_toggle.val('Less Info');
			this._$video_title.html(model_attrs.title);
			this._isExpanded = true;
		}
		else {
			this.render();
			this._isExpanded = false;
		}
	},
	render: function() {
		var model_attrs = this.model.attributes;
		var template_data = {
			videoTitle: this._processTitle(model_attrs.title)
		};
		template_data.thumbnailUrl = model_attrs.mediaGroups[0].contents[0].thumbnails[0].url;
		template_data.videoBlurb = model_attrs.contentSnippet;
		template_data.pubDate = model_attrs.publishedDate;
		this.$el.html(this.compiledTpl(template_data));
		this._$blurb = this.$('.blurb');
		this._$info_toggle = this.$('.more_info');
		this._$video_title = this.$('.video_title');
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

var VideoPlayer = Backbone.View.extend({
	compiledTpl: _($('#videoPlayerTemplate').html()).template(),
	render: function() {
		this.$el = this.compiledTpl(this._videoData);
		return this;
	},
	initialize: function(config) {
		if(!config.videoUrl) throw new Error("Need video url");
		this._videoData = {
			videoUrl: config.videoUrl,
			thumbnailUrl: config.thumbnailUrl || '',
			fileSize: config.fileSize || ''
		}
	}
});

function fileSizeToHumanReadable (fileSize) {
	var one_kb = 1024;
	var one_mb = one_kb * 1024;
	var one_gb = one_mb * 1024;
	var one_tb = one_gb * 1024;
	if(typeof fileSize !== 'number') fileSize = parseFloat(fileSize);
	if(isNaN(fileSize)) throw new Error('Not a number'); 
	else {
		if(fileSize < one_kb) return fileSize + 'bytes';
		else if(fileSize >= one_kb && fileSize < one_mb) return (fileSize / one_kb).toFixed(2).toString() + ' kb';
		else if(fileSize >= one_mb && fileSize < one_gb) return (fileSize / one_mb).toFixed(2).toString() + ' mb';
		else if(fileSize >= one_gb && fileSize < one_tb) return (fileSize / one_gb).toFixed(2).toString() + ' mb';
	}
}
function dateToHumanReadable (date) {
 	var date_obj = new Date(date);
 	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	if(date_obj.toString !== 'Invalid Date') {
		return date_obj.getDate().toString() + " " + months[date_obj.getMonth()] + ", " + date_obj.getFullYear().toString();
	}
	return '';
}