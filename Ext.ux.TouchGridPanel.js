/*
    Author       : Mitchell Simoens
    Site         : http://simoens.org/Sencha-Projects/demos/
    Contact Info : mitchellsimoens@gmail.com
    Purpose      : Creation of a grid for Sencha Touch
	
	License      : GPL v3 (http://www.gnu.org/licenses/gpl.html)
    Warranty     : none
    Price        : free
    Version      : 1.5
    Date         : 09/26/2010
*/

/*
 * Limitation of CSS3 columns is there cannot be different widths.
 * Future spec may include this.
 */

Ext.ns("Ext.ux");

Ext.ux.TouchGridPanel = Ext.extend(Ext.Panel, {
	defaultRenderer      : function(value) {
		return value;
	},
	initComponent: function() {
		this.templates = this.initTemplates();
		
		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
		
		this.on("afterrender", this.renderGrid, this);
	},
	
	initTemplates: function() {
		var templates = {};
		
		templates.wrap = new Ext.XTemplate(
			'<tpl for=".">',
				'{header}',
				'{body}',
			'</tpl>'
		).compile();
		templates.header = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-grid-header" style="{style}">{row}</div>',
			'</tpl>'
		).compile();
		templates.body = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-grid-rows" style="{style}">{rows}</div>',
			'</tpl>'
		).compile();
		templates.row = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-grid-row" style="{style}" rowIndex="{rowIndex}" selected="false">{cells}</div>',
			'</tpl>'
		).compile();
		templates.cell = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-grid-cell {addlClass}" rowIndex="{rowIndex}" colIndex="{colIndex}">{text}</div>',
			'</tpl>'
		).compile();
		
		return templates;
	},
	
	initScroller: function() {
		var scrollers = {};
		
		scrollers.rows = new Ext.util.Scroller(this.body.dom.lastChild, {
			direction: "vertical",
			listeners : {
				scope       : this,
				scrollstart : this.onScrollStart,
				scrollend   : this.onScrollEnd
			}
		});
		scrollers.wrap = new Ext.util.Scroller(this.body, {
			direction: "horizontal",
			listeners : {
				scope       : this,
				scrollstart : this.onScrollStart,
				scrollend   : this.onScrollEnd
			}
		});
		
		this.scrollers = scrollers;
	},
	
	initEvents: function() {
		if (this.isRendered === true) {
			return ;
		}
		var el = this.body;
		this.mon(el, {
			scope : this,
			tap : this.onTap
		});
		
		this.store.on({
			scope       : this,
			datachanged : this.onDataChange
		});
		
		var header = el.child(".x-grid-header");
		
		header.on("tap", this.handleHdDown, this);
	},
	
	initSelModel         : function() {
		this.on("rowtap", this.onRowTapSelModel, this);
	},
	
	handleHdDown         : function(e, target) {
		var colModel  = this.colModel,
			el        = Ext.get(target),
			index     = this.findColumnIndex(el),
			column    = colModel[index],
			direction = this.sortDirection;
		
		this.sortDirection = (this.sortDirection === "ASC") ? "DESC" : "ASC";
		
		this.clearSortIcons();
		
		el.set({
			"sort": this.sortDirection
		});
		
		this.store.sort(column.mapping, this.sortDirection);
	},
	
	onDataChange         : function() {
		this.refresh();
	},
	
	onRowTapSelModel   : function(grid, el, index, e) {
		var row       = Ext.get(el.findParent(".x-grid-row"));
		
		this.selectRows(row);
	},
	
	onScrollStart        : function() {
		this.lockSelection(true);
	},
	
	onScrollEnd          : function() {
		this.lockSelection(false);
	},
	
	onTap              : function(e) {
		this.processEvent("tap", e);
	},
	
	lockSelection        : function(lock) {
		this.selModel.locked = lock;
	},
	
	renderGrid: function() {
		var templates = this.templates;
		
		var header = this.renderHeader();
		var body = this.renderRows();
		
		var wrap = templates.wrap.apply({
			header: header,
			body: body
		});
		
		this.update(wrap);
		
		this.initEvents();
		this.initScroller();
		this.initSelModel();
		this.isRendered = true;
	},
	
	renderHeader: function() {
		var colModel  = this.colModel,
			totNumCol = this.getColumnCount(true),
			numCol    = this.getColumnCount(),
			templates = this.templates,
			header    = "";
		
		for (var i = 0; i < totNumCol; i++) {
			var column = colModel[i];
			if (column.hidden !== true) {
				var renderer = column.renderer || this.defaultRenderer;
				column.renderer = renderer;
				header += templates.cell.apply({
					rowIndex: null,
					colIndex: i,
					addlClass: "x-grid-hd-cell",
					text: column.header
				});
			}
		}
		
		return templates.header.apply({
			row: header,
			style: "-webkit-column-count:"+numCol
		});
	},
	
	renderRows: function(start, end) {
		var startRow = startRow || 0,
			endRow   = Ext.isDefined(endRow) ? endRow : this.store.getCount() - 1,
			records  = this.store.getRange(startRow, endRow);
		
		return this.doRenderRows(records, startRow);
	},
	
	doRenderRows: function(records, start) {
		var numRecs   = records.length,
			colModel  = this.colModel,
			totNumCol = this.getColumnCount(true),
			numCol    = this.getColumnCount(),
			templates = this.templates;
		
		var rows = "";
		for (var i = 0; i < numRecs; i++) {
			var record = records[i];
			var row = "";
			for (var x = 0; x < totNumCol; x++) {
				var column = colModel[x];
				if (column.hidden !== true) {
					var text = column.renderer.call(this, record.get(column.mapping), record, i, x, this.store);
					row += templates.cell.apply({
						rowIndex: i,
						colIndex: x,
						text: text,
						addlClass: "x-grid-cell-no-of"
					});
				}
			}
			rows += templates.row.apply({
				rowIndex: i,
				cells: row,
				style: "-webkit-column-count:"+numCol
			});
		}
		
		return templates.body.apply({
			rows: rows
		});
	},
	
	getRow               : function(index, returnDom) {
		var node = this.body.child(".x-grid-rows").dom.childNodes[index];
		if (returnDom !== true) {
			node = Ext.get(node);
		}
		return node;
	},
	
	selectRows: function(rows) {
		if (this.selModel.locked === true) {
			return ;
		}
		
		if (!Ext.isArray(rows)) {
			rows = [rows];
		}
		
		for (var i = 0; i < rows.length; i++ ) {
			var row       = rows[i],
				selected  = row.getAttribute("selected"),
				newSelect = (selected === "true") ? false : true,
				deselect  = (newSelect === false) ? "de" : "",
				index = row.getAttribute("rowIndex"),
				record = this.store.getAt(index);
			
			if (this.fireEvent("beforerow"+deselect+"select", this, index, record) !== false) {
				if (this.selModel.singleSelect) {
					var selected = this.selModel.selected;
					if (typeof selected !== "undefined" && selected !== row) {
						selected.set({
							selected : false
						});
					}
					this.selModel.selected = row;
				}
				row.set({
					selected : newSelect
				});
				this.fireEvent("row"+deselect+"select", this, index, record);
			    this.fireEvent("selectionchange", this);
			}
		}
	},
	
	isHeader: function(el) {
		var isHdCell = el.hasCls("x-grid-hd-cell"),
			isHdRow = el.hasCls("x-grid-header");
		
		if (isHdCell === true || isHdRow === true) {
			return true;
		}
		
		return false;
	},
	
	findRowIndex: function(el) {
		return 	parseFloat(el.getAttribute("rowIndex"));
	},
	
	findColumnIndex: function(el) {
		return parseFloat(el.getAttribute("colIndex"));
	},
	
	getStore             : function() {
		return this.store;
	},
	
	getColumnModel       : function() {
		return this.colModel;
	},
	
	getColumnCount       : function(getHidden) {
		if (getHidden === true) {
			return this.colModel.length;
		}
		var i = 0,
			count = 0;
		for (; i < this.colModel.length; i++) {
			if (this.colModel[i].hidden !== true) {
				count++;
			}
		}
		return count;
	},
	
	getColumn            : function(index) {
		return this.colModel[index];
	},
	
	clearSelections      : function() {
		var rows = this.body.child(".x-grid-rows"),
			nodes  = rows.dom.children;
		
		for (i = 0; i < nodes.length; i++) {
			node = Ext.get(nodes[i]);
			node.set({
				selected : false
			});
		}
		delete this.selModel.selected;
	},
	
	clearSortIcons        : function() {
		var header = this.body.child(".x-grid-header"),
			nodes  = header.dom.children;
		
		for (i = 0; i < nodes.length; i++) {
			node = Ext.get(nodes[i]);
			node.set({
				sort : null
			});
		}
	},
	
	moveColumn           : function(oldIndex, newIndex) {
		var colModel = this.colModel,
			column   = colModel[oldIndex];

		colModel.splice(oldIndex, 1);
		colModel.splice(newIndex, 0, column);
		this.colModel = colModel;
		this.refresh(true);
	},
	
	hideColumn           : function(index, cancelRefresh) {
		this.colModel[index].hidden = true;
		if (cancelRefresh !== true) {
			this.refresh(true);
		}
	},
	
	refreshHeaders       : function() {
		var el = this.body.child(".x-grid-header");
		el.update(this.renderHeaders());
	},
	
	refresh              : function(headers) {
		if (this.fireEvent("beforerefresh", this, headers) === false) {
			return ;
		}
		
		if (headers === true) {
			this.refreshHeaders();
		}
		
		var el = this.body.child(".x-grid-rows");
		
		el.setStyle("padding-top", "0em");
		
		el.update(this.renderRows());
		
		this.fireEvent("refresh", this);
	},
	
	processEvent: function(name, e) {
		var target = e.getTarget(),
			el = Ext.get(target),
			isHeader = this.isHeader(el);
		
		this.fireEvent(name, e);
		
		if (isHeader === true) {
			var header = el.findParent(".x-grid-header");
			this.fireEvent("header" + name, this, header, el, e);
		} else {
			var rowIndex = this.findRowIndex(el);
			if (typeof rowIndex === "number") {
				var colIndex = this.findColumnIndex(el);
				if (typeof colIndex === "number") {
					if (this.fireEvent("cell" + name, this, el, rowIndex, colIndex, e) !== false) {
						this.fireEvent("row" + name, this, el, rowIndex, e);
					}
				} else {
					if (this.fireEvent("row" + name, this, el, rowIndex, e) !== false) {
						this.fireEvent("rowbody" + name, this, el, rowIndex, e);
					}
				}
			} else {
				this.fireEvent("container" + name, this, el, e);
			}
		}
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);