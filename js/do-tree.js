debugData = '';
function doTree() {
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

/*      $('.node:first-child').attr("width",
                                  $('.node:nth-child(2)').attr("width") + "1em");
*/
// Some conditionals here would be good to ensure it doesn't shrink beyond the standard size?
    
  };

  function zoom() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

};
