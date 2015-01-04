var parser,
    debugData,
    treeData,
    global_gist_data;
var globalAceTheme = "ace/theme/solarized_dark";

var changeSize = function(target, delta) {
    target.setOption('fontSize', target.getOption('fontSize') + delta);
};
var setSize = function(target, size) {
    target.setOption('fontSize', size);
};




$('document').ready(function() {
    console.log("me");
    $(document).foundation();    
    // Create the PEG editor
    editor = ace.edit("editor");
    editor.setTheme(globalAceTheme);
    editor.getSession().setMode("ace/mode/javascript");

    // No static JS analysis
    editor.setOption("useWorker", false);

    // Personal preferences:
    editor.setOption("tabSize", 2);
    editor.setOption('scrollPastEnd', '40');

    // Store retrieve text
    editor.setValue(localStorage["grammar"]);
    if (editor.getValue !== "") {
        buildParser();

    }

    editor.getSession().on("change", function() {
        localStorage.setItem("grammar", editor.getValue());
        if ($('#auto-build').prop('checked')) {
            buildParser();
        }
    });


    // Create parse string editor
    output = ace.edit("output");
    output.setTheme(globalAceTheme);
    output.setOption("useWorker", false);
    output.setValue(localStorage["source"]);
    output.getSession().on('change', function() {
        localStorage.setItem("source", output.getValue());
        doParse();
    });

    resizeElements();

    $('#build-parser-btn').click(function(e) {
        e.preventDefault();
        buildParser();
    });

    $('#parse-btn').click(function(e) {
        e.preventDefault();
        doParse(e);
    });
    
    $('#help-btn').click(function() {
        $(document).foundation('joyride', 'start');
    })
    $('#peg-zoom-in-btn').click(function() {
        changeSize(editor, 2);

    });
    $('#peg-zoom-out-btn').click(function() {
        changeSize(editor, -2);
    });
    
    $('#peg-reset').click(function() {
        setSize(editor, 14);
    });

    $('#source-zoom-in').click(function() {
        changeSize(output, 2);

    });
    $('#source-zoom-out').click(function() {
        changeSize(output, -2);
    });
    $('#source-reset').click(function() {
        setSize(output, 14);
    });
    $(output).focus(function() {
        if (editor.getValue()) {
            buildParser();
        }
    });

    $('#peg_editor a').click(function(e) {
        e.preventDefault();
       
    });
    $('#peg-editor-settings-btn').click(function(e) {
        e.preventDefault();
        
        editor.execCommand('showSettingsMenu');
    });

    $('#source_editor_settings').click(function(e) {
        e.preventDefault();
        
        output.execCommand('showSettingsMenu');
    });

    $('#tree-reset').click(function() {
        doParse();

    });
    $('#sample_one').click(function(e) {
        e.preventDefault();
        editor.setValue(simple_expr);
        
        buildParser();
        output.setValue("(3 + 5) * (2 + 2)");
        doParse();
    });
    $('#left-assoc').click(function(e) {
        e.preventDefault();
        editor.setValue(commutative);
        $('#build_parser_btn').click();
        output.setValue("1-4/2-3");
        doParse();
    });

    $('.ace_print-margin').attr('id', 'firstStop');
    $('#output > .ace_scroller').attr('id', 'stopTwo');
    $('#open_gist_btn').click( function(e) {
        e.preventDefault();
        global_gist_data =  open_gist($('#gist-id').val());
        $('#gist-prompt').foundation('reveal', 'close');
    });
    

    startRide();

});

/** startRide
 *  If a visitor is a virgin, it loads the first sample and takes them on a 
 *  joyride.
 *
 *  It then marks them down as ridden . . . no longer a virgin.
 */
var startRide = function() {
    if (!localStorage.getItem("joyride")) {
        $('#sample_one').click();
        $(document).foundation('joyride', 'start');
    }
    localStorage.setItem("joyride", "true");
};

var resizeElements = function() {
    // Resize editor
    $('#editor').height(window.innerHeight * .8)
    editor.resize();

    $('#right-panel').height($('#left-panel').height());
    
    $('#output').height(window.innerHeight * .3);
    output.resize();
    $('#treediv').height(window.innerHeight * .4);
    $('#tree-view').height(window.innerHeight * .4);
};

/** open_gist(gistid)
 *  loads a project from a gist
 *  @param gistid The id of the gist (the last segment of the url)
 */
var open_gist = function(gistid) {
    $.ajax({
        url: 'https://api.github.com/gists/' + gistid,
        type: 'GET',
        dataType: 'jsonp',
        success: function(gist_data) {
            
            // To be used for creating a list of recent gist ids:
            var gist_history = 
                JSON.parse(localStorage.getItem("gist_history")) || [];
            gist_history.push(gistid);
            localStorage.setItem("gist_history", JSON.stringify(gist_history));
            global_gist_data = gist_data;


            localStorage.setItem("gist_data", JSON.stringify(gist_data));
            
            // Clear list of files from previously loaded gist:
            $('.file-name').remove();
            
            // Build list of files in the current gist: 
            for (var file in gist_data.data["files"]) {
                $('#files-in-gist').append('<li><a class="file-name" href="#">'+ file +'</a></li>');
                // console.log('<li><a href="#">'+ file +'</a></li>');
            }
            return gist_data;
        }
    });
};
// Handle clicks on files in list:
$('#files-in-gist').click( function(e) {
    var filename = e.target.firstChild.nodeValue;
    $('#left-panel h1').html(filename);
    console.log(filename);
    var contents = global_gist_data.data["files"][filename];
    console.log(contents.content);
    editor.setValue(contents.content);
    try {
        buildParser();
    } catch(ex) {
        console.log(ex);
    }
    // $('#peg-editor-menu').foundation('offcanvas', 'toggle', 'move-right');
});


var buildParser = function() {
    try {
        editor.getSession().clearAnnotations();
        parser = PEG.buildParser(editor.getValue());
        $('.alert-warning').remove();
    } catch (exn) {
        $('#parser-output').html('<div class="alert alert-warning" role="alert">Grammar Error: ' + exn.message + '</div>');
        console.log(exn);
        //if (!editor.getSession().$annotations) {
        editor.getSession().$annotations = [];
        //}

        var myAnno = {
            "column": exn['column'],
            "row": exn['line'] - 1,
            "type": "error",
            "raw": exn['message'],
            "text": exn['message']
        };

        editor.getSession().$annotations.push(myAnno);
        editor.getSession().setAnnotations(editor.getSession().$annotations);
    } // catch(exn)      
};
var traverse = function(ast) {
  if (ast.token === "number") {
    return ast.name;
  }
  if (ast.token === "oper") {
   switch (ast.name) {
    case "+": return traverse(ast.children[0]) + traverse(ast.children[1]);
    case "*": return traverse(ast.children[0]) * traverse(ast.children[1]);
    case "/": return traverse(ast.children[0]) / traverse(ast.children[1]);
    case "^": return power(traverse(ast.children[0]), traverse(ast.children[1]));
   }
  }
 };
var doParse = function(e) {
    // If a parser hasn't been built, build one:
    if (!parser) {
        buildParser();
    }

    // Now parse!
    try {

        // The resulting data structure:
        result = parser.parse(output.getValue());
        
        treeData = result;
        var formatted_result = JSON.stringify(result, null, 2);

        console.log(formatted_result);
        $('#parser-output').html('<pre>'+ formatted_result +'</pre>');

        doTree();
        
        $('#console-view').html('<pre>'+traverse(result)+'</pre>');
        
        $(document).foundation();
        $(document).foundation('tab','reflow');
    // Log any parse errors in the console:                    
    } catch (e) {
        $('parser-output').html('<div class="alert alert-danger" role="alert">Parse Error: ' + e.message + '</div>');
        console.error(e);
    }
};