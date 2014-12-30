var parser;
var treeData;
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
        $('#build_parser_btn').click();
    }

    editor.getSession().on("change", function() {
        localStorage.setItem("grammar", editor.getValue());
        if ($('#auto-build').prop('checked')) {
            $('#build_parser_btn').click();
        }
    });


    // Create parse string editor
    output = ace.edit("output");
    output.setTheme(globalAceTheme);
    output.setOption("useWorker", false);
    output.setValue(localStorage["source"]);
    output.getSession().on('change', function() {
        localStorage.setItem("source", output.getValue());
        $('#parse_btn').click();
    });

    resizeElements();

    $('#build_parser_btn').click(function() {
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


    });

    $('#parse_btn').click(function(e) {
        e.preventDefault();


        // If a parser hasn't been built, build one:
        if (!parser) {
            $('#build_parser_btn').click();
        }

        // Now parse!
        try {
            result = parser.parse(output.getValue());
            treeData = result;
            $('.alert').remove();
            doTree();

            // Log any parse errors in the console:                    
        } catch (e) {
            $('#treediv').html('<div class="alert alert-danger" role="alert">Parse Error: ' + e.message + '</div>');
            console.error(e);
        }
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
            $('#build_parser_btn').click();
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
        $('#parse_btn').click();
    });
    $('#sample_one').click(function(e) {
        e.preventDefault();
        editor.setValue(simple_expr);
        $('#build_parser_btn').click();
        output.setValue("(3 + 5) * (2 + 2)");
        $('#parse_btn').click();
    });
    $('#left-assoc').click(function(e) {
        e.preventDefault();
        editor.setValue(commutative);
        $('#build_parser_btn').click();
        output.setValue("1-4/2-3");
        $('#parse_btn').click();
    });

    $('.ace_print-margin').attr('id', 'firstStop');
    $('#output > .ace_scroller').attr('id', 'stopTwo');
    $('#sample_one').click();
    startRide();

});
var startRide = function() {
    if (!localStorage.getItem("joyride")) {
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