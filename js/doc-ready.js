var parser;
var treeData;
var changeSize = function(target, delta) {
    target.setOption('fontSize', target.getOption('fontSize') + delta);
};

$('document').ready(function() {
    // Create the PEG editor
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    // No static JS analysis
    editor.setOption("useWorker", false);

    // Personal preferences:
    editor.setOption("tabSize", 2);
    editor.setOption('scrollPastEnd', 100);

    // Store retrieve text
    editor.setValue(localStorage["grammar"]);
    if (editor.getValue !== "") {
        $('#build_parser_btn').click();
    }

    editor.getSession().on("change", function() {
        localStorage.setItem("grammar", editor.getValue());
        $('#build_parser_btn').click();
    });

    // Resize editor
    $('#editor').css("height", window.innerHeight);
    editor.resize();

    // Create parse string editor
    output = ace.edit("output");
    output.setOption("useWorker", false);
    output.setValue(localStorage["source"]);
    output.getSession().on('change', function() {
        localStorage.setItem("source", output.getValue());
        $('#parse_btn').click();
    });

    $('#output').css('height', window.innerHeight / 2);
    output.resize();
    $('#build_parser_btn').click(function() {
        try {
            editor.getSession().clearAnnotations();
            parser = PEG.buildParser(editor.getValue());
            $('.alert-warning').remove();
        } catch (exn) {
            $('#bottom_right').html('<div class="alert alert-warning" role="alert">Grammar Error: ' + exn.message + '</div>');
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

    $('#parse_btn a').click(function(e) {
        e.preventDefault();


        // If a parser hasn't been built, build one:
        if (!parser) {
            $('#build_parser_btn').click();
        }

        // Now parse!
        try {
            result = parser.parse(output.getValue());
            treeData = result;
            doTree();

            // Log any parse errors in the console:                    
        } catch (e) {
            $('#bottom_right').html('<div class="alert alert-danger" role="alert">Parse Error: ' + e.message + '</div>');
            console.error(e);
        }
    });

    $('#zoom_in_btn').click(function() {
        changeSize(editor, 2);
        changeSize(output, 2);

    });
    $('#zoom_out_btn').click(function() {
        changeSize(editor, -2);
        changeSize(output, -2);
    });

    $(output).focus(function() {
        if (editor.getValue()) {
            $('#build_parser_btn').click();
        }
    });

    $('#peg_editor a').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
    });
    $('#peg_editor_settings a').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
        editor.execCommand('showSettingsMenu');
    });

    $('#tree-reset').click(function() {
        $('#parse_btn a').click();
    });
});