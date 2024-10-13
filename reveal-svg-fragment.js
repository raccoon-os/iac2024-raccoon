/*
Copyright (C) 2014 Nicholas Bollweg
[... rest of the copyright notice ...]
*/

;Reveal.SvgFragment = (function(Reveal){
  "use strict";
  var window = this,
    document = window.document,
    proto = window.location.protocol,
    local = proto === "file:",
    d3 = window.d3,
    defaults = {
      d3: (local ? "http:" : proto) + "//cdn.jsdelivr.net/d3js/latest/d3.min.js",
      selector: "data-selector"
    };

  function api(){
    d3 = d3 || window.d3;
    var containers = d3.selectAll("[data-svg-fragment]"),
      slides = d3.select(".slides");

    containers.each(function(d, i, nodes) {
      const container = d3.select(this);
      const url = container.attr("data-svg-fragment");
      
      container.datum({
        container: container,
        url: url
      });
    });

    containers.append("iframe")
      .attr("src", d => d.url)
      .attr("scrolling", "no")
      .on("load", api.iframed);

    Reveal.addEventListener("fragmentshown", api.listen(containers, true));
    Reveal.addEventListener("fragmenthidden", api.listen(containers));

    return api;
  }

  api.listen = function(container, show){
    return function(event){
      var fragment = d3.select(event.fragment);
      container.filter(function(){
        return this === event.fragment.parentNode;
      }).each(function(item){
        api.toggle(fragment, item, show);
      });

      return api;
    };
  };

  api.toggle = function(fragment, item, show){
    if(!item.svg){ 
      console.log("SVG not available");
      return; 
    }
    var selector = fragment.attr(api.cfg("selector"));
    console.log("Toggling selector:", selector);
    if (selector) {
      var elements = item.svg.selectAll(selector);
      console.log("Selected elements:", elements.size());
      elements.transition()
        .style("opacity", function() { return show ? 1 : 0; });
    }
    return api;
  };

  api.iframed = function(item){
    item.iframe = d3.select(this);
    item.idoc = d3.select(this.contentDocument);
    item.svg = item.idoc.select("svg");
    
    if (!item.svg.node()) {
      console.error("SVG not found in iframe");
      return;
    }
    
    item.svg
      .style("position", "absolute")
      .style("top", "50%")
      .style("left", "50%")
      .style("transform", "translate(-50%, -50%)")
      .style("width", "100%")
      .style("height", "100%");

    item.dims = {
      width: item.svg.attr("width") || 100,
      height: item.svg.attr("height") || 100
    };
    item.iframe.attr(item.dims);
    item.svg.attr({
      width: "100%",
      height: "100%",
      viewBox: "0 0 "+ item.dims.width + " " + item.dims.height
    });

    return api.clean(item);
  };
  api.clean = function(item){
    var base;
    item.container.selectAll(".fragment").each(function(){
      var selector = d3.select(this).attr(api.cfg("selector"));
      if (selector) {
        item.svg.selectAll(selector)
          .style("opacity", 0);
      }
    });

    if(base = item.url.match(/(?:#)(.*)$/)){
      item.svg.selectAll(base[1])
        .style("opacity", 1);
    }

    item.container.selectAll(".fragment.visible").each(function() {
      var fragment = d3.select(this);
      api.toggle(fragment, item, true);
    });

    return api;
  };

  api.handleSlideChange = function(event) {
    var currentSlide = d3.select(event.currentSlide);
    var svgFragments = currentSlide.selectAll("[data-svg-fragment]");
    console.log(event, currentSlide);
  
    svgFragments.each(function(item) {
      console.log("item", item, item.svg)
      if (item && item.svg) {
        // Apply initial state
        console.log("api clean")
        api.clean(item);
      
        // Show elements for visible fragments
      }
    });
  };
  api.init = function(){
    var options = Reveal.getConfig().svgFragment || {};
    
    var initializeSlide = function() {
      api();
      Reveal.addEventListener('slidechanged', api.handleSlideChange);
      
      // Execute handleSlideChange for the initial slide
      api.handleSlideChange({ currentSlide: Reveal.getCurrentSlide() });
    };

    if(window.d3){
      initializeSlide();
    }else if(window.require){
      require([api.cfg("d3")], function(_d3){
        d3 = _d3;
        initializeSlide();
      });
    }else{
      api.load(api.cfg("d3"), initializeSlide);
    }
    return api;
  };
  api.cfg = function(opt){
    var cfg = Reveal.getConfig().svgFragment || {};

    return cfg.hasOwnProperty(opt) ? cfg[opt] :
      defaults.hasOwnProperty(opt) ? defaults[opt] :
      function(){ throw new Error("Unknown property: "+ opt); };
  };

  api.load = function(url, callback){
    var head = document.querySelector('head'),
      script = document.createElement('script');

    var finish = function(){
      if(typeof callback === 'function') {
        callback.call();
        callback = null;
      }
    };

    script.onreadystatechange = function() {
      if (this.readyState === 'loaded') {
        finish();
      }
    };
    script.type = 'text/javascript';
    script.src = url;
    script.onload = finish;

    head.appendChild(script);

    return api;
  };

  return api.init();
}).call(this, Reveal);