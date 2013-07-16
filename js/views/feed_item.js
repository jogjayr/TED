//Each individual element in the thumbnail grid
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
    //TODO: could be better done with a regex?
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