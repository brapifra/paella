paella.PluginManager = Class.create({
	targets:null,
	pluginList:new Array(),
	eventDrivenPlugins:new Array(),
	
	initialize:function() {
		this.targets = {};
		var thisClass = this;
		paella.events.bind(paella.events.loadPlugins,function(event) {
			thisClass.loadPlugins();
		});
	},

	setTarget:function(pluginType,target) {
		if (target.addPlugin) {
			this.targets[pluginType] = target;
		}
	},

	getTarget:function(pluginType) {
		// PluginManager can handle event-driven events:
		if (pluginType=="eventDriven") {
			return this;
		}
		else {
			var target = this.targets[pluginType];
			return target;
		}
	},
	
	registerPlugin:function(plugin) {
		// Registra los plugins en una lista y los ordena
		this.pluginList.push(plugin);
		this.pluginList.sort(function(a,b) {
			return a.getIndex() - b.getIndex();
		});
	},

	loadPlugins:function() {
		for (var i=0; i<this.pluginList.length; ++i) {
			var plugin = this.pluginList[i];
			paella.debug.log("loading plugin " + plugin.getName());
			plugin.load(this);
		}
	},
	
	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (plugin.type=="eventDriven" && isEnabled) {
				plugin.setup();
				thisClass.eventDrivenPlugins.push(plugin);
				var events = plugin.getEvents();
				for (var i=0; i<events.length;++i) {
					var eventName = events[i];
					paella.events.bind(eventName,function(event,params) {
						plugin.onEvent(event.type,params);
					});
				}	
			}
		});
	}
});

paella.pluginManager = new paella.PluginManager();

paella.Plugin = Class.create({
	type:'',
	
	initialize:function() {
		var thisClass = this;
		paella.pluginManager.registerPlugin(this);
	},

	load:function(pluginManager) {
		var target = pluginManager.getTarget(this.type);
		if (target && target.addPlugin) {
			target.addPlugin(this);
		}
	},

	getRootNode:function(id) {
		return null;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	setup:function() {
		
	},
	
	getIndex:function() {
		return 0;
	},
	
	getName:function() {
		return "";
	}
});

paella.PlaybackControlPlugin = Class.create(paella.Plugin,{
	type:'playbackControl',
	
	initialize:function() {
		paella.debug.log("Error: PlaybackPopUpPlugin is deprecated in Paella V.2. Use ButtonPlugin instead. Plugin name: " + this.getName());
		this.parent();
	},

	setLeftPosition:function() {
		paella.debug.log("Warning: obsolete plugin style. The " + this.getName() + " plugin does not implement dynamic positioning. Please, consider to implement setLeftPosition() function.");
	},

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "PlaybackControlPlugin";
	},
	
	getMinWindowSize:function() {
		return 0;
	}
});

paella.PlaybackPopUpPlugin = Class.create(paella.Plugin,{
	type:'playbackPopUp',
	
	initialize:function() {
		paella.debug.log("Error: PlaybackPopUpPlugin is deprecated in Paella V.2. Use ButtonPlugin instead. Plugin name: " + this.getName());
		this.parent();
	},

	getRootNode:function(id) {
		return null;
	},
	
	setRightPosition:function() {
		paella.debug.log("Warning: obsolete plugin style. The " + this.getName() + " plugin does not implement dynamic positioning. Please, consider to implement setRightPosition() function.");
	},

	getPopUpContent:function(id) {
		return null;
	},
	
	getName:function() {
		return "PlaybackPopUpPlugin";
	},
	
	getMinWindowSize:function() {
		return 0;
	}
});

paella.PopUpContainer = Class.create(paella.DomNode,{
	containers:null,
	currentContainerId:-1,

	initialize:function(id,className) {
		var This = this;
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = className;
		
		this.containers = {};
		paella.events.bind(paella.events.hidePopUp,function(event,params) { This.hideContainer(params.identifier); });
		paella.events.bind(paella.events.showPopUp,function(event,params) { This.showContainer(params.identifier); });
	},
	
	hideContainer:function(identifier) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId==identifier) {
			$(container.element).hide();
			container.button.className = container.button.className.replace(' selected','');
			$(this.domElement).css({width:'0px'});
			this.currentContainerId = -1;
		}
	},
	
	showContainer:function(identifier) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId!=identifier && this.currentContainerId!=-1) {
			var prevContainer = this.containers[this.currentContainerId];
			prevContainer.button.className = prevContainer.button.className.replace(' selected','');
			container.button.className = container.button.className + ' selected';
			$(prevContainer.element).hide();
			$(container.element).show();
			var width = $(container.element).width();
			$(this.domElement).css({width:width + 'px'});
			this.currentContainerId = identifier;
		}
		else if (container && this.currentContainerId==identifier) {
			$(container.element).hide();
			$(this.domElement).css({width:'0px'});			
			container.button.className = container.button.className.replace(' selected','');
			this.currentContainerId = -1;
		}
		else if (container) {
			container.button.className = container.button.className + ' selected';
			$(container.element).show();
			var width = $(container.element).width();
			$(this.domElement).css({width:width + 'px'});
			this.currentContainerId = identifier;
		}
	},
	
	registerContainer:function(identifier,domElement,button) {
		var containerInfo = {
			button:button,
			element:domElement
		};
		this.containers[identifier] = containerInfo;
		// this.domElement.appendChild(domElement);
		$(domElement).hide();
		button.popUpIdentifier = identifier;
		$(button).click(function(event) {
			paella.events.trigger(paella.events.showPopUp,{identifier:this.popUpIdentifier});
		});
	}
});

paella.TimelineContainer = Class.create(paella.PopUpContainer,{
	hideContainer:function(identifier) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId==identifier) {
			$(container.element).hide();
			container.button.className = container.button.className.replace(' selected','');
			this.currentContainerId = -1;
			$(this.domElement).css({height:'0px'});
		}
	},
	
	showContainer:function(identifier) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId!=identifier && this.currentContainerId!=-1) {
			var prevContainer = this.containers[this.currentContainerId];
			prevContainer.button.className = prevContainer.button.className.replace(' selected','');
			container.button.className = container.button.className + ' selected';
			$(prevContainer.element).hide();
			$(container.element).show();
			this.currentContainerId = identifier;
			var height = $(container.element).height();
			$(this.domElement).css({height:height + 'px'});
		}
		else if (container && this.currentContainerId==identifier) {
			$(container.element).hide();		
			container.button.className = container.button.className.replace(' selected','');
			$(this.domElement).css({height:'0px'});
			this.currentContainerId = -1;
		}
		else if (container) {
			container.button.className = container.button.className + ' selected';
			$(container.element).show();
			this.currentContainerId = identifier;
			var height = $(container.element).height();
			$(this.domElement).css({height:height + 'px'});
		}
	}
});

paella.ButtonPlugin = Class.create(paella.Plugin,{
	type:'button',
	subclass:'',
	container:null,
	
	getAlignment:function() {
		return 'left';	// or right
	},
	
	// Returns the button subclass.
	getSubclass:function() {
		return "myButtonPlugin";
	},

	action:function(button) {
		// Implement this if you want to do something when the user push the plugin button
	},
	
	getName:function() {
		return "ButtonPlugin";
	},
	
	getMinWindowSize:function() {
		return 0;
	},
	
	buildContent:function(domElement) {
		// Override if your plugin 
	},
	
	getButtonType:function() {
		//return paella.ButtonPlugin.type.popUpButton;
		//return paella.ButtonPlugin.type.timeLineButton;
		return paella.ButtonPlugin.type.actionButton;
	},
	
	// Utility functions: do not override
	changeSubclass:function(newSubclass) {
		this.subclass = newSubclass;
		this.container.className = this.getClassName();
	},
	
	getClassName:function() {
		return paella.ButtonPlugin.kClassName + ' ' + this.getAlignment() + ' ' + this.subclass;
	},
	
	getContainerClassName:function() {
		if (this.getButtonType()==paella.ButtonPlugin.type.timeLineButton) {
			return paella.ButtonPlugin.kTimeLineClassName + ' ' + this.getSubclass();
		}
		else if (this.getButtonType()==paella.ButtonPlugin.type.popUpButton) {
			return paella.ButtonPlugin.kPopUpClassName + ' ' + this.getSubclass();
		}
	}
});

paella.ButtonPlugin.alignment = {
	left:'left',
	right:'right'
}
paella.ButtonPlugin.kClassName = 'buttonPlugin';
paella.ButtonPlugin.kPopUpClassName = 'buttonPluginPopUp';
paella.ButtonPlugin.kTimeLineClassName = 'buttonTimeLine';
paella.ButtonPlugin.type = {
	actionButton:1,
	popUpButton:2,
	timeLineButton:3
}

paella.ButtonPlugin.buildPluginButton = function(plugin,id) {
	plugin.subclass = plugin.getSubclass();
	var elem = document.createElement('div');
	elem.className = plugin.getClassName();
	elem.id = id;
	elem.plugin = plugin;
	plugin.container = elem;
	$(elem).click(function(event) {
		this.plugin.action(this);
	});
	return elem;
}

paella.ButtonPlugin.buildPluginPopUp = function(parent,plugin,id) {
	plugin.subclass = plugin.getSubclass();
	var elem = document.createElement('div');
	parent.appendChild(elem);
	elem.className = plugin.getContainerClassName();
	elem.id = id;
	elem.plugin = plugin;
	plugin.buildContent(elem);
	return elem;
}


paella.EventDrivenPlugin = Class.create(paella.Plugin,{
	type:'eventDriven',
	
	initialize:function() {
		this.parent();
		var events = this.getEvents();
		for (var i = 0; i<events.length;++i) {
			var event = events[i];
			if (event==paella.events.loadStarted) {
				this.onEvent(paella.events.loadStarted);
			}
		}
	},

	getEvents:function() {
		return new Array();
	},

	onEvent:function(eventType,params) {
	},
	
	getName:function() {
		return "EventDrivenPlugin";
	}
});

// Paella Extended plugins:
paella.RightBarPlugin = Class.create(paella.Plugin,{
	type:'rightBarPlugin',

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "RightBarPlugin";
	},
	
	getIndex:function() {
		return 10000;
	}
});

paella.TabBarPlugin = Class.create(paella.Plugin,{
	type:'tabBarPlugin',

	getTabName:function() {
		return "New Tab";
	},

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "TabBarPlugin";
	},
	
	getIndex:function() {
		return 100000;
	}
});