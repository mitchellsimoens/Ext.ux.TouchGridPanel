/*
 * Because of limitation of the current WebKit implementation of CSS3 column layout,
 * I have decided to revert back to using table.
 */

Ext.ns("Ext.ux");

Ext.ux.TouchGridPanel = Ext.extend(Ext.Panel, {
	layout        : "fit",

	multiSelect   : false,
	scroll        : "vertical",

	initComponent : function() {
		var me = this;

		me.items = me.dataview = me.buildDataView();

		if (!Ext.isArray(me.dockedItems)) {
			me.dockedItems = [];
		}

		me.header = new Ext.Component(me.buildHeader());
		me.dockedItems.push(me.header);

		Ext.ux.TouchGridPanel.superclass.initComponent.call(me);

		var store = me.store;

		store.on("update", me.dispatchDataChanged, me);
	},

	dispatchDataChanged: function(store, rec, operation) {
		var me = this;

		me.fireEvent("storeupdate", store, rec, operation);
	},

	buildHeader   : function() {
		var me        = this,
			colModel  = me.colModel,
			colNum    = me.getColNum(false),
			cellWidth = 100/colNum,
			colTpl    = '<table class="x-grid-header">';

		colTpl += '    <tr>';
		for (var i = 0; i < colModel.length; i++) {
			var col  = colModel[i],
				flex = col.flex || 1,
				cls  = "";

			var width = flex * cellWidth;

			if (col.hidden) {
				cls += "x-grid-col-hidden";
			}

			colTpl += '<td width="' + width + '%" class="x-grid-cell x-grid-hd-cell x-grid-col-' + col.mapping + ' ' + cls + '" mapping="' + col.mapping + '">' + col.header + '</td>';
		}
		colTpl += '    </tr>';
		colTpl += '</table>';

		return {
			dock      : "top",
			html      : colTpl,
			listeners : {
				scope       : me,
				afterrender : me.initHeaderEvents
			}
		};
	},

	initHeaderEvents: function(cmp) {
		var me = this,
			el = cmp.getEl();

		el.on("click", me.handleHeaderClick, me);
	},

	handleHeaderClick: function(e, t) {
		e.stopEvent();

		var me      = this,
			el      = Ext.get(t),
			mapping = el.getAttribute("mapping");

		if (typeof mapping === "string") {
			me.store.sort(mapping);
			el.set({
				sort : me.store.sortToggle[mapping]
			});
		}
	},

	buildDataView : function() {
		var me        = this,
			colModel  = me.colModel,
			colNum    = me.getColNum(false),
			colTpl    = '<tr class="x-grid-row {isDirty:this.isRowDirty(parent)}">',
			cellWidth = 100/colNum;

		for (var i = 0; i < colModel.length; i++) {
			var col   = colModel[i],
				flex  = col.flex || 1,
				width = flex * cellWidth,
				style = (i === colModel.length - 1) ? "padding-right: 10px;" : "",
				cls   = col.cls || "";

			style += col.style || "";

			if (col.hidden) {
				cls += "x-grid-col-hidden";
			}

			colTpl += '<td width="' + width + '%" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + style + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + col.mapping + '}</td>';
		}
		colTpl += '</tr>';

		return new Ext.DataView({
			store        : me.store,
			itemSelector : "tr.x-grid-row",
			simpleSelect : me.multiSelect,
			scroll       : me.scroll,
			tpl          : new Ext.XTemplate(
				'<table style="width: 100%;">',
					'<tpl for=".">',
						colTpl,
					'</tpl>',
				'</table>',
				{
					isRowDirty: function(dirty, data) {
						return dirty ? "x-grid-row-dirty" : "";
					},
					isCellDirty: function(dirty, data) {
						return dirty ? "x-grid-cell-dirty" : "";
					}
				}
			),
			prepareData  : function(data, index, record) {
				var column,
					i  = 0,
					ln = colModel.length;
				var prepare_data = {};
				prepare_data.dirtyFields = {};
				for (; i < ln; i++) {

					column = colModel[i];
					if (typeof column.renderer === "function") {
						prepare_data[column.mapping] = column.renderer.apply(me, [data[column.mapping],column, record, index]);
					} else {
						prepare_data[column.mapping] = data[column.mapping];
					}
				}

				prepare_data.isDirty = record.dirty;

				prepare_data.rowIndex = index;
				return prepare_data;
			},
			bubbleEvents : [
				"beforeselect",
				"containertap",
				"itemdoubletap",
				"itemswipe",
				"itemtap",
				"selectionchange"
			]
		});
	},

	// hidden = true to count all columns
	getColNum     : function(hidden) {
		var me       = this,
			colModel = me.colModel,
			colNum   = 0;

		for (var i = 0; i < colModel.length; i++) {
			var col = colModel[i];
			if (!hidden && typeof col.header !== "string") { continue; }
			if (!col.hidden) {
				colNum += col.flex || 1;
			}
		}

		return colNum;
	},

	getMappings: function() {
		var me       = this,
			mappings = {},
			colModel = me.colModel;

		for (var i = 0; i < colModel.length; i++) {
			mappings[colModel[i].mapping] = i
		}

		return mappings;
	},

	toggleColumn: function(index) {
		var me = this;

		if (typeof index === "string") {
			var mappings = me.getMappings();
			index = mappings[index];
		}
		var el      = me.getEl(),
			mapping = me.colModel[index].mapping,
			cells   = el.query("td.x-grid-col-"+mapping);

		for (var c = 0; c < cells.length; c++) {
			var cellEl = Ext.get(cells[c]);
			if (cellEl.hasCls("x-grid-col-hidden")) {
				cellEl.removeCls("x-grid-col-hidden");
				this.colModel[index].hidden = false;
			} else {
				cellEl.addCls("x-grid-col-hidden");
				this.colModel[index].hidden = true;
			}
		}

		me.updateWidths();
	},

	updateWidths: function() {
		var me          = this,
			el          = me.getEl(),
			headerWidth = me.header.getEl().getWidth(),
			colModel    = me.colModel,
			cells       = el.query("td.x-grid-cell"),
			colNum      = me.getColNum(false),
			cellWidth   = 100 / colNum,
			mappings    = me.getMappings();

		for (var c = 0; c < cells.length; c++) {
			var cellEl  = Ext.get(cells[c]),
				mapping = cellEl.getAttribute("mapping"),
				col     = colModel[mappings[mapping]],
				flex    = col.flex || 1,
				width   = flex * cellWidth / 100 * headerWidth;

			cellEl.setWidth(width);
		}
	},

	scrollToRow: function(index) {
		var me       = this,
			el       = me.getEl(),
			rows     = el.query("tr.x-grid-row"),
			rowEl    = Ext.get(rows[index]),
			scroller = me.dataview.scroller;

		var pos = {
			x: 0,
			y: rowEl.dom.offsetTop
		};

		scroller.scrollTo(pos, true);
	},

	getView: function() {
		var me = this;

		return me.dataview;
	},

	bindStore: function(store) {
		var me   = this,
			view = me.getView();

		view.bindStore(store);
	},

	getStore: function() {
		var me   = this,
			view = me.getView();

		return view.getStore();
	},

	getRow: function(index) {
		var me = this;
		if (typeof index === "object") {
			var store = me.getStore(),
				index = store.indexOf(index);
		}

		var el   = me.getEl(),
			rows = el.query("tr");

		return rows[index+1];
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);