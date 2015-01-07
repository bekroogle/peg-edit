"use strict";

var parser,
    //debugData,
    treeData,
    editor,
    output,
    global_gist_data,
    scrollStack = [];
var logged_in = false;
var globalAceTheme = "ace/theme/solarized_dark";

$('document').ready(function() {
    $(document).foundation();
    
    // Create the PEG editor
    initPegEditor();

    // Create parse string editor
    initSourceEditor();


    $('.ace_print-margin').attr('id', 'firstStop');
    $('#output > .ace_scroller').attr('id', 'stopTwo');
     
    // If there's a GitHub access token in local storage, validate it:
    $('#access-token').attr('placeholder', localStorage.getItem('github_access_token'));

    if (localStorage.getItem('github_access_token')) {
        setToken();   
    } else {
        logout();
    }
    
    $('aside').click( function(e) {
        $(this).scrollTop(0);
    });

    startRide();
    $(document).foundation('reflow');
});

/** startRide
 *  If a visitor is a virgin, it loads the first sample and takes them on a
 *  joyride.
 *
 *  It then marks them down as ridden . . . no longer a virgin.
 */
var startRide = function() {
    if (!localStorage.getItem('joyride')) {
        $('#sample_one').click();
        $(document).foundation('joyride', 'start');
    }
    localStorage.setItem('joyride', 'true');
};

var resizeElements = function() {
    // Resize peg editor:
    $('#editor').height(window.innerHeight * 0.8);
    editor.resize();

    $('#right-panel').height($('#left-panel').height());

    // Resize source editor:
    $('#output').height(window.innerHeight * 0.3);
    output.resize();
    $('#treediv').height(window.innerHeight * 0.4);
    $('#tree-view').height(window.innerHeight * 0.4);
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
                JSON.parse(localStorage.getItem('gist_history')) || [];
            gist_history.push(gistid);
            localStorage.setItem('gist_history', JSON.stringify(gist_history));
            global_gist_data = gist_data;


            localStorage.setItem('gist_data', JSON.stringify(gist_data));

            // Clear list of files from previously loaded gist:
            $('.file-name').remove();

            // Build list of files in the current gist:
            for (var file in gist_data.data.files) {
                $('#files-in-gist').append('<li><a class="file-name" href="#">'+ file +'</a></li>');
                // console.log('<li><a href="#">'+ file +'</a></li>');
            }
            return gist_data;
        }
    });
};

var openUserGists = function() {
    $.ajax({
        url: 'https://api.github.com/users/' + 
            localStorage.getItem('github-login') +
            '/gists?access_token=' +
            localStorage.getItem('github_access_token'),
        // 'https://api.github.com/users/'+ 
        //     localStorage.getItem('github-login') +
        //     'gists/?access_token=' +
        //     localStorage.getItem('github_access_token') ,
        type: 'GET',
        dataType: 'jsonp',
    }).done( function(gist_data) {

        // To be used for creating a list of recent gist ids:
    
        global_gist_data = gist_data;


        localStorage.setItem('gist_data', JSON.stringify(gist_data));

        // Clear list of files from previously loaded gist:
        $('.file-name').remove();

        var gist_map = "["

        // Build list of files in the current gist:
        for (var gist in gist_data.data) {
            $('#files-in-gist').append(
                '<li class="has-submenu">'+
                    '<a class="file-name"'+ 'gist-id="'+ gist_data.data[gist].id +'" href="#">'+
                         gist_data.data[gist].description +
                    '</a>'+ // .file-name
                    '<ul class="left-submenu">'+
                        '<li class="back"><a href="#">Back</a></li>'+
                        '<li><label>'+ gist_data.data[gist].description +'</label></li>'+
                        getGistList(gist_data.data[gist]) + 
                    '</ul>'+    // .left-submenu
                '</li>' // .has-submenu
            );
        }     
    });
};

var getGistList = function(gist) {
    var rtn_str = ""
    for (var file in gist.files) {
        rtn_str = rtn_str +
        '<li>'+
            '<a href="#">'+ 
                gist.files[file].filename +
            '</a>'+
        '</li>'
    }
    return rtn_str;
};

var buildParser = function() {
    try {
        editor.getSession().clearAnnotations();
        parser = PEG.buildParser(editor.getValue());
        $('.alert-warning').remove();
    } catch (exn) {
        $('#parser-output').html('<div class="alert alert-warning" role="alert">Grammar Error: ' + exn.message + '</div>');
        // console.log(exn);
        //if (!editor.getSession().$annotations) {
        editor.getSession().$annotations = [];
        //}

        var myAnno = {
            "column": exn.column,
            "row": exn.line - 1,
            "type": "error",
            "raw": exn.message,
            "text": exn.message
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
   }
  }
 };

var doParse = function() {
    // If a parser hasn't been built, build one:
    if (!parser) {
        buildParser();
    }

    // Now parse!
    try {

        // The resulting data structure:
        var result = parser.parse(output.getValue());

        treeData = result;
        var formatted_result = JSON.stringify(result, null, 2);

        // console.log(formatted_result);
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

var changeSize = function(target, delta) {
    target.setOption('fontSize', target.getOption('fontSize') + delta);
};
var setSize = function(target, size) {
    target.setOption('fontSize', size);
};

var setToken = function(showAlert) {
    $.ajax({
        url: "https://api.github.com/user?access_token="+ ($('#access-token').val() || localStorage.getItem('github_access_token')),
        type: "GET"

    // On success:
    }).done( function(data) {
        // Update the state of the logged_in flag:
        logged_in = true;
        localStorage.setItem('github-login',data.login)
        $('#login-btn').toggleClass('gone');

        // If the token isn't in storage yet, put it there.
        localStorage["github_access_token"] = $('#access-token').val() || localStorage["github_access_token"];
        
        // Get rid of the login button:
        $('#user-account').toggleClass('gone');
        
        // Show the user's GitHub name and avatar:
        $('#github-id').html(localStorage.getItem('github-login') + ' ');
        $('#github-id').append('<img src="' + data.avatar_url + '" class="thumbnail"/>');

        $(document).foundation('reflow');
        
        // $('#avatar').height('44px');
        
        // Close the prompt:
        $('#token-prompt').foundation('reveal', 'close');
    
    // On failure:
    }).fail( function() {
        // Update the state of the loggin-in flag:
        logged_in = false;

        if (showAlert) {
            // Notify the user with an alert-box:
            createAlert('alert', 'Unable to login with that token.', '#status');
            $('#token-prompt').foundation('reveal','close');
        }
    });  
};

var createAlert = function(classes, text, parent) {
    parent = parent || 'body';
    var classlist = "alert-box " + classes;
    var alertMarkup = '<div data-alert class="'+ classlist + '">' + text + '<a href="#" class="close">&times;</a>';         
    $(parent).append(alertMarkup);
    $('.alert-box').css("margin-top", $('.alert-box').height() * -1);
    $(document).foundation('reflow');
};

var createButtonEvents = function() {
    
    $('#build-parser-btn').click(function(e) {
        e.preventDefault();
        buildParser();
    });
    
    $('#files-in-gist').click( function(e) {
        console.log($(e.target).attr('gist-id'));
        // var filename = e.target.firstChild.nodeValue;
        // $('#left-panel h1').html(filename);
        // console.log(filename);
        // var contents = global_gist_data.data.files[filename];
        // console.log(contents.content);
        // editor.setValue(contents.content);
        // try {
        //     buildParser();
        // } catch(ex) {
        //     console.log(ex);
        // }
        // $('#peg-editor-menu').foundation('offcanvas', 'toggle', 'move-right');
    });
    
    $('#help-btn').click(function(e) {
        e.preventDefault();
        $(document).foundation('joyride', 'start');
    });

    $('#load-user-gists').click( function(e) {
        e.preventDefault();
        openUserGists();
    });

    $('#login-btn').click( function(e) {
        e.preventDefault();
    });

    $('#logout-btn').click( function(e) {
        e.preventDefault();
        logout();
    });
    
    $('#open_gist_btn').click( function(e) {
        e.preventDefault();
        global_gist_data =  open_gist($('#gist-id').val());
        $('#gist-prompt').foundation('reveal', 'close');
    });
    
    $('#open-samples-btn').click( function(e) {
        e.preventDefault();
        global_gist_data = open_gist('cb3f08209da9b0f8da82');
    });

    $('#peg_editor a').click(function(e) {
        e.preventDefault();
    });
   
    $('#parse-btn').click(function(e) {
        e.preventDefault();
        doParse(e);
    });

    $('#peg-editor-settings-btn').click(function(e) {
        e.preventDefault();
        editor.execCommand('showSettingsMenu');
    });

    $('#peg-reset').click(function(e) {
        e.preventDefault();
        setSize(editor, 14);
    });

    $('#peg-zoom-in-btn').click(function(e) {
        e.preventDefault();
        changeSize(editor, 2);
    });

    $('#peg-zoom-out-btn').click(function(e) {
        e.preventDefault();
        changeSize(editor, -2);
    });

    $('#set-token-btn').click(  function(e) {
        e.preventDefault();
        setToken(true);
    });
    
    $('#source_editor_settings').click(function(e) {
        e.preventDefault();
        output.execCommand('showSettingsMenu');
    });

    $('#source-reset').click(function(e) {
        e.preventDefault();
        setSize(output, 14);
    });

    $('#source-zoom-in').click(function(e) {
        e.preventDefault();
        changeSize(output, 2);
    });
    
    $('#source-zoom-out').click(function(e) {
        e.preventDefault();
        changeSize(output, -2);
    });
    
    $('#tree-reset').click(function(e) {
        e.preventDefault();
        doParse();
    });
};

var initPegEditor =  function() {
    editor = ace.edit("editor");
    editor.setTheme(globalAceTheme);
    editor.getSession().setMode("ace/mode/javascript");

    // No static JS analysis
    editor.setOption("useWorker", false);

    // Personal preferences:
    editor.setOption("tabSize", 2);
    editor.setOption('scrollPastEnd', '40');

    // Store retrieve text
    editor.setValue(localStorage.getItem('grammar'));
    if (editor.getValue !== "") {
        buildParser();

    }

    editor.getSession().on("change", function() {
        localStorage.setItem("grammar", editor.getValue());
        if ($('#auto-build').prop('checked')) {
            buildParser();
        }
    });
};

var initSourceEditor = function() {
    output = ace.edit("output");
    output.setTheme(globalAceTheme);
    output.setOption("useWorker", false);
    output.setValue(localStorage.getItem('source'));
    output.getSession().on('change', function() {
        localStorage.setItem("source", output.getValue());
        doParse();
    });

    resizeElements();
    Mousetrap.bind('v 2', function() { $('#treediv').addClass('active'); });
    

    createButtonEvents();

   
    $(output).focus(function() {
        if (editor.getValue()) {
            buildParser();
        }
    });
};

var logout = function() {
    if (logged_in) {
        logged_in = false;
        localStorage.removeItem('github_access_token');
        $('#access-token').attr('placeholder', 'token');
        $(document).foundation('reveal', 'reflow');
        $('#login-btn').toggleClass('gone');
       
        $('#user-account').toggleClass('gone');
        

        $(document).foundation('reflow');
    }
};