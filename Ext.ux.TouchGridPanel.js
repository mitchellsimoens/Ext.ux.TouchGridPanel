Ext.ns("Ext.ux");

Ext.ux.TouchGridPanel = Ext.extend(Ext.Panel, {
	cellSelector      : 'td.x-grid3-cell',
	cellSelectorDepth : 4,
	tdClass           : 'x-grid3-cell',
	hdCls             : 'x-grid3-hd',
	sortDirection     : null,
	masterTpl         : new Ext.Template(
		'<div class="x-grid3" hidefocus="true">',
			'<div class="x-grid3-viewport" style="display:table;">',
				'<div class="x-grid3-header-row" style="display:table-row;">',
					'<div class="x-grid3-header">',
						'<div class="x-grid3-header-inner">',
							'<div class="x-grid3-header-offset" style="{ostyle}">{header}</div>',
						'</div>',
						'<div class="x-clear"></div>',
					'</div>',
				'</div>',
				'<div class="x-grid3-scroller-row" style="display:table-row;">',
					'<div class="x-grid3-scroller">',
						'<div class="x-grid3-body" style="{bstyle}">{body}</div>',
						'<a href="#" class="x-grid3-focus" tabIndex="-1"></a>',
					'</div>',
				'</div>',
			'</div>',
			'<div class="x-grid3-resize-marker">&#160;</div>',
			'<div class="x-grid3-resize-proxy">&#160;</div>',
		'</div>'
	),
	headerTpl         : new Ext.Template(
		'<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
			'<thead>',
				'<tr class="x-grid3-hd-row">{cells}</tr>',
			'</thead>',
		'</table>'
	),
	headerCellTpl     : new Ext.Template(
		'<td class="x-grid3-hd x-grid3-cell x-grid3-td-{id} {css}" style="{style}">',
			'<div {tooltip} {attr} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', 
				'{value}',
				'<img class="x-grid3-sort-icon" src="', Ext.BLANK_IMAGE_URL, '" />',
			'</div>',
		'</td>'
	),
	bodyTpl           : new Ext.Template('{rows}'),
	cellTpl           : new Ext.Template(
		'<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}" tabIndex="0" {cellAttr}>',
			'<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on" {attr}>{value}</div>',
		'</td>'
	),
	initComponent     : function() {
		this.templates = this.initTemplates();
		
		this.on("afterrender", this.renderView, this);
		
		Ext.ux.TouchGridPanel.superclass.initComponent.call(this);
	},
	getGridEl         : function() {
		return this.body;
	},
	initTemplates     : function() {
		var templates = this.templates || {},
			template,
			name,
			innerText = [
				'<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
					'<tbody>',
						'<tr>{cells}</tr>',
					'</tbody>',
				'</table>'
			].join("");
		
		Ext.applyIf(templates, {
			master     : this.masterTpl,
			body       : this.bodyTpl,
			header     : this.headerTpl,
			headerCell : this.headerCellTpl,
			row        : new Ext.Template('<div class="x-grid3-row {alt}" style="{tstyle}">' + innerText + '</div>'),
			rowInner   : new Ext.Template(innerText),
			cell       : this.cellTpl,
		});
		
		for (name in templates) {
            template = templates[name];
            
            if (template && Ext.isFunction(template.compile) && !template.compiled) {
                template.disableFormats = true;
                template.compile();
            }
        }
		this.colRe = new RegExp('x-grid3-td-([^\\s]+)', '');
		return templates;
	},
	initElements      : function() {
		var Element     = Ext.Element,
			el          = Ext.get(this.getGridEl().dom.firstChild),
			mainWrap    = new Element(el.child("div.x-grid3-viewport")),
			firstRow    = new Element(mainWrap.child("div.x-grid3-header-row")),
			secondRow   = new Element(mainWrap.child("div.x-grid3-scroller-row")),
			mainHd      = new Element(firstRow.child("div.x-grid3-header")),
			scroller    = new Element(secondRow.child("div.x-grid3-scroller")),
			scrollerDom = new Element(Ext.Element.fly(scroller).dom);
		
		if (this.hideHeaders) {
			mainHd.setDisplayed(false);
		}
		
		if (this.forceFit) {
			scroller.setStyle('overflow-x', 'hidden');
		}
		
		Ext.apply(this, {
			mainWrap     : mainWrap,
			scrollerDOM  : scroller,
			mainHd       : mainHd,
			innerHd      : mainHd.child('div.x-grid3-header-inner').dom,
			mainBody     : scrollerDom.child("div.x-grid3-body"),
			focusEl      : scrollerDom.child('a'),
			resizeMarker : new Element(el.child('div.x-grid3-resize-marker')),
			resizeProxy  : new Element(el.child('div.x-grid3-resize-proxy'))
		});
		
		this.focusEl.on("click", Ext.emptyFn, this);
	},
	renderView        : function() {
		this.getGridEl().dom.innerHTML = this.renderUI();
		
		this.afterRenderUI();
		
		this.refresh();
	},
	renderUI          : function() {
		var templates = this.templates,
			width = this.getTotalWidth();
		
		return templates.master.apply({
			body   : templates.body.apply({rows:'&#160;'}),
			header : this.renderHeaders(),
			ostyle : 'width:' + width + ';',
			bstyle : 'width:' + width  + ';'
		});
	},
	afterRenderUI     : function() {
		this.initElements();
		this.store.on({
			scope : this,
			datachanged: this.onDataChange
		});
		
		Ext.fly(this.innerHd).on('click', this.handleHdDown, this);
	},
	handleHdDown : function(e, target) {
		var colModel  = this.colModel,
			header    = this.findHeaderCell(target),
			index     = this.getCellIndex(header),
			column    = colModel[index],
			direction = this.sortDirection;
		
		this.sortDirection = (this.sortDirection === "ASC") ? "DESC" : "ASC";
		
		this.store.sort(column.mapping, this.sortDirection);
	},
	renderHeaders     : function() {
		 var colModel   = this.colModel,
         	templates  = this.templates,
         	headerTpl  = templates.headerCell,
         	properties = {},
         	colCount   = colModel.length,
         	last       = colCount - 1,
         	cells      = [],
         	i, id,
         	cssCls;
		 
		for (i = 0; i < colCount; i++) {
			if (i == 0) {
				cssCls = 'x-grid3-cell-first ';
			} else {
				cssCls = i == last ? 'x-grid3-cell-last ' : '';
			}
			
			id = colModel[i].id || Ext.id();
			this.colModel[i].id = id;
			
			properties = {
				id     : id,
				value  : colModel[i].header || '',
				style  : this.getColumnStyle(i, true),
				css    : cssCls,
				tooltip: this.getColumnTooltip(i)
			};
			
			if (colModel[i].align == 'right') {
				properties.istyle = 'padding-right: 16px;';
			} else {
				delete properties.istyle;
			}
			
			cells[i] = headerTpl.apply(properties);
		}
		
		return templates.header.apply({
			cells : cells.join(""),
			tstyle: String.format("width: {0};", this.getTotalWidth() + "px")
		});
	},
	getTotalWidth     : function(includeHidden) {
		var totalWidth = 0;
		for (var i = 0, len = this.colModel.length; i < len; i++) {
			if (includeHidden || !this.colModel[i].hidden) {
				totalWidth += this.getColumnWidth(i);
			}
		}
		return totalWidth;
	},
	getColumnStyle    : function(colIndex, isHeader) {
		var colModel  = this.colModel,
			style     = isHeader ? '' : colModel[colIndex].cls || '',
			align     = colModel[colIndex].align || "left";
		
		style += String.format("width: {0};", this.getColumnWidth(colIndex)+"px");
		
		if (colModel[colIndex].hidden) {
			style += 'display: none; ';
		}
		
		if (align) {
			style += String.format("text-align: {0};", align);
		}
		
		return style;
	},
	getColumnWidth    : function(colIndex) {
		var columnWidth = this.colModel[colIndex].width,
			borderWidth = 1;
		
		if (Ext.isNumber(columnWidth)) {
			if (Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2)) {
				return columnWidth;
			} else {
				return Math.max(columnWidth - borderWidth, 0);
			}
		} else {
			return columnWidth;
		}
	},
	getColumnTooltip  : function(colIndex) {
		var tooltip = this.colModel[colIndex].tooltip;
		if (tooltip) {
			if (Ext.QuickTips.isEnabled()) {
				return 'ext:qtip="' + tooltip + '"';
			} else {
				return 'title="' + tooltip + '"';
			}
		}
		
		return '';
	},
	getRows           : function() {
		return this.hasRows() ? this.mainBody.dom.childNodes : [];
	},
	hasRows           : function() {
		var fc = this.mainBody.dom.firstChild;
		return fc && fc.nodeType == 1 && fc.className != 'x-grid-empty';
	},
	renderRows        : function(startRow, endRow) {
		var startRow = startRow || 0,
        	endRow   = Ext.isDefined(endRow) ? endRow : this.store.getCount() - 1,
        	records  = this.store.getRange(startRow, endRow);
		
		return this.doRender(records, startRow);
	},
	doRender          : function(records, startRow) {
		var colBuffer = [],
			rowBuffer = [],
			len = records.length,
			colCount = this.colModel.length,
			columns = this.colModel,
			last = colCount - 1,
			tstyle = 'width:' + this.getTotalWidth() + 'px;',
			rowParams = {tstyle: tstyle},
			rowTemplate = this.templates.row,
			meta = {},
			i, j, column, record, alt;
		
		for (j = 0; j < len; j++) {
			record    = records[j];
			colBuffer = [];
			
			rowIndex = j + startRow;
			
			for (i = 0; i < colCount; i++) {
				column = columns[i];
				
				meta.id    = column.id;
				meta.css   = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
				meta.attr  = meta.cellAttr = '';
				meta.style = column.style || "";
				meta.value = record.get(column.mapping);
				
				meta.style += " width: " + column.width + "px;";
				
				if (Ext.isEmpty(meta.value)) {
					meta.value = '&#160;';
				}
				
				colBuffer[colBuffer.length] = this.templates.cell.apply(meta);
			}
			
			alt = [];
			
			rowParams.cols = colCount;
			
			rowParams.alt   = alt.join(' ');
			rowParams.cells = colBuffer.join('');
			
			rowBuffer[rowBuffer.length] = rowTemplate.apply(rowParams);
		}
		
		return rowBuffer.join('');
	},
	refresh           : function(headersToo) {
		this.fireEvent('beforerefresh', this);

		var result = this.renderBody();
		
		this.mainBody.update(result).setWidth(this.getTotalWidth());
		if (headersToo === true) {
//			this.updateHeaders();
//			this.updateHeaderSortState();
		}
		this.processRows(0, true);
		this.applyEmptyText();
		this.fireEvent('refresh', this);
	},
	renderBody        : function(){
		var markup = this.renderRows() || '&#160;';
		return this.templates.body.apply({rows: markup});
	},
	processRows       : function(startRow, skipStripe) {
		if (!this.store || this.store.getCount() < 1) {
			return;
		}
		
		var rows   = this.getRows(),
			length = rows.length,
			row, i;
		
		skipStripe = skipStripe || !this.grid.stripeRows;
		startRow   = startRow   || 0;
		
		for (i = 0; i < length; i++) {
			row = rows[i];
			if (row) {
				row.rowIndex = i;
				if (!skipStripe) {
					row.className = row.className.replace(this.rowClsRe, ' ');
					if ((i + 1) % 2 === 0){
						row.className += ' x-grid3-row-alt';
					}
				}
			}
		}
		
		// add first/last-row classes
		if (startRow === 0) {
			Ext.fly(rows[0]).addClass(this.firstRowCls);
		}
		
		Ext.fly(rows[length - 1]).addClass(this.lastRowCls);
	},
	applyEmptyText    : function() {
		if (this.emptyText && !this.hasRows()) {
			this.mainBody.update('<div class="x-grid-empty">' + this.emptyText + '</div>');
		}
	},
	findHeaderCell    : function(el) {
		var cell = this.findCell(el);
		return cell && this.fly(cell).hasClass(this.hdCls) ? cell : null;
	},
	findCell          : function(el) {
		if (!el) {
			return false;
		}
		return this.fly(el).findParent(this.cellSelector, this.cellSelectorDepth);
	},
	fly               : function(el) {
		if (!this._flyweight) {
			this._flyweight = new Ext.Element.Flyweight(document.body);
		}
		this._flyweight.dom = el;
		return this._flyweight;
	},
	getCellIndex : function(el) {
		if (el) {
			var match = el.className.match(this.colRe);
			
			if (match && match[1]) {
				return this.getIndexById(match[1]);
			}
		}
		return false;
	},
	getIndexById : function(id) {
		for (var i = 0, len = this.colModel.length; i < len; i++) {
			if (this.colModel[i].id == id) {
				return i;
			}
		}
		return -1;
	},
	onDataChange      : function() {
		this.refresh();
	}
});

Ext.reg("touchgridpanel", Ext.ux.TouchGridPanel);