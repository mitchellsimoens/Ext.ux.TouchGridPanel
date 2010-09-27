/*
    Author       : Mitchell Simoens
    Site         : http://simoens.org/Sencha-Projects/demos/
    Contact Info : mitchellsimoens@gmail.com
    Purpose      : Creation of a grid for Sencha Touch
	
	License      : GPL v3 (http://www.gnu.org/licenses/gpl.html)
    Warranty     : none
    Price        : free
    Version      : 1.3
    Date         : 09/26/2010
*/

Ext.ns("Ext.ux");

Ext.ux.TouchGridPanel = Ext.extend(Ext.Panel, {
	/**
     * @private {String} Holds the direction of the current sort.
     * Not a configuration property.
     **/
	sortDirection        : null,
	/**
     * @cfg {Object} Selection model options
     * Currently only a row selection model is available
     **/
	selModel             : {
		type         : "row",
		locked       : false,
		singleSelect : true
	},
	/**
     * @private {String} Holds the CSS class for the header row
     **/
	hdCls                : "x-grid-hd-cell",
	/**
     * @private {String} Holds the CSS class for each cell
     **/
	cellCls              : "x-grid-cell",
	/**
     * @private {String} Holds the CSS class for each row
     **/
	rowCls               : "x-grid-row",
	/**
     * @cfg {Function} Default column renderer
     * Default renderer returns the value as is, no rendering
     **/
	defaultRenderer      : function(value) {
		return value;
	},
	// @private
	initComponent        : function() {
		// Makes sure all options are in the selModel object
		Ext.applyIf(this.selModel, {
			type         : "row",
			singleSelect : true,
			locked       : false,
			selected     : null
		});
		
		// Creates all templates to be used
		this.templates = this.initTemplates();
		
		// Starts the selection model
		this.initSelModel();
		
		// After the underlaying Ext.Panel is rendered,
		// the grid elements will be rendered
		this.on("afterrender", this.renderView, this);
		
		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
	},
	// @private
	// Creates all templates
	initTemplates        : function() {
		var templates = {};
		
		templates.headerTpl    = new Ext.Template('<div class="x-grid-header" style="{style}">{rows}</div>');                                            // Header row template
		templates.headerRowTpl = new Ext.Template('<div class="x-grid-cell x-grid-hd-cell x-grid-col-{id}" colIndex="{colIndex}">{text}</div>');         // Header cell template
		templates.rowsTpl      = new Ext.Template('<div class="x-grid-rows">{cols}</div>');                                                              // Grid rows template
		templates.colsTpl      = new Ext.Template('<div class="x-grid-row" rowIndex="{rowIndex}" selected="false" style="{style}">{cells}</div>');       // Grid row template
		templates.cellsTpl     = new Ext.Template('<div class="x-grid-cell x-grid-col-{id}" colIndex="{colIndex}" rowIndex="{rowIndex}">{text}</div>');  // Grid cell template
		
		return templates;
	},
	// @private
	// Starts the grid UI creation
	renderView           : function() {
		var templates = this.templates;
		
		// Render the header and all rows and insert into body.
		this.body.dom.innerHTML = this.renderHeaders()+this.renderRows();
		
		// Start scrolling of the rows only.
		// Header row will not scroll.
		this.scroller = new Ext.util.Scroller(this.body.dom.lastChild, {
			vertical: true,
			listeners : {
				scope       : this,
				scrollstart : this.onScrollStart,
				scrollend   : this.onScrollEnd
			}
		});
		
		// Execute function to start listeners
		this.afterRenderView();
	},
	// @private
	// Add listeners to grid.
	afterRenderView      : function() {
		var header = Ext.get(this.body.dom.firstChild);
		
		// Listen for the 'click' event.
		// This will look for the row selection
		this.mon(this.body, {
			scope : this,
			click : this.onClick
		});
		
		// Listen for a 'datachange' event on the Store.
		// This will execute when records are added, deleted, edited, and sorted.
		// onDataChange function will remove all rows and rerender them.
		this.store.on({
			scope       : this,
			datachanged : this.onDataChange
		});
		
		// Listen for the 'click' event on the header.
		// handleHdDown function will sort rows.
		header.on("click", this.handleHdDown, this);
	},
	// @private
	// Render the header row.
	renderHeaders        : function() {
		var id, renderer,
			headerArr = [],
			i         = 0,
			colModel  = this.colModel,
			colNum    = colModel.length,
			templates = this.templates;
		
		// Loop through all the columns.
		for (; i < colNum; i++) {
			id = colModel[i].id || Ext.id();
			this.colModel[i].id = id;
			
			// Adds the renderer to the columns.
			renderer = colModel[i].renderer || this.defaultRenderer;
			this.colModel[i].renderer = renderer;
			
			// Creates each header cell.
			headerArr[headerArr.length] = templates.headerRowTpl.apply({
				id       : id,
				text     : colModel[i].header,
				colIndex : i
			});
		}
		
		// Creates and returns the header row.
		return templates.headerTpl.apply({
			rows  : headerArr.join(""),
			style : "-webkit-column-count: "+colNum+";"
		});
	},
	// @private
	// Starts the rendering of the rows.
	renderRows           : function(startRow, endRow) {
		var startRow = startRow || 0,
			endRow   = Ext.isDefined(endRow) ? endRow : this.store.getCount() - 1,
			records  = this.store.getRange(startRow, endRow);
		
		return this.doRowRender(records, startRow);
	},
	// @private
	// Renders each row specified.
	doRowRender          : function(records, startRow) {
		var i, x, colsArr,
			rowsArr   = [],
			meta      = {},
			numRecs   = records.length,
			colModel  = this.colModel,
			colNum    = colModel.length,
			templates = this.templates;
		
		// Loop through each provided record.
		for (x = 0; x < numRecs; x++) {
			colsArr = [];
			meta = {};
			// Loop through each column to create each cell.
			for (i = 0; i < colNum; i++) {
				meta.id = colModel[i].id;
				// Execute the renderer.
				meta.text = colModel[i].renderer.call(this, records[x].get(colModel[i].mapping), records[x], x, i, this.store);
				meta.colIndex = i;
				meta.rowIndex = x;
				
				// Creates the cells for the row.
				colsArr[colsArr.length] = templates.cellsTpl.apply(meta);
			}
			// Creates the row.
			rowsArr[rowsArr.length] = templates.colsTpl.apply({
				cells    : colsArr.join(""),
				rowIndex : x,
				style    : "-webkit-column-count: "+colNum+";"
			});
		}
		
		// Wraps all rows and returns.
		return templates.rowsTpl.apply({
			cols : rowsArr.join("")
		});
	},
	// @private
	// Refreshes the rows when the 'datachanged' event is fired on the Store.
	refresh              : function() {
		// Allow to cancel the refresh.
		if (this.fireEvent("beforerefresh", this) === false) {
			return ;
		}
		
		var el = this.body.child(".x-grid-rows");
		
		// Fix to keep the rows under the header.
		// Not sure why this changes on refresh.
		el.setStyle("padding-top", "0em");
		
		// Add all the rows to the Panel body.
		el.update(this.renderRows());
		
		// Fire the 'refresh' event.
		this.fireEvent("refresh", this);
	},
	// @private
	// Fires various events.
	processEvent         : function(name, e) {
		var row, cell, col, body,
			target = e.getTarget(),
			header = this.findHeaderIndex(target);
		
		// Fires the generic event.
		// Usually going to just be 'click'.
		this.fireEvent(name, e);
		
		// Header row will only have one event to fire.
		if (header !== false) {
			this.fireEvent("header" + name, this, header, e);
		} else {
			// Find the row index.
			row = this.findRowIndex(target);
			// If the element that was clicked was an actual row, proceed bubbling events.
			if (row !== false) {
				// Find column index.
				cell = this.findColIndex(target, this.cellCls);
				// If the element that was clicked was an actual cell, proceed bubbling events.
				if (cell !== false) {
					// Allow to cancel event firing at the cell.
					// 'rowclick' is higher than 'cellclick'
					if (this.fireEvent("cell" + name, this, row, cell, e) !== false) {
						this.fireEvent("row" + name, this, row, e);
					}
				} else {
					// If element was not a cell, is still a row.
					if (this.fireEvent("row" + name, this, row, e) !== false) {
						this.fireEvent("rowbody" + name, this, row, e);
					}
				}
			} else {
				this.fireEvent("container" + name, this, e);
			}
		}
	},
	// @public {Boolean}
	// Disables the selection model.
	// Pass true to disable, false to enable.
	lockSelection        : function(lock) {
		this.selModel.locked = lock;
	},
	// @private
	// Handles the 'click' event on the header row.
	handleHdDown         : function(e, target) {
		var colModel  = this.colModel,
			index     = this.findHeaderIndex(target),
			column    = colModel[index],
			direction = this.sortDirection;
		
		this.sortDirection = (this.sortDirection === "ASC") ? "DESC" : "ASC";
		
		// Sorts the Store.
		// Will fire the 'datachanged' event on the Store.
		this.store.sort(column.mapping, this.sortDirection);
	},
	// @private
	// Handles the 'datachanged' event on the Store.
	onDataChange         : function() {
		// Refresh the rows.
		this.refresh();
	},
	// @private
	// Handles the 'click' event on the Panel body.
	onClick              : function(e) {
		// Execute the processEvent fucntion to fire the various header, row, and/or cell click events.
		this.processEvent("click", e);
	},
	// @private
	// Locks selection when scrolling starts.
	// If the selection was not locked, the row that is clicked on when trying to scroll would be selected.
	onScrollStart        : function() {
		this.lockSelection(true);
	},
	// @private
	// Unlocks selection when scrolling ends.
	onScrollEnd          : function() {
		this.lockSelection(false);
	},
	// @public
	// Finds the column index of an element.
	// Can get index of header or row.
	findColIndex        : function(el, requiredCls) {
		var cell = Ext.get(el);
		
		// requiredCls property is to distinguish whether is a header or not.
		if (!requiredCls || cell.hasClass(requiredCls)) {
			return cell.getAttribute("colIndex");
		}
		return false;
	},
	// @public
	// Finds the row index of an element.
	findRowIndex         : function(el) {
		return Ext.get(el).getAttribute("rowIndex");
	},
	// @public
	// Finds the column index of an element in a header.
	// Just a convenient function.
	findHeaderIndex      : function(el) {
		return this.findColIndex(el, this.hdCls);
	},
	// @private
	// Starts the specified selection model by listening to the 'rowclick' event.
	// Currently only listens to the 'rowclick' event but will eventually listen to the 'cellclick' event.
	initSelModel         : function() {
		this.on("rowclick", this.onRowClickSelModel, this);
	},
	// @private
	// Does the actual selecting and deselecting of the row that was clicked on.
	onRowClickSelModel   : function(grid, index, e) {
		// If selection is currently locked, cancel selection.
		if (this.selModel.locked === true) {
			return ;
		}
		var target    = e.getTarget(),
			el        = Ext.get(target),
			row       = Ext.get(el.findParent("."+this.rowCls)),
			selected  = row.getAttribute("selected"),
			newSelect = (selected === "true") ? false : true,
			deselect  = (newSelect === false) ? "de" : "",
			record    = this.store.getAt(index);
		
		// Allow for cancelation of selection/deselection.
		if (this.fireEvent("beforerow"+deselect+"select", this, index, record) !== false) {
			// If singleSelect is true, deselect the currently selected row.
			if (this.selModel.singleSelect) {
				if (this.selModel.selected !== null && this.selModel.selected !== row) {
					this.selModel.selected.set({
						selected : false
					});
				}
				this.selModel.selected = row;
			}
			
			// Select the row.
			row.set({
				selected : newSelect
			});
			this.fireEvent("row"+deselect+"select", this, index, record);
		    this.fireEvent("selectionchange", this);
		}
	},
	// @public
	// Clears all the selected rows.
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

// Xtype
Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);