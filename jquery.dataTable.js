(function($){
 
    var methods =
    {
        init : function(options)
        {
            return this.each(function()
            {
                var $this = $(this)
                var data  = $this.data("dataTable")
                 
                if (!data)
                {
                    options = $.extend({
                        title: "Data",
                        model: "",
                        queryParams: {},
                        id: "",
                        filters: null,
                        searchFields: null,
                        columns: [],
                        formatRow: null,
                        containerClass : "dataTable",
                        classPrefix : "dataTable-",
                        menuItems : {},
                        defaultSort: "",
                        defaultFilter: "",
                        loadData: null,
                        maxItems: 25,
                        selection: false,
                        searchModes: {"": "=", "!": "≠", "|": "∈", ">": "≥", "<": "≤", "~": "≈", "*": "∼"}
                        }, options)
                    
                    $(this).data("dataTable", { dataTable: new DataTable($this, options) });
                    
                    var data  = $this.data("dataTable")
                }
                else data.dataTable.options = $.extend(data.options, options)
            });
        },
         
        option : function(name, value)
        {
            return this.each(function()
            {
                var data = $(this).data("dataTable")
 
                if (data)
                    data.dataTable.setOption(name, value)
            })
        },
        
        retrieve : function()
        {
            return this.each(function()
            {
                var data = $(this).data("dataTable")
 
                if (data)
                    data.dataTable.retrieveData()
            })
        },
        
        updateRow : function(row_id, row_data)
        {
            return this.each(function()
            {
                var data = $(this).data("dataTable")
 
                if (data)
                    data.dataTable.updateRow(row_id, row_data)
            })
        },
        
        destroy : function()
        {
            return this.each(function()
            {
                var $this = $(this)
                var data  = $this.data('dataTable')
                data.dataTable.remove();
                $this.removeData('dataTable')
            })
        }
    }
 
    $.fn.dataTable = function(method)
    {
        if (methods[method])
        {
            return methods[method].apply( this,
                Array.prototype.slice.call(arguments, 1))
        }
        else if (typeof method === "object" || !method)
        {
            return methods.init.apply(this, arguments)
        }
        else
        {
            $.error('Method ' +  method + ' does not exist on jQuery.dataTable');
        }   
    }
 
    var DataTable = function(input, options)
    {
        var $input = input
        var $search, $query, $filter, $results, $more
        var start_index = 1
        var sort_field  = options.defaultSort.replace(/\s*(asc|dsc)/, "")
        var sort_order  = (options.defaultSort.match(/asc|dsc/) || "").toString()
        var shown_items = 0
        var total_items = 0
        var selected    = []
        
        var formatRow = function(row, data)
        {
            for (var i in options.columns)
            {
                var td = $(document.createElement("td"))
                          .attr("data-field", options.columns[i].field)
                          .appendTo(row)
                
                if (!options.columns[i].visible)
                {
                     td.hide()
                }
                else if (data[options.columns[i].field] != null)
                {
                    td.html(typeof options.columns[i].formatData == "function"
                                  ? options.columns[i].formatData(data[options.columns[i].field], data)
                                  : data[options.columns[i].field])
                }
            }
        }
        
        var buildQuery = function()
        {
            var query = {
                "start_index"     : start_index,
                "max_items"       : options.maxItems,
                "sort_field"      : sort_field,
                "sort_order"      : sort_order
            }
            
            for (var x in options.queryParams) query[x] = options.queryParams[x]
            
            if (typeof $filter != "undefined") query["filter"] = $filter.val()
            
            $search.find("div").each(function()
            {
                var searchField = $(this)
                var value = $.trim(searchField.find(".input").val())
                var mode  = searchField.find(".mode").val()
                if (value) query[$(this).find(".field").val() + mode] = value
            })
            
            var date_range = input.find("." + options.classPrefix + "date-range")
            
            if (date_range.length)
            {
                var date_start = date_range.find("input[name=date_start]").val()
                var date_end   = date_range.find("input[name=date_end]"  ).val()
                
                if (options.dateRange.start) query[options.dateRange.start] = date_start
                else query["date_start"] = options.dateRange.start
                
                if (options.dateRange.end) query[options.dateRange.end] = date_end
                else query["date_end"] = options.dateRange.end
            }
            
            return query
        }
        
        var retrieveData = function(callback)
        {
            var query = buildQuery()
            
            Steam.retrieve(options.model, query, function(xhr, status)
            {
                if (typeof callback == "function") return callback(xhr)
                
                if (start_index == 1)
                {
                    shown_items = 0
                    $results.html("")
                }
                
                total_items  = +(xhr.getResponseHeader("X-Steam-Total-Results"))
                shown_items += +(xhr.getResponseHeader("X-Steam-Total-Items"))
                $results.attr("data-total-items", total_items)
                
                if (total_items == -1 || total_items > shown_items)
                    $more.show()
                else
                    $more.hide()
                
                var format  = (typeof options.formatRow == "function") ? options.formatRow : formatRow
                var odd_row = (start_index % 2 == 0) ? false : true
                var nodes   = xhr.status == 200 ? xhr.responseXML.childNodes.item(0).childNodes : []
                var rows    = []
                
                for (var x = 0; x < nodes.length; x++) if (nodes.item(x).nodeName == "items") rows = nodes.item(x).childNodes
                
                $.each(rows, function(i, node)
                {
                    var row = {}
                    for (var x = 0; x < node.childNodes.length; x++) row[node.childNodes.item(x).nodeName] = node.childNodes.item(x).textContent
                    
                    var tr = $(document.createElement("tr")).addClass(options.classPrefix + (odd_row ? "odd-row" : "even-row"))
                    
                    if (options.selection)
                    {
                        $(document.createElement("td")).addClass("select-row").appendTo(tr).append(
                            $(document.createElement("div")).addClass("checkbox")
                                .click(function()
                                {
                                    if (tr.hasClass("selected-row"))
                                    {
                                        var index = $.inArray(row[options.id], selected)
                                        selected.splice(index, 1)
                                        tr.removeClass("selected-row")
                                    }
                                    else
                                    {
                                        selected.push(row[options.id])
                                        tr.addClass("selected-row")
                                    }
                                    
                                    updateSelection()
                                })
                        )
                        
                        if (selected.indexOf(row[options.id]) != -1) tr.addClass("selected-row")
                    }
                    
                    if (options.id) tr.attr("data-id", row[options.id])
                    format(tr, row)
                    tr.appendTo($results)
                    odd_row = !odd_row
                })
                
                if (typeof options.loadData == "function") options.loadData(input)
            })
        }
        
        var makeSearch = function()
        {
            if (typeof options.searchFields == "undefined" || options.searchFields == null || options.searchFields.length == 0) return
            
            var search = $(document.createElement("div"))
            var select = $(document.createElement("select")).addClass("field").appendTo(search)
            var mode   = $(document.createElement("select")).addClass("mode").appendTo(search)
            
            if (typeof options.searchFieldChange != "undefined") select.change(function() { options.searchFieldChange(search) })
            
            $(document.createElement("input")).addClass("input").keypress(function(event) { if (event.keyCode == '13') $query.click() }).appendTo(search)
            $(document.createElement("button")).html("+").one("click", function() { $(this).html("-").click(function() { search.remove() }); makeSearch() }).appendTo(search)
            
            for (var x in options.searchFields)
                $(document.createElement("option")).attr("value", x).html(options.searchFields[x]).appendTo(select)
            
            for (var x in options.searchModes)
                $(document.createElement("option")).attr("value", x).html(options.searchModes[x]).appendTo(mode)
            
            search.prependTo($search)
        }
        
        var makeMenu = function()
        {
            var menu = $(document.createElement("ul"))
            
            $(document.createElement("li")).text("Export CSV").click(exportCSV).appendTo(menu)
            
            $.each(options.menuItems, function(text, callback)
            {
                $(document.createElement("li")).text(text).click(function() { callback(selected); menu.slideToggle() }).appendTo(menu)
            })
            
            $(document.createElement("li")).text("----").addClass(options.classPrefix + "menu-separator").appendTo(menu)
            
            
            $.each(options.columns, function()
            {
                var column  = this
                var visible = column.visible ? "active" : "inactive"
                $(document.createElement("li")).html(column.label).attr("data-field", column.field).addClass(options.classPrefix + "menu-" + visible).click(function()
                {
                    if (column.visible)
                        hideColumn(column.field)
                    else
                        showColumn(column.field)
                
                }).appendTo(menu)
            })
            
            var menu_button = $(document.createElement("button")).text("-").addClass(options.classPrefix + "menu-button").click(function()
            {
                menu.slideToggle()
            }).prependTo(input)
            
            $(document.createElement("div")).addClass(options.classPrefix + "menu").append(menu.hide()).prependTo(input)
            
        }
        
        var makeTable = function()
        {
            $input.addClass(options.containerClass)
            var title_div = $(document.createElement("div")).addClass(options.classPrefix + "title").html(options.title).appendTo(input)
            var query_div = $(document.createElement("div")).addClass(options.classPrefix + "query").appendTo(input)
            var query_lim = $(document.createElement("select")).appendTo(query_div).change(function(){ options.maxItems = $(this).val() })
            var query_btn = $(document.createElement("button")).text("Retrieve Data").appendTo(query_div)
            var findr_div = $(document.createElement("div")).addClass(options.classPrefix + "search").appendTo(input)
            var selct_div = $(document.createElement("div"))
            
            $(document.createElement("option")).attr("value", options.maxItems     ).text(options.maxItems      + " Results").appendTo(query_lim)
            $(document.createElement("option")).attr("value", options.maxItems *  2).text(options.maxItems *  2 + " Results").appendTo(query_lim)
            $(document.createElement("option")).attr("value", options.maxItems *  4).text(options.maxItems *  4 + " Results").appendTo(query_lim)
            $(document.createElement("option")).attr("value", options.maxItems * 10).text(options.maxItems * 10 + " Results").appendTo(query_lim)
            
            if (options.filters)
            {
                var filtr_div = $(document.createElement("div")).addClass(options.classPrefix + "filters").appendTo(input)
                var filtr_sel = $(document.createElement("select")).appendTo(filtr_div)
                
                for (var x in options.filters)
                    if (options.defaultFilter && options.defaultFilter == x)
                        $(document.createElement("option")).attr("value", x).attr("selected", "selected").text(options.filters[x]).appendTo(filtr_sel)
                    else
                        $(document.createElement("option")).attr("value", x).text(options.filters[x]).appendTo(filtr_sel)
                
                $filter = filtr_sel
            }
            
            if (options.dateRange)
            {
                var range_div = $(document.createElement("div")).addClass(options.classPrefix + "date-range").appendTo(input)
                
                var date_options = {}
                if (options.dateRange.dateFormat) date_options["dateFormat"] = options.dateRange.dateFormat
                
                var label_start = $(document.createElement("label")).text("Start:").appendTo(range_div)
                var date_start  = $(document.createElement("input")).attr("name", "date_start").datepicker(date_options).appendTo(range_div)
                var label_end   = $(document.createElement("label")).html("&nbsp; &nbsp; End:").appendTo(range_div)
                var date_end    = $(document.createElement("input")).attr("name", "date_end"  ).datepicker(date_options).appendTo(range_div)
            }
            
            var clear_div = $(document.createElement("div")).css("clear", "both").appendTo(input)
            var rslts_div = $(document.createElement("div")).addClass(options.classPrefix + "results").appendTo(input)
            var rslts_tbl = $(document.createElement("table")).appendTo(rslts_div)
            var  more_btn = $(document.createElement("div")).addClass(options.classPrefix + "more").text("show more results").appendTo(rslts_div)
            var rslts_thd = $(document.createElement("thead"))
            var rslts_thr = $(document.createElement("tr")).appendTo(rslts_thd)
            var rslts_tbd = $(document.createElement("tbody"))
            
            if (options.selection)
            {
                selct_div.addClass(options.classPrefix + "selection-info")
                    .append($(document.createElement("span")).addClass("text"))
                    .append($(document.createElement("span")).addClass("link").text("clear").css({marginLeft: "8px"}).click(function(){ selected = []; updateSelection() }))
                    .appendTo(title_div)
                
                $(document.createElement("col")).css("width", "40px").appendTo(rslts_tbl)
                $(document.createElement("th")).addClass("select-all").append($(document.createElement("div")).addClass("checkbox select-all").click(function()
                {
                    if (rslts_thr.hasClass("selected-row"))
                    {
                        rslts_thr.removeClass("selected-row")
                        selected = []
                        $results.find("tr").removeClass("selected-row")
                    }
                    else
                    {
                        rslts_thr.addClass("selected-row")
                        $results.find("tr").each(function()
                        {
                            selected.push($(this).addClass("selected-row").attr("data-id"))
                        })
                    }
                    
                    updateSelection()
                })).appendTo(rslts_thr)
            }
            
            for (var i in options.columns)
            {
                var column = options.columns[i]
                
                var col = $(document.createElement("col")).attr("data-field", column.field).appendTo(rslts_tbl)
                if (column.width) col.css("width", column.width)
                
                var th  = $(document.createElement("th")).html(column.label).attr("data-field", column.field).appendTo(rslts_thr)
                if (column.sort) th.attr("data-sort", column.sort)
                
                if (typeof column.visible == "undefined" || column.visible)
                    options.columns[i].visible = true
                else
                {
                    options.columns[i].visible = false
                    th.hide()
                    col.hide()
                }
            }
            
            rslts_thd.appendTo(rslts_tbl)
            rslts_tbd.appendTo(rslts_tbl)
            
            $results = rslts_tbd
            $search  = findr_div
            $query   = query_btn
            $more    =  more_btn
            $select  = selct_div
            
            makeSearch()
            makeMenu()
            
            query_btn.click(function()
            {
                start_index = 1
                retrieveData()
            })
            
            more_btn.click(function()
            {
                start_index += +options.maxItems
                retrieveData()
            })
            
            $input.find("th[data-sort]").each(function()
            {
                $(this).addClass(options.classPrefix + "sortable").click(function()
                {
                    var sort = $(this).attr("data-sort")
                    
                    if (sort_field == sort)
                    {
                            sort_order = (sort_order == "asc") ? "dsc" : "asc"
                    }
                    else
                    {
                        sort_order = "asc"
                        sort_field = sort
                    }
                    
                    start_index = 1
                    retrieveData()
                })
            })
        }
        
        var selectAll = function()
        {
            options.queryParams["keys"] = 1
            retrieveData(function(xhr, status)
            {
                var nodes   = xhr.responseXML.childNodes.item(0).childNodes
                var rows    = []
                for (var x = 0; x < nodes.length; x++) if (nodes.item(x).nodeName == "items") rows = nodes.item(x).childNodes
                selected = []
                
                $.each(rows, function(i, node)
                {
                    selected.push(node.childNodes.item(0).textContent)
                })
                
                options.queryParams["keys"] = 0
                updateSelection()
            })
        }
        
        var updateSelection = function()
        {
            if (selected.length)
            {
                var select_all
                
                if (selected.length < total_items)
                {
                    select_all = $(document.createElement("span")).addClass("link").text("select all results").css({marginLeft: "8px"}).click(selectAll)
                }
                
                $select.find(".text").html(selected.length + " items selected").append(select_all)
                $select.fadeIn();
            }
            else
            {
                $input.find(".selected-row").removeClass("selected-row")
                $select.fadeOut()
            }
        }
        
        this.setOption = function(name, value)
        {
            if (typeof value == "undefined") return option[name]
            option[name] = value
        }
        
        this.updateRow = function(row_id, row_data)
        {
            var row = $input.find("tr[data-id=\"" + row_id + "\"]")
            
            for (var key in row_data)
            {
                row.find("td[data-field=\"" + key + "\"]").html(row_data[key])
            }
        }
        
        showColumn = function(field)
        {
            for (var i in options.columns)
            {
                if (options.columns[i].field == field) options.columns[i].visible = true;
            }
            
            $input.find("." + options.classPrefix + "menu li[data-field=" + field + "]").removeClass(options.classPrefix + "menu-inactive").addClass(options.classPrefix + "menu-active")
            $input.find("col[data-field=" + field + "]").show()
            $input.find("th[data-field=" + field + "]").show()
            $results.find("td[data-field=" + field + "]").show()
        }
        
        hideColumn = function(field)
        {
            for (var i in options.columns)
            {
                if (options.columns[i].field == field) options.columns[i].visible = false;
            }
            
            $input.find("." + options.classPrefix + "menu li[data-field=" + field + "]").addClass(options.classPrefix + "menu-inactive").removeClass(options.classPrefix + "menu-active")
            $input.find("col[data-field=" + field + "]").hide()
            $input.find("th[data-field=" + field + "]").hide()
            $results.find("td[data-field=" + field + "]").hide()
        }
        
        exportCSV = function()
        {
            var query = buildQuery()
            query["response_format"] = "csv"
            query["max_items"      ] = null
            window.open(Steam.base_uri + "models/" + options.model + "?" + $.param(query))
        }
        
        makeTable()
    }
     
})(jQuery);

