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

    $('#build_parser_btn').click(function(e) {
        e.preventDefault();
        buildParser();
    });

    $('#parse_btn').click(function(e) {
        e.preventDefault();
        doParse(e);
    });
    
    $('#help-button').click(function() {
        $(document).foundation('joyride', 'start');
    })
    $('#peg-zoom-in').click(function() {
        changeSize(editor, 2);

    });
    $('#peg-zoom-out').click(function() {
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
    $('#peg_editor_settings').click(function(e) {
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
        $('#treediv').html('<div class="alert alert-warning" role="alert">Grammar Error: ' + exn.message + '</div>');
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

var doParse = function(e) {
    // If a parser hasn't been built, build one:
    if (!parser) {
        buildParser();
    }

    // Now parse!
    try {
        result = parser.parse(output.getValue());
        treeData = result;
        
        $('.alert').remove();
        var formatted_result = JSON.stringify(result, null, 2);

        console.log(formatted_result);
        $('#treediv').html('<pre>'+ formatted_result +'</pre>');
        // console.dir(result);
        // Log any parse errors in the console:                    
    } catch (e) {
        $('#treediv').html('<div class="alert alert-danger" role="alert">Parse Error: ' + e.message + '</div>');
        console.error(e);
    }
};































commutative = "/* This Parsing Expression Grammar (PEG) parses arithmetic expressions and \n \
* handles left-associativity by refactoring left-associative operations into \n \
* commutative ones. \n \
* \n \
* e.g.: a - b is treated as a + (-b), while a / b is treated as a * (1/b). \n \
* In this manner, expressions like 1 - 2 - 3 can be parsed right-associative, \n \
* yet their parse trees still imply the correct answer. \n \
* \n \
* Author: Benjamin Kruger <bekroogle@gmail.com> \n \
*/ \n \
  \n \
start = add \n \
  \n \
add \n \
= l:subtract plus r:add { \n \
return { \n \
name: '+', \n \
children: [l, r] \n \
}; \n \
} \n \
/ subtract \n \
subtract \n \
= l:neg r:subtract { \n \
return{ \n \
name: '+', \n \
children: [l, r] \n \
}; \n \
} \n \
/ neg \n \
neg \n \
= minus n:mult { \n \
return { \n \
name: '*', \n \
children: [n, {name: '-1'}] \n \
}; \n \
} \n \
/ mult \n \
mult \n \
= l:div times r:mult { \n \
return { \n \
name: '*', \n \
children: [l, r] \n \
}; \n \
} \n \
/ div \n \
div \n \
= num:recip denom:div { \n \
return { \n \
name: '*', \n \
children: [num, denom] \n \
}; \n \
} \n \
/ recip \n \
recip \n \
= divide n:number { \n \
return { \n \
name: '/', \n \
children: [{name: '1'}, n] \n \
}; \n \
} \n \
/ parens \n \
parens \n \
= '(' a:add ')' { return a; } \n \
/ number \n \
  \n \
plus = oper:'+' ws { return oper; } \n \
minus= oper:'-' ws { return oper; } \n \
times = oper:'*' ws { return oper; } \n \
divide = oper:'/' ws { return oper; } \n \
number = n:([0-9]+) ws { return {name: parseInt(n, 10)}; } \n \
ws = [ \\t\\n]* { return ''; }"

simple_expr = "/* This Parsing Expression Grammar (PEG) parses simple arithmetic expressions \n \
 * comprising only plus, times, and parentheses (no left-associative \n \
 * operations, e.g. minus or divide). \n \
 * \n \
 * Author: Benjamin Kruger (bekroogle@gmail.com) \n \
 */ \n \
 \n \
start = add \n \
 \n \
add \n \
= l:mult plus r:add { \n \
    return { \n \
      name: '+',  \n \
      children: [l, r] \n \
    };  \n \
  } \n \
/ mult \n \
  \n \
mult \n \
= l:fact times r:mult {  \n \
    return { \n \
      name: '*',  \n \
      children: [l, r] \n \
    }; \n \
  } \n \
/ fact \n \
 \n \
 \n \
fact \n \
= open_paren a:add close_paren { return a; } \n \
/ number { return {name: parseInt(text())};} \n \
 \n \
number = d:(digit+) ws { return d; } \n \
 \n \
digit = [0-9] \n \
 \n \
plus = oper:'+' ws { return oper; } \n \
minus= oper:'-' ws { return oper; } \n \
times = oper:'*' ws { return oper; } \n \
divide = oper:'/' ws { return oper; } \n \
open_paren = oper:'(' ws { return oper; } \n \
close_paren = oper:')' ws { return oper; } \n \
 \n \
ws = [ \\t\\n]* "