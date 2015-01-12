debugData = '';

var doZoomableTree  = function() {
  $('#treediv').html('');
  // ************** Generate the tree diagram  *****************
  var margin = {
      top: 80,
      right: 120,
      bottom: 20,
      left: 120
    };

  var width = $('#treediv').width() - margin.right - margin.left,
      height = $('#treediv').height() - margin.top - margin.bottom;

  var i = 0;

  var tree = d3.layout.tree()
    .size([height, width]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) {
      return [d.x * 2, d.y];
    });

  var svg = d3.select("#treediv").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")  
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(d3.behavior.zoom().scaleExtent([0.5, 3]).on("zoom", zoom))
    .append("g");
  
  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width * 10)
    .attr("height", height * 10)
    .attr("transform", "translate("+ width * -5 +","+ height * -5 + ")");
  
  root = treeData;

  update(root);

  function update(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) {
        d.y = d.depth * 100;
      });

      // Declare the nodesâ€¦
      var node = svg.selectAll("g.node")
        .data(nodes, function(d) {
          return d.id || (d.id = ++i);
        });

      // Enter the nodes.
      var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + d.x * 2 + "," + d.y + ")";
        });

      // nodeEnter.append("circle")
      //   .attr("r", 10)
      //   .style("fill", "#fff");
      nodeEnter.append("ellipse")
        .attr("rx", 20)
        .attr("ry", 10)
        .style("fill", "#fff");

      nodeEnter.append("text")
        // .attr("y", function(d) {
        //   return d.children || d._children ? -18 : 18;
        // })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) {
          return d.name;
        })
        .style("fill-opacity", 1)

      // Declare the linksâ€¦
      var link = svg.selectAll("path.link")
        .data(links, function(d) {
          return d.target.id;
        });

      // Enter the links.
      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", diagonal);

      $('.node :first-child').each( function( index ) {
        var textWidth =  $(this).next().width() + 1;
        var shapeWidth = $(this).attr("rx");
        var newWidth = shapeWidth > textWidth ? shapeWidth : textWidth;
        $(this).attr("rx", newWidth); 
      }); 

  };

  function zoom() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

};

var doCollapsibleTree = function() {
  $('#treediv').html('');
  var margin = {top: 10, right: 20, bottom: 60, left: 20},
      width = $('#treediv').width() - margin.right - margin.left,
      height = $('.tabs-content').height() - margin.top - margin.bottom;
      
  var i = 0,
      duration = 750,
      root;

  var tree = d3.layout.tree()
      .size([width, height]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.x, d.y]; });

  var svg = d3.select("#treediv").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    flare = treeData;
    root = flare;
    root.x0 = width / 2;
    root.y0 = 0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    // root.children.forEach(collapse);
    update(root);
  

  

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 
      $('#treediv').height() / d3.max(nodes, function(x) { return x.depth;})
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 7)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
};

var doClusterTree = function() {
  $('#treediv').html('');
  var margin = {top:20, right:20, bottom:20, left:20};

  var width = $('#treediv').width() + margin.left + margin.right;
      height = $('#treediv').height() + margin.top + margin.bottom;

  var cluster = d3.layout.cluster()
    .size([width - margin.left - margin.right,
          height - margin.top - margin.bottom]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

  var svg = d3.select("#treediv").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate("+ margin.left +","+ margin.top +")");

  

  var update = function(root) {
    var nodes = cluster.nodes(root),
        links = cluster.links(nodes);

    var link = svg.selectAll(".link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = svg.selectAll(".node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dx", function(d) { return d.children ? -8 : 8; })
        .attr("dy", 3)
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.name; });
  };
  update(treeData);
}