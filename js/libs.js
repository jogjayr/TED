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
			var model_media_contents = model_attrs.mediaGroups[0].contents[0];
			var meta_data = {
				content: model_attrs.content,
				pubDate: model_attrs.publishedDate,
				fileSize: model_media_contents.fileSize,
				link: model_attrs.link,
				videoUrl: model_media_contents.url,
				videoExtension: "." + model_media_contents.type.split("/")[1] //splits a MIME type like video/mp4
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
		var comparison_property;
		var me = this;
		//update this prop while we search through the model attributes
		var model_visibility = true;
		var attr_contains_text;
		//no attributes specified to search on, so search every attribute
		if(!search_attributes) {
			// has complexity of approx n (collection.length)* m (model_attrs.length) * o (comparison_property.length); 
			// rather unfortunate
			collection.each( function(model, key, collection ) {
				var model_attrs = model.attributes;
				for(var key in model_attrs) {
					if(model_attrs.hasOwnProperty(key)) {
						comparison_property = model_attrs[key];
						if(comparison_property !== undefined) {
							attr_contains_text = me._compareProps(comparison_property, entered_text);
							if(typeof attr_contains_text === 'boolean') {
								if(attr_contains_text) {
									model_visibility = true;
									break; //we've already determined that one of the model attributes contains the string; search no more
								} 
								else model_visibility = false;
							}
						}
					}
				}
				model.set('isVisible', model_visibility);
			});
		}
		else if(typeof search_attributes === 'object') {
			collection.each( function( model, key, collection ) {
				for (var i = search_attributes.length - 1; i >= 0; i--) {
					var attr = search_attributes[i];
					comparison_property = model.get(attr);
					if(comparison_property !== undefined) {
						attr_contains_text = me._compareProps(comparison_property, entered_text);
						if(typeof attr_contains_text === 'boolean') {
							if(attr_contains_text) {
								model_visibility = true;
								break; //we've already determined that one of the model attributes contains the string; search no more
							} 
							else model_visibility = false;
						}
					}
				}
				model.set('isVisible', model_visibility);
			});
		}
	},
	//return true if toCheck contains reference,
	//false if it doesn't
	//0 if toCheck isn't a string and can't be wrangled into one
	//TODO: see if toCheck can also be a date or something else
	_compareProps: function(toCheck, reference) {
		if(typeof toCheck === 'number') toCheck = toCheck.toString();
		if(typeof toCheck === 'string'){
			toCheck = toCheck.toLowerCase();
			if(toCheck.indexOf(reference) === -1)return false;
			else return true;
		}
		else return 0;
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
var Utils = {
	fileSizeToHumanReadable: function (fileSize) {
		var one_kb = 1024;
		var one_mb = one_kb * 1024;
		var one_gb = one_mb * 1024;
		var one_tb = one_gb * 1024;
		if(typeof fileSize !== 'number') fileSize = parseFloat(fileSize);
		if(isNaN(fileSize)) throw new Error('Not a number'); 
		else {
			if(fileSize < one_kb) return fileSize + 'bytes';
			else if(fileSize >= one_kb && fileSize < one_mb) return (fileSize / one_kb).toFixed(1).toString() + ' kb';
			else if(fileSize >= one_mb && fileSize < one_gb) return (fileSize / one_mb).toFixed(1).toString() + ' mb';
			else if(fileSize >= one_gb && fileSize < one_tb) return (fileSize / one_gb).toFixed(1).toString() + ' gb';
		}
	},
	dateToHumanReadable: function (date) {
	 	var date_obj = new Date(date);
	 	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		if(date_obj.toString !== 'Invalid Date') {
			return date_obj.getDate().toString() + " " + months[date_obj.getMonth()] + ", " + date_obj.getFullYear().toString();
		}
		return '';
	}
}

