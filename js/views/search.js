//Drives the search box (more accurately a filter box)
var SearchView = Backbone.View.extend({
	events: {
		'keyup input': 'filterEntries',
		'submit': 'preventSubmit'
	},
	preventSubmit: function(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	},
	filterEntries: function() {
		var collection = this.collection;
		var entered_text = this.$('input').val();
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
			collection.each(function( model, key, collection ) {
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