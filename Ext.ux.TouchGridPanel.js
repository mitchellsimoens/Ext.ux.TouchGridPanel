/*
    Author       : Mitchell Simoens
    Site         : http://simoens.org/Sencha-Projects/demos/
    Contact Info : mitchellsimoens@gmail.com
    Purpose      : Creation of a grid for Sencha Touch

	License      : GPL v3 (http://www.gnu.org/licenses/gpl.html)
    Warranty     : none
    Price        : free
    Version      : 2.0b1
    Date         : 1/31/2011
*/

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
		this.dataview = this.buildDataView();
		this.items = this.dataview;

		if (!Ext.isArray(this.dockedItems)) {
			this.dockedItems = [];
		}

		this.header = new Ext.Component(this.buildHeader());
		this.dockedItems.push(this.header);

		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
	},

	buildHeader   : function() {
		var colModel  = this.colModel,
			colNum    = this.getColNum(false),
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
			dock  : "top",
			html  : colTpl,
			listeners: {
				scope: this,
				afterrender: this.initHeaderEvents
			}
		};
	},

	initHeaderEvents: function(cmp) {
		var el = cmp.getEl();
		el.on("click", this.handleHeaderClick, this);
	},

	handleHeaderClick: function(e, t) {
		e.stopEvent();

		var el = Ext.get(t);
		var mapping = el.getAttribute("mapping");

		if (typeof mapping === "string") {
			this.store.sort(mapping);
			el.set({
				sort: this.store.sortToggle[mapping]
			});
		}
	},

	buildDataView : function() {
		var me        = this,
			colModel  = me.colModel,
			colNum    = me.getColNum(false),
			colTpl    = '<tr class="x-grid-row">',
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

			colTpl += '<td width="' + width + '%" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + '" style="' + style + '" mapping="' + col.mapping + '">{' + col.mapping + '}</td>';
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
				'</table>'
			),
			prepareData  : function(data) {
				var column,
					i = 0,
					ln = colModel.length;

				for (; i < ln; i++) {
					column = colModel[i];
					if (typeof column.renderer === "function") {
						data[column.mapping] = column.renderer.apply(me, [data[column.mapping]]);
					}
				}

				return data;
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
		var colModel = this.colModel,
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
		var mappings = {},
			colModel = this.colModel;
		for (var i = 0; i < colModel.length; i++) {
			mappings[colModel[i].mapping] = i
		}

		return mappings;
	},

	toggleColumn: function(index) {
		if (typeof index === "string") {
			var mappings = this.getMappings();
			index = mappings[index];
		}
		var el      = this.getEl(),
			mapping = this.colModel[index].mapping,
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

		this.updateWidths();
	},

	updateWidths: function() {
		var el          = this.getEl(),
			headerWidth = this.header.getEl().getWidth(),
			colModel    = this.colModel,
			cells       = el.query("td.x-grid-cell"),
			colNum      = this.getColNum(false),
			cellWidth   = 100 / colNum;

		var mappings = this.getMappings();

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
		var el       = this.getEl(),
			rows     = el.query("tr.x-grid-row"),
			rowEl    = Ext.get(rows[index]),
			scroller = this.dataview.scroller;

		var pos = {
			x: 0,
			y: rowEl.dom.offsetTop
		};

		scroller.scrollTo(pos, true);
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);