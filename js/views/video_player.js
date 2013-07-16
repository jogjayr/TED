//a <video> element for each FeedItemView
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