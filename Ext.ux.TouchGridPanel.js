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

/*
 * Limitation of CSS3 columns is there cannot be different widths.
 * Future spec may include this.
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
	headerCls            : "x-grid-header",
	/**
     * @private {String} Holds the CSS class for each cell
     **/
	cellCls              : "x-grid-cell",
	/**
     * @private {String} Holds the CSS class for the rows
     **/
	rowsCls              : "x-grid-rows",
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
	/**
     * @private {String} Holds the components to be rendered
     **/
	components           : [],
	enableDD             : false,
	/**
     * @cfg {Boolean} If row allows edit
     * Will add two columns, one at beginning and one at end.
     * Beginning column will have red circle image that will
     * activate the column at the end which has delete button.
     **/
	editable             : false,
	// @private
	initComponent        : function() {
		// Makes sure all options are in the selModel object
		Ext.applyIf(this.selModel, {
			type         : "row",
			singleSelect : true,
			locked       : false,
			selected     : null
		});
		
		// Creates a last column for the delete button
		this.colModel.push({
			header : "&nbsp;",
			hidden : true
		});
		
		// Creates all templates to be used
		this.templates = this.initTemplates();
		
		// Starts the selection model
		this.initSelModel();
		
		if (this.enableDD === true) {
			// Starts the Drag and Drop process
			this.initDD();
		}
		
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
		templates.headerRowTpl = new Ext.Template('<div class="x-grid-cell x-grid-hd-cell x-grid-col-{id}" id="{id}" colIndex="{colIndex}" sort="null">{text}</div>');         // Header cell template
		templates.rowsTpl      = new Ext.Template('<div class="x-grid-rows">{cols}</div>');                                                              // Grid rows template
		templates.colsTpl      = new Ext.Template('<div class="x-grid-row" rowIndex="{rowIndex}" selected="false" style="{style}">{cells}</div>');       // Grid row template
		templates.cellsTpl     = new Ext.Template('<div class="x-grid-cell x-grid-col-{id} {overflow}" id="{id}" colIndex="{colIndex}" rowIndex="{rowIndex}">{text}</div>');  // Grid cell template
		
		return templates;
	},
	// @private
	// Start drag and drop
	initDD               : function() {
		new Ext.util.Droppable(this.body, {});
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
			vertical  : true,
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
		
		this.renderComponents();
		
		this.on("refresh", this.renderComponents, this);
		
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
	// Renders buttons to the correct cell
	renderComponents     : function() {
		var components = this.components,
			ln, i, component, delegate;        
		if (components) {
			for (i = 0, ln = components.length; i < ln; i++) {
				component = components[i];
				component.config.renderTo = Ext.get(component.config.renderTo);
				component.config.renderTo.update("");
				new Ext.Button(component.config);
			}
		}
	},
	// @private
	// Render the header row.
	renderHeaders        : function() {
		var id, renderer,
			headerArr = [],
			i         = 0,
			colModel  = this.colModel,
			colNum    = this.getColumnCount(true),
			templates = this.templates;
		
		// Loop through all the columns.
		for (; i < colNum; i++) {
			id = colModel[i].id || Ext.id();
			this.colModel[i].id = id;
			
			Ext.applyIf(this.colModel[i].hidden, false);
			
			// Adds the renderer to the columns.
			renderer = colModel[i].renderer || this.defaultRenderer;
			this.colModel[i].renderer = renderer;
			
			// Creates each header cell.
			if (this.colModel[i].hidden !== true) {
				headerArr[headerArr.length] = templates.headerRowTpl.apply({
					id       : id,
					text     : colModel[i].header,
					colIndex : i
				});
			}
		}
		
		// Creates and returns the header row.
		return templates.headerTpl.apply({
			rows  : headerArr.join(""),
			style : "-webkit-column-count: "+this.getColumnCount()+";"
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
		var i, x, colsArr, record,
			rowsArr   = [],
			meta      = {},
			numRecs   = records.length,
			colModel  = this.colModel,
			colNum    = this.getColumnCount(true),
			templates = this.templates;
		
		// Loop through each provided record.
		for (x = 0; x < numRecs; x++) {
			colsArr = [];
			meta = {};
			record = records[x];
			// Loop through each column to create each cell.
			for (i = 0; i < colNum; i++) {
				if (colModel[i].hidden !== true) {
					if (i === (colNum-1)) {
						meta.id = Ext.id();
						meta.text = "Button";
						meta.colIndex = i;
						meta.rowIndex = x;
						meta.overflow = "x-grid-cell-del-btn";
						
						// Creates the cell for the row-column
						var cell = colsArr[colsArr.length] = templates.cellsTpl.apply(meta);
						
			            this.components = this.components || [];
			            this.components.push({
			                config: {
			                    xtype    : "button",
			                    text     : "Delete",
			                    ui       : "decline-small",
			                    record   : records[x],
			                    renderTo : meta.id,
			                    scope    : this,
			                    handler  : function(b, e) {
			                		this.deleteRecord(b.record);
			                	}
			                }
			            });
					} else {
						meta.id = colModel[i].id;
						// Execute the renderer.
						meta.text = colModel[i].renderer.call(this, records[x].get(colModel[i].mapping), records[x], x, i, this.store);
						meta.colIndex = i;
						meta.rowIndex = x;
						meta.overflow = "x-grid-cell-no-of";
						
						// Creates the cell for the row-column
						colsArr[colsArr.length] = templates.cellsTpl.apply(meta);
					}
				}
			}
			// Creates the row.
			rowsArr[rowsArr.length] = templates.colsTpl.apply({
				cells    : colsArr.join(""),
				rowIndex : x,
				style    : "-webkit-column-count: "+this.getColumnCount()+";"
			});
		}
		
		// Wraps all rows and returns.
		return templates.rowsTpl.apply({
			cols : rowsArr.join("")
		});
	},
	// @public
	// Refreshes the rows when the 'datachanged' event is fired on the Store.
	// Can call to refresh the rows publically.
	// headers is a Boolean to include (true) refreshing of the headers or not (false).
	refresh              : function(headers) {
		// Allow to cancel the refresh.
		if (this.fireEvent("beforerefresh", this, headers) === false) {
			return ;
		}
		
		if (headers === true) {
			this.refreshHeaders();
		}
		
		var el = this.body.child("."+this.rowsCls);
		
		// Fix to keep the rows under the header.
		// Not sure why this changes on refresh.
		el.setStyle("padding-top", "0em");
		
		// Add all the rows to the Panel body.
		el.update(this.renderRows());
		
		// Fire the 'refresh' event.
		this.fireEvent("refresh", this);
	},
	// @public
	// Refreshes the header row.
	// Can call to refresh the header publically.
	refreshHeaders       : function() {
		var el = this.body.child("."+this.headerCls);
		el.update(this.renderHeaders());
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
			direction = this.sortDirection,
			target    = Ext.get(target);
		
		this.sortDirection = (this.sortDirection === "ASC") ? "DESC" : "ASC";
		
		this.clearSortIcons();
		
		target.set({
			"sort": this.sortDirection
		});
		
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
	},
	// @public
	// Clears all the icons specifying sorting
	clearSortIcons        : function() {
		var header = Ext.get(this.body.dom.firstChild),
			nodes  = header.dom.children;
		
		for (i = 0; i<nodes.length; i++) {
			node = Ext.get(nodes[i]);
			node.set({
				sort : null
			});
		}
	},
	// @public
	// Convenient method to delete a record from the store with a confirming action sheet
	deleteRecord         : function(record) {
		if (!Ext.isDefined(this.deleteConfirmer)) {
			this.deleteConfirmer = new Ext.ActionSheet({
				items: [{
					text    : "Delete Record",
					ui      : "decline",
					scope   : this,
					handler : function(){
						this.store.remove(record);
						this.refresh();
						this.deleteConfirmer.hide();
					}
				},{
					text    : "Cancel",
					ui      : "confirm",
					scope   : this,
					handler : function(){
						this.deleteConfirmer.hide();
					}
				}]
			});
		}
		this.deleteConfirmer.show();
	},
	// @public
	// Makes the two columns for editing appear
	enableEdit           : function(allow) {
		if (this.editable === allow) {
			return;
		}
		this.editable = allow;
		if (allow === true) {
			this.showColumn(this.getColumnCount(true)-1, true);
		} else {
			this.hideColumn(this.getColumnCount(true)-1, true);
		}
		this.refresh(true);
	},
	// @public
	// Finds the column index of an element.
	// Can get index of header or row.
	findColIndex         : function(el, requiredCls) {
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
	// @public
	// Returns column object by index.
	getColumn            : function(index) {
		return this.colModel[index];
	},
	// @public
	// Returns number of columns.
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
	// @public
	// Returns entire column model object.
	getColumnModel       : function() {
		return this.colModel;
	},
	// @public
	// Returns the row element from a specified index.
	// If element is true, it will return the Ext.Element wrapped element.
	getRow               : function(index, returnDom) {
		var node = this.body.child("."+this.rowsCls).dom.childNodes[index];
		if (returnDom !== true) {
			node = Ext.get(node);
		}
		return node;
	},
	// @public
	// Returns the grid's Store
	getStore             : function() {
		return this.store;
	},
	// @public
	// Hides a column
	hideColumn           : function(index, cancelRefresh) {
		this.colModel[index].hidden = true;
		if (cancelRefresh !== true) {
			this.refresh(true);
		}
	},
	// @public
	// Moves a column to a new position.
	// Will refresh all rows.
	moveColumn           : function(oldIndex, newIndex) {
		var colModel = this.colModel,
			column   = colModel[oldIndex];

		colModel.splice(oldIndex, 1);
		colModel.splice(newIndex, 0, column);
		this.colModel = colModel;
		this.refresh(true);
	},
	// @public
	// Selects specified row by indexes.
	// Can be a single row or an array of rows.
	// If singleSelect is true, will only select the last row
	// but each selection event series will still fire.
	selectRows            : function(rows) {
		// If selection is currently locked, cancel selection.
		if (this.selModel.locked === true) {
			return ;
		}
		// Convert rows to array if not already
		if (!Ext.isArray(rows)) {
			rows = [rows];
		}
		// Loop through the specified rows.
		for (var i = 0; i < rows.length; i++) {
			var row       = rows[i],
				selected  = row.getAttribute("selected"),
				newSelect = (selected === "true") ? false : true,
				deselect  = (newSelect === false) ? "de" : "",
				index = row.getAttribute("rowIndex"),
				record = this.store.getAt(index);
			
			// Allow for cancelation of row selection or deselection.
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
		}
	},
	// @public
	// Shows a hidden column
	showColumn           : function(index, cancelRefresh) {
		this.colModel[index].hidden = false;
		if (cancelRefresh !== true) {
			this.refresh(true);
		}
	},
	// @public
	// Updates the different config options of a column
	updateColumnConfig   : function(index, config) {
		
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
		var target    = e.getTarget(),
			el        = Ext.get(target),
			row       = Ext.get(el.findParent("."+this.rowCls));
		this.selectRows(row);
	}
});

// Xtype
Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);