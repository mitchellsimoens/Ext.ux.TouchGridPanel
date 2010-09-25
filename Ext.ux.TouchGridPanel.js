Ext.ns("Ext.ux");

Ext.ux.TouchGridPanel = Ext.extend(Ext.Panel, {
	sortDirection        : null,
	selModel             : {
		type         : "row",
		locked       : false,
		singleSelect : true
	},
	hdCls                : "x-grid-hd-cell",
	cellSelector         : ".x-grid-cell",
	cellSelectorDepth    : 1,
	rowSelector          : ".x-grid-row",
	rowSelectorDepth     : 2,
	rowBodySelector      : ".x-grid-cell",
	rowBodySelectorDepth : 10,
	colRe                : new RegExp('x-grid-col-([^\\s]+)', ''),
	initComponent        : function() {
		Ext.applyIf(this.selModel, {
			type         : "row",
			singleSelect : true,
			locked       : false,
			selected     : null
		});
		
		this.templates = this.initTemplates();
		
		this.initSelModel();
		
		this.on("afterrender", this.renderView, this);
		
		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
	},
	initTemplates        : function() {
		var templates = {};
		
		templates.headerTpl    = new Ext.Template('<div class="x-grid-header" style="{style}">{rows}</div>');
		templates.headerRowTpl = new Ext.Template('<div class="x-grid-cell x-grid-hd-cell x-grid-col-{id}">{text}</div>');
		templates.rowsTpl      = new Ext.Template('<div class="x-grid-rows">{cols}</div>');
		templates.colsTpl      = new Ext.Template('<div class="x-grid-row" rowIndex="{rowIndex}" selected="false" style="{style}">{cells}</div>');
		templates.cellsTpl     = new Ext.Template('<div class="x-grid-cell x-grid-col-{id}"">{text}</div>');
		
		return templates;
	},
	renderView           : function() {
		var templates = this.templates;
		
		this.body.dom.innerHTML = this.renderHeaders()+this.renderRows();
		
		this.scroller = new Ext.util.Scroller(this.body.dom.lastChild, {
			vertical: true,
			listeners : {
				scope       : this,
				scrollstart : this.onScrollStart,
				scrollend   : this.onScrollEnd
			}
		});
		
		this.afterRenderUI();
	},
	afterRenderUI        : function() {
		var header = Ext.get(this.body.dom.firstChild);
		
		this.mon(this.body, {
			scope : this,
			click : this.onClick
		});
		
		this.store.on({
			scope       : this,
			datachanged : this.onDataChange
		});
		
		header.on("click", this.handleHdDown, this);
	},
	renderHeaders        : function() {
		var headerArr = [],
			i         = 0,
			colModel  = this.colModel,
			colNum    = colModel.length,
			templates = this.templates;
		
		for (; i < colNum; i++) {
			id = colModel[i].id || Ext.id();
			this.colModel[i].id = id;
			headerArr[headerArr.length] = templates.headerRowTpl.apply({
				id   : id,
				text : colModel[i].header
			});
		}
		
		return templates.headerTpl.apply({
			rows  : headerArr.join(""),
			style : "-webkit-column-count: "+colNum+";"
		});
	},
	renderRows           : function(startRow, endRow) {
		var startRow = startRow || 0,
			endRow   = Ext.isDefined(endRow) ? endRow : this.store.getCount() - 1,
			records  = this.store.getRange(startRow, endRow);
		
		return this.doRowRender(records, startRow);
	},
	doRowRender          : function(records, startRow) {
		var i, x, colsArr,
			rowsArr   = [],
			numRecs   = records.length,
			colModel  = this.colModel,
			colNum    = colModel.length,
			templates = this.templates;
		
		for (x = 0; x < numRecs; x++) {
			colsArr = [];
			for (i = 0; i < colNum; i++) {
				colsArr[colsArr.length] = templates.cellsTpl.apply({
					id   : colModel[i].id,
					text : records[x].get(colModel[i].mapping),
				});
			}
			rowsArr[rowsArr.length] = templates.colsTpl.apply({
				cells    : colsArr.join(""),
				rowIndex : x,
				style    : "-webkit-column-count: "+colNum+";"
			});
		}
		
		return templates.rowsTpl.apply({
			cols : rowsArr.join("")
		});
	},
	refresh              : function() {
		if (this.fireEvent("beforerefresh", this) === false) {
			return ;
		}
		
		var el = this.body.child(".x-grid-rows");
		
		el.setStyle("padding-top", "0em");
		
		el.update(this.renderRows());
		
		this.fireEvent("refresh", this);
	},
	
	processEvent         : function(name, e) {
		var row, cell, col, body,
			target = e.getTarget(),
			header = this.findHeaderIndex(target);
		
		this.fireEvent(name, e);
		
		if (header !== false) {
			this.fireEvent("header" + name, this, header, e);
		} else {
			row = this.findRowIndex(target);
			if (row !== false) {
				cell = this.findCellIndex(target);
				if (cell !== false) {
					if (this.fireEvent("cell" + name, this, row, cell, e) !== false) {
						this.fireEvent("row" + name, this, row, e);
					}
				} else {
					if (this.fireEvent("row" + name, this, row, e) !== false) {
						(body = this.findRowBody(target)) && this.fireEvent("rowbody" + name, this, row, e);
					}
				}
			} else {
				this.fireEvent("container" + name, this, e);
			}
		}
	},
	lockSelection        : function(lock) {
		this.selModel.locked = lock;
	},
	
	//event handlers
	handleHdDown         : function(e, target) {
		var colModel  = this.colModel,
			index     = this.getCellIndex(target),
			column    = colModel[index],
			direction = this.sortDirection;
		
		this.sortDirection = (this.sortDirection === "ASC") ? "DESC" : "ASC";
		
		this.store.sort(column.mapping, this.sortDirection);
	},
	onDataChange         : function() {
		this.refresh();
	},
	onClick              : function(e) {
		this.processEvent("click", e);
	},
	onScrollStart        : function() {
		this.lockSelection(true);
	},
	onScrollEnd          : function() {
		this.lockSelection(false);
	},
	
	//utility functions
	fly                  : function(el) {
		if (!this._flyweight) {
			this._flyweight = new Ext.Element.Flyweight(document.body);
		}
		this._flyweight.dom = el;
		return this._flyweight;
	},
	getCellIndex         : function(el) {
		if (el) {
			var match = el.className.match(this.colRe);
			
			if (match && match[1]) {
				return this.getIndexById(match[1]);
			}
		}
		return false;
	},
	getIndexById         : function(id) {
		for (var i = 0, len = this.colModel.length; i < len; i++) {
			if (this.colModel[i].id == id) {
				return i;
			}
		}
		return -1;
	},
	findCellIndex        : function(el, requiredCls) {
		var hasCls,
			cell = this.findCell(el);
		
		if (cell) {
			hasCls = this.fly(cell).hasClass(requiredCls);
			if (!requiredCls || hasCls) {
				return this.getCellIndex(cell);
			}
		}
		return false;
	},
	findCell             : function(el) {
		if (!el) {
			return false;
		}
		return this.fly(el).findParent(this.cellSelector, this.cellSelectorDepth);
	},
	findRowIndex         : function(el) {
		var row      = this.findRow(el),
			rowIndex = Ext.get(row).getAttribute("rowIndex");
		return row ? rowIndex : false;
	},
	findRow              : function(el) {
		if (!el) {
			return false;
		}
		return this.fly(el).findParent(this.rowSelector, this.rowSelectorDepth);
	},
	findHeaderIndex      : function(el) {
		return this.findCellIndex(el, this.hdCls);
	},
	findRowBody          : function(el) {
		if (!el) {
			return false;
		}
		
		return this.fly(el).findParent(this.rowBodySelector, this.rowBodySelectorDepth);
	},
	
	//selection models
	initSelModel         : function() {
		this.on("rowclick", this.onRowClickSelModel, this);
	},
	onRowClickSelModel   : function(grid, index, e) {
		if (this.selModel.locked === true) {
			return ;
		}
		var target    = e.getTarget(),
			row       = Ext.get(this.findRow(target)),
			selected  = row.getAttribute("selected"),
			newSelect = (selected === "true") ? false : true,
			deselect  = (newSelect === false) ? "de" : "",
			r         = this.store.getAt(index);
		
		if (this.fireEvent("beforerow"+deselect+"select", this, index, r) !== false) {
			if (this.selModel.singleSelect) {
				if (this.selModel.selected !== null && this.selModel.selected !== row) {
					this.selModel.selected.set({
						selected : false
					});
				}
				this.selModel.selected = row;
			}
			
			row.set({
				selected : newSelect
			});
			this.fireEvent("row"+deselect+"select", this, index, r);
		    this.fireEvent("selectionchange", this);
		}
	},
	clearSelections      : function() {
		var i, node,
			el    = Ext.get(this.scrollerEl.dom.children[0]),
			nodes = el.dom.children;
		
		for (i = 0; i<nodes.length; i++) {
			node = Ext.get(nodes[i]);
			node.set({
				selected : false
			});
		}
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);