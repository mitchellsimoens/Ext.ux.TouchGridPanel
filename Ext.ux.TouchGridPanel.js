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

	initComponent : function() {
		this.dataview = this.buildDataView();
		this.items = this.dataview;

		if (!Ext.isArray(this.dockedItems)) {
			this.dockedItems = [];
		}

		this.dockedItems.push(this.buildHeader());

		this.store.on("datachanged", function() {
			this.dataview.scroller.moveTo(0, 0);
		}, this, { single: true });

		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
	},

	buildHeader   : function() {
		var colModel  = this.colModel,
			colNum    = this.getColNum(false),
			cellWidth = 100/colNum,
			colTpl    = '<table class="x-grid-header">';

		colTpl += '    <tr>';
		for (var i = 0; i < colModel.length; i++) {
			var col = colModel[i];
			var flex = col.flex || 1;

			var width = flex * cellWidth;

			colTpl += '<td width="' + width + '%" class="x-grid-cell x-grid-hd-cell" mapping="' + col.mapping + '">' + col.header + '</td>';
		}
		colTpl += '    </tr>';
		colTpl += '</table>';

		return {
			xtype : "component",
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
		var colModel  = this.colModel,
			colNum    = this.getColNum(false),
			colTpl    = '<tr class="x-grid-row">',
			cellWidth = 100/colNum;

		for (var i = 0; i < colModel.length; i++) {
			var col   = colModel[i],
				flex  = col.flex || 1,
				width = flex * cellWidth,
				style = (i === colModel.length - 1) ? "padding-right: 10px;" : "";
			style += col.style || "";

			colTpl += '<td width="' + width + '%" class="x-grid-cell ' + col.cls + '" style="' + style + '">{' + col.mapping + '}</td>';
		}
		colTpl += '</tr>';

		return new Ext.DataView({
			store        : this.store,
			itemSelector : "tr.x-grid-row",
			simpleSelect : this.multiSelect,
			tpl          : new Ext.XTemplate(
				'<table style="width: 100%;">',
					'<tpl for=".">',
						colTpl,
					'</tpl>',
				'</table>'
			),
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
			colNum += col.flex || 1;
		}

		return colNum;
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);