//http://jayraj.net/2013/05/19/backbone-view-collection-part-1
Backbone.ViewCollection = Backbone.View.extend({
  delegateChildEvents: function() {
		_.each(this.childViews, function (childView) {
			childView.delegateEvents();
		});
	},
	render: function() {
		if(!this.collection) {
			throw new Error("ViewCollection needs a collection of models to render");
		}
		if(!this.options.BaseViewClass) {
			throw new Error("Need a base view class");
		}
		var me = this,
			BaseView = this.options.BaseViewClass;
		me.$el.empty();
		me.collection.each(function (model) {
			var new_item_view = new BaseView({
				model: model
			}).render();
			me.childViews.push(new_item_view);
			me.$el.append(new_item_view.$el);
		});
		me.delegateEvents();
		return this;
	},
	childViews: [],
	initialize: function (config) {
		this.childViews = [];
		this.collection.on("reset", this.render, this);
	},
	delegateEvents: function () {
		Backbone.View.prototype.delegateEvents.call(this);
		this.delegateChildEvents();
	}
});