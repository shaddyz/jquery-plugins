/**
 * jQuery Infinite Carousel Plugin
 *
 * Creates a smooth-scrolling infinite carousel.
 *
 * @author Shaddy Zeineddine
 * @date 2010-12-22
 * @license GNU GPL version 3
 * @version 2011-04-04
 */

(function($){

    var methods = 
    {
        init : function(options)
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');
                
                if (!data)
                {
                    options = $.extend({
                        pattern: [[""]],
                        speed: 200,
                        data: {},
                        format: null,
                        filter: null,
                        mouse_scroll: true,
                        class_prefix: "carousel",
                        load: null,
                        reload: null,
                        autoplay: true,
                        direction: 1
                        }, options);
                    data = {
                        target : $this,
                        options : options,
                        carousel : new Carousel($this)
                        };
                    $(this).data('carousel', data);
                    data.carousel.load(data.options);
                }
                else
                {
                    options = $.extend(data.options, options);
                    data.carousel.reload(options);
                }
            });
        },
        
        destroy : function()
        {
            return this.each(function()
            {
                var $this = $(this)
                var data  = $this.data('carousel');
                data.carousel.remove();
                $this.removeData('carousel');
            })
        },
        
        play : function()
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.play();
                }
            })
        },
        
        pause : function()
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.pause();
                }
            })
        },
        
        reverse : function()
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.reverse();
                }
            })
        },
        
        enable : function(feature)
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.enable(feature);
                }
            })
        },
        
        disable : function(feature)
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.disable(feature);
                }
            })
        },
        
        debug : function()
        {
            return this.each(function()
            {
                var $this = $(this);
                var data  = $this.data('carousel');

                if (data)
                {
                    data.carousel.debug();
                }
            })
        }
    };

    $.fn.carousel = function(method)
    {
        if (methods[method])
        {
            return methods[method].apply( this,
                Array.prototype.slice.call( arguments, 1 ));
        }
        else if (typeof method === 'object' || ! method)
        {
            return methods.init.apply(this, arguments);
        }
        else
        {
            $.error('Method ' +  method + ' does not exist on jQuery.carousel');
        }    
    };

    var Carousel = function(target)
    {
        var viewport = target;
        var loaded;
        var cdata;
        var rblock;
        var cblock;
        var cscroll;
        var options;
        var $pane;
        var offset;
        var offset_total = 0;
        var block_width  = 1;
        var play;
        var loads = 0;
        var reverse_direction = false;
        var amount = 1;
        
        $(viewport).css("overflow", "hidden");
        
        // manages the carousel data
        var _cdata = function()
        {
            // keep track of the number of items in data
            this.items = options.data.length;
            
            // store the current index for each type
            this.index = [{},{}];
            
            this.init = function()
            {
                var index = [{},{}];
                
                for (var i in options.pattern)
                {
                    for (var j in options.pattern[i])
                    {
                        if (typeof index[0][options.pattern[i][j]] == "undefined")
                        {
                            index[0][options.pattern[i][j]] = 0;
                            index[1][options.pattern[i][j]] = this.items - 1;
                        }
                    }
                }
                
                this.index = index;
            }
            
            // retrieves the next item of the specified type
            this.next = function(type, direction)
            {
                var error = 0;
                var d_index = 0;
                
                // reverse direction
                if (direction < 0)
                {
                    d_index = 1;
                }
                // forward direction
                else
                {
                    direction = 1;
                }
                
                var item;
                var start = this.index[d_index][type];
                
                do
                {
                    // read the current item and increment the index
                    item = options.data[this.index[d_index][type]];
                    
                    // increment the index
                    this.index[d_index][type] += direction;
                    
                    // reached the end of the data, restart from beginning
                    if (this.index[d_index][type] == this.items)
                    {
                        this.index[d_index][type] = 0;
                    }
                    // reached the beginning of the data, restart from the end
                    else if (this.index[d_index][type] < 0)
                    {
                        this.index[d_index][type] = this.items - 1;
                    }
                    
                    // item found, return it
                    if (!type || item.type == type)
                    {
                        if (typeof options.filter != "function" ||
                            options.filter(item, {type: type, iteration: 1})
                            || error == 2)
                        {
                            return item;
                        }
                    }
                    else if (error == 1)
                    {
                        if (typeof options.filter != "function" ||
                            options.filter(item, {type: type, iteration: 2}))
                        {
                            return item;
                        }
                    }
                    
                    if (this.index[d_index][type] == start)
                    {
                        if (error < 2)
                        {
                            error++;
                            
                            // increment the index
                            this.index[d_index][type] += direction;
                            
                            // reached the end of the data,
                            // restart from beginning
                            if (this.index[d_index][type] == this.items)
                            {
                                this.index[d_index][type] = 0;
                            }
                            // reached the beginning of the data,
                            //restart from the end
                            else if (this.index[d_index][type] < 0)
                            {
                                this.index[d_index][type] = this.items - 1;
                            }
                        }
                        else
                        {
                            error++;
                        }
                    }
                }
                // if type can't be found, break, return null
                while (error < 3);
                
                return {error: true, code: "", type: type};
            };
        }
        
        var _rblock = function()
        {
            this.blocks = options.pattern.length;
            this.min = 0;
            this.max = 0;
            
            this.render = function(position, display)
            {
                var direction = (position >= 0) ? 1 : -1;
                var index  = ((position % this.blocks) + this.blocks) % this.blocks;
                var layout = options.pattern[index];
                var items = [];
                
                if (direction > 0)
                {
                    for (var i = 0; i < layout.length; i++)
                    {
                        items[i] = cdata.next(layout[i], direction);
                    }
                }
                else
                {
                    for (var i = layout.length - 1;i >= 0; i--)
                    {
                        items[i] = cdata.next(layout[i], direction);
                    }
                }
                
                if (position < rblock.min)
                {
                    rblock.min = position;
                }
                else if (position > rblock.max)
                {
                    rblock.max = position;
                }
                
                if (typeof display == "undefined")
                {
                    display = true;
                }
                
                $block = $(document.createElement("div"))
                    .addClass(options.class_prefix+"-block")
                    .attr("id", options.class_prefix+"-block-"+position);
                
                for (var x in items)
                {
                    $content = $(document.createElement("div"))
                        .addClass(options.class_prefix+"-item-content")
                        .html(items[x].code);
                    if (!display) {$content.hide()}
                    $item = $(document.createElement("div"))
                        .addClass(options.class_prefix+"-item")
                        .addClass(options.class_prefix+"-"+items[x].type+"-item")
                        .append($content);
                    
                    if (items[x].error) continue;
                    
                    if (typeof items[x]["size"] != "undefined")
                    {
                        $item.addClass(options.class_prefix+"-"+items[x].size+"-item")
                    }
                    
                    if (typeof options.format == "function")
                    {
                        options.format($content, items, x);
                    }
                    
                    $block.append($item);
                }
                
                return $block;
            }
        }
        
        // manages carousel blocks
        var _cblock = function()
        {
            this.pos_left   = 0;
            this.pos_right  = 0;
            this.position   = 0;
            this.visible    = 0;
            this.center     = 0;
            this.offset     = 0;
            
            this.load = function(load_id)
            {
                // if there are no items in data, there is nothing to do
                if (typeof options.data[0] == "undefined" ||
                    typeof options.pattern[0] == "undefined")
                {
                    return;
                }
                
                cblock.visible  = 0;
                cblock.position = 0;
                rblock.min = 0;
                rblock.max = 0;
                offset_total = 0;
                var p_width  = 0;
                var vp_width = $(viewport).width();
                var $placeholder = [];
                $pane = $(document.createElement("div"))
                    .css({height: $(viewport)
                    .attr("height"), position: "absolute", width: "9999px"})
                    .addClass(options.class_prefix+"-pane")
                    .appendTo(viewport);
                
                while (p_width < vp_width)
                {
                    $placeholder[cblock.visible] = $(document.createElement("div"))
                        .addClass(options.class_prefix+"-placeholder");
                    $pane.append($placeholder[cblock.visible]);
                    p_width += $placeholder[cblock.visible].outerWidth(true);
                    cblock.visible++;
                }
                
                if ((cblock.visible % 2) == 0)
                {
                    $placeholder[cblock.visible] = $(document.createElement("div"))
                        .addClass(options.class_prefix+"-placeholder");
                    $pane.append($placeholder[cblock.visible]);
                    p_width += $placeholder[cblock.visible].outerWidth(true);
                    cblock.visible++;
                }
                
                block_width = p_width / cblock.visible;
                offset = (vp_width - p_width) / 2;
                cblock.offset = offset;
                $pane.css("left", offset);
                cblock.center = (cblock.visible - 1) / 2;
                cblock.position++;
                
                rblock.render(0, 0).appendTo($placeholder[cblock.center]);
                
                for (var i = 1; i <= cblock.center; i++)
                {
                    rblock.render(-i, 0).appendTo($placeholder[cblock.center - i]);
                    rblock.render( i, 0).appendTo($placeholder[cblock.center + i]);
                }
                
                cblock.pos_left  = -i;
                cblock.pos_right =  i;
                
                for (var i = 0; i < cblock.visible; i++)
                {
                    cblock.preload(-1);
                    cblock.preload(1);
                }
                
                if (loads == load_id)
                {
                    cblock.show_blocks(load_id);
                }
            }
            
            this.show_blocks = function(load_id)
            {
                if (loads != load_id) {return}
                
                var $hidden = $pane.find("."+options.class_prefix+"-item-content:hidden");
                
                if (!$hidden.length)
                {
                    loaded = true;
                    
                    if (typeof options.load == "function")
                    {
                        options.load(load_id);
                    }
                    
                    if (options.autoplay)
                    {
                        cscroll.play();
                    }
                    
                    return;
                }
                
                $($hidden.get(Math.floor(Math.random()*($hidden.length - 0.01)))).fadeIn();
                window.setTimeout(function(){cblock.show_blocks(load_id)}, 100);
            }
            
            this.reload = function(load_id)
            {
                $pane.fadeOut(function(){
                    $pane.remove();
                    
                    if (typeof options.reload == "function")
                    {
                        options.reload();
                        cblock.load(load_id);
                    }
                    else if (typeof options.before_reload == "function")
                    {
                        options.before_reload(function(){cblock.load(load_id)});
                    }
                    else
                    {
                        cblock.load(load_id);
                    }
                });
            }
            
            this.preload = function(side, purge, callback)
            {
                if (side > 0)
                {
                    var $block = rblock.render(cblock.pos_right++);
                    $(document.createElement("div"))
                        .addClass(options.class_prefix+"-placeholder")
                        .append($block).appendTo($pane);
                    
                    if (purge)
                    {
                        offset += block_width;
                        $pane.css("left", offset).children().first().remove();
                    }
                }
                else
                {
                    var $block = rblock.render(cblock.pos_left--);
                    $(document.createElement("div"))
                        .addClass(options.class_prefix+"-placeholder")
                        .append($block).prependTo($pane);
                    offset -= block_width;
                    $pane.css("left", offset);
                    
                    if (purge)
                    {
                        $pane.children().last().remove();
                    }
                }
                
                if (typeof callback == "function")
                {
                    callback();
                }
            }
        }
        
        var _cscroll = function()
        {
            this.interval_id = 0;
            this.playing = false;
            this.scrolling = false;
            this.oplay = false;
            
            this.animate_real = function()
            {
                if (cscroll.interval_id) {clearInterval(cscroll.interval_id)}
                
                cscroll.interval_id = setInterval(function(){
                    if (!play) return;
                    
                    offset -= amount;
                    offset_total += amount;
                    $pane.css("left", offset);
                    
                    if (offset_total >= block_width)
                    {
                        offset_total -= block_width;
                        cblock.preload(1, true);
                    }
                    else if (offset_total <= -block_width)
                    {
                        offset_total += block_width;
                        cblock.preload(-1, true);
                    }
                }, options.speed);
            }
            
            this.animate = function()
            {
                if (play)
                {
                    if (reverse_direction)
                    {
                        reverse_direction = false;
                        options.direction *= -1;
                    }
                    
                    cscroll.playing = true;
                    amount = options.direction;
                    cscroll.animate_real();
                }
                else
                {
                    cscroll.playing = false;
                }
            }
            
            this.play = function()
            {
                if (loaded)
                {
                    play = true;
                    
                    if (!cscroll.playing)
                    {
                        cscroll.animate();
                    }
                }
            }
            
            this.pause = function()
            {
                if (cscroll.scrolling) 
                {
                    cscroll.oplay = false;
                    return;
                }
                play = false;
            }
            
            this.left = function()
            {
                if (!loaded || !options.mouse_scroll) return;
                if (cscroll.scrolling) {return;}
                cscroll.oplay = play;
                amount = -5;
                play = true;
                cscroll.scrolling = true;
                cscroll.animate_real();
            }
            
            this.right = function()
            {
                if (!loaded || !options.mouse_scroll) return;
                if (cscroll.scrolling) {return;}
                cscroll.oplay = play;
                amount = 5;
                play = true;
                cscroll.scrolling = true;
                cscroll.animate_real();
            }
            
            this.stop = function()
            {
                if (!loaded || !cscroll.scrolling) return;
                cscroll.scrolling = false;
                play = cscroll.oplay;
                amount = options.direction;
                cscroll.animate_real();
            }
        }
        
        this.load = function(opts)
        {
            loaded  = false;
            options = opts;
            cdata   = new _cdata();
            rblock  = new _rblock();
            cblock  = new _cblock();
            cscroll = new _cscroll();
            var vp_height = $(viewport).hover(cscroll.pause, function(){
                if(options.autoplay){cscroll.play()}}).outerHeight();
            var vp_width  = $(viewport).width();
            $(document.createElement("div")).css({
                zIndex: "99",
                position: "absolute",
                width: vp_width/10 + "px",
                height: vp_height,
                backgroundColor: "transparent",
                left: "0px"}).hover(cscroll.left, cscroll.stop)
                .appendTo(viewport);
            $(document.createElement("div")).css({
                zIndex: "99",
                position: "absolute",
                width: vp_width/10 + "px",
                height: vp_height,
                backgroundColor: "transparent",
                right: "0px"})
                .hover(cscroll.right, cscroll.stop).appendTo(viewport);
            
            cdata.init();
            cblock.load(0);
        }
        
        this.reload = function(opts)
        {
            loaded  = false;
            play    = false;
            options = opts;
            cdata.init();
            cblock.reload(++loads);
        }
        
        this.play = function()
        {
            options.autoplay = true;
            cscroll.play();
        };
        
        this.pause = function()
        {
            options.autoplay = false;
            cscroll.pause();
        };
        
        this.reverse = function()
        {
            reverse_direction = true;
        };
        
        this.enable = function(feature)
        {
            if (typeof options[feature] != "undefined")
                options[feature] = true;
        };
        
        this.disable = function(feature)
        {
            if (typeof options[feature] != "undefined")
                options[feature] = false;
        };
        
        this.debug = function()
        {
            alert("Offset: " + offset + ", Direction: " + options.direction);
        }
    }
    
})(jQuery);

