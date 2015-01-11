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
    $(document).foundation({
        offcanvas : {
            open_method: 'move',
            close_on_click: true
        }
    });
    
    // Create the PEG editor
    initPegEditor();

    // Create parse string editor
    initSourceEditor();

    // Apply #'s to be used with Joyride
    $('.ace_print-margin').attr('id', 'firstStop');
    $('#output > .ace_scroller').attr('id', 'stopTwo');
     
    // If there's a GitHub access token in local storage, set it as a placeholder in the 
    // login modal...
    $('#access-token').attr('placeholder', localStorage.getItem('github_access_token'));

    // ...and go ahead and log in with it. (Does that make the above step redundant?)
    if (localStorage.getItem('github_access_token')) {
        setToken();   
    
    // I'm not sure why this is here . . . maybe it's needed to toggle visibility of certain
    // elements:
    } else {
        logout();
    }
    
    // Make sure that submenus appear from the very top, even if triggered by items that were
    // deep in the previous menu:
    $('aside').click( function(e) {
        $(this).scrollTop(0);
    });

    // Set up non-ace keybindings:
    initMouseTrap();

    // Run joyride (for virgins):
    startRide();

    $(document).foundation('reflow');
    
    // Save user preferences for the Ace editors:
    $(window).unload(function() {
        localStorage.setItem('peg-editor-settings', JSON.stringify(editor.getOptions()));
        localStorage.setItem('source-editor-settings', JSON.stringify(output.getOptions())); 
    });
});

var bindKeys = function(target) {
    target.commands.addCommands([{
            name: 'buildParser',
            bindKey: {win: 'Ctrl-B',  mac: 'Command-B'},
            exec: function(editor) {
                buildParser();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'doParse',
            bindKey: {win: 'Ctrl-P',  mac: 'Command-P'},
            exec: function(editor) {
                doParse();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'zoomIn',
            bindKey: {win: 'Ctrl-Shift-=',  mac: 'Command-Shift-+'},
            exec: function(e) {
                changeSize(target, 2);
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'zoomOut',
            bindKey: {win: 'Ctrl-Shift--',  mac: 'Command-Shift--'},
            exec: function(e) {
                changeSize(target, -2);
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'tabOne',
            bindKey: {win: 'Ctrl-Shift-1',  mac: 'Command-Shift-1'},
            exec: function(e) {
                $('#parser-output-tab a').click();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'tabTwo',
            bindKey: {win: 'Ctrl-Shift-2',  mac: 'Command-Shift-2'},
            exec: function(e) {
                $('#tree-view-tab a').click();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'tabThree',
            bindKey: {win: 'Ctrl-Shift-3',  mac: 'Command-Shift-3'},
            exec: function(e) {
                $('#console-view-tab a').click();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        },{
            name: 'tabfour',
            bindKey: {win: 'Ctrl-Shift-4',  mac: 'Command-Shift-4'},
            exec: function(e) {
                $('#symbol-table-view-tab a').click();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        }
        ]);
};

var changeSize = function(target, delta) {
    target.setOption('fontSize', target.getOption('fontSize') + delta);
};

var commitChanges = function() {
    var current_gist = JSON.parse(localStorage.getItem('current-gist'));
    var mygist = { "files": {}}
    mygist.files[$('#peg-editor-title').text()] = {"content": editor.getValue()};
    var data_string = JSON.stringify(mygist);
    $.ajax({
        type: "PATCH",
        url: "https://api.github.com/gists/" + 
            JSON.parse(localStorage.getItem('current-gist')).id + 
            "?access_token=" +
            localStorage.getItem('github_access_token'),
        data: data_string
    }).done( function( data ) {
        console.dir(data);
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

    $('#save-changes-btn a').click(function(e) {
        e.preventDefault();
        commitChanges();
    });

    $('#set-token-btn').click(  function(e) {
        e.preventDefault();
        setToken(true);
    });
    
    $('#source-editor-settings-btn').click(function(e) {
        e.preventDefault();
        output.execCommand('showSettingsMenu');
    });

    $('#source-reset').click(function(e) {
        e.preventDefault();
        setSize(output, 14);
    });

    $('#source-zoom-in-btn').click(function(e) {
        e.preventDefault();
        changeSize(output, 2);
    });
    
    $('#source-zoom-out-btn').click(function(e) {
        e.preventDefault();
        changeSize(output, -2);
    });
    
    $('#tree-reset').click(function(e) {
        e.preventDefault();
        doParse();
    });
};

var buildParser = function() {
    try {
        editor.getSession().clearAnnotations();
        parser = PEG.buildParser(editor.getValue());
        $('.grammar-error').remove();
        console.log("Parser built!")
    } catch (exn) {
        console.log(exn);
        $('.tabs-content div').html('<div data-alert class="alert-box alert grammar-error">Grammar Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
  
        if (!editor.getSession().$annotations) {
        editor.getSession().$annotations = [];
        }

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

        $('.parse-error').remove();

        if (traverse) {
            $('#console-view').html('<pre>'+ traverse(result) +'</pre>');
        } else {
            $('#console-view').html("Must have a global function: traverse(tree)!");
        }

        if (symbol_table || symbolTable) {
            $('#symbol-table-view').html('<pre>'+
                JSON.stringify((symbol_table || symbolTable), null, 2) +
                '</pre>');
        }
        $(document).foundation();
        $(document).foundation('tab','reflow');
    // Log any parse errors in the console:
    } catch (exn) {
        $('.tabs-content div').html('<div data-alert class="alert-box alert parse-error">Parse Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
        console.error(exn);
    }
};

var getGistList = function(gist) {
    var rtn_str = ""
    for (var file in gist.files) {
        rtn_str = rtn_str +
        '<li>'+
            '<a class="gist-file-name" gistid="' + gist.id + '" href="#">'+ 
                gist.files[file].filename +
            '</a>'+
        '</li>'
    }
    return rtn_str;
};

var initMouseTrap = function() {
    
    // ACTIONS:
    // Build parser
    Mousetrap.bind('ctrl+b', function() { buildParser(); });  
    // Do parse
    Mousetrap.bind('ctrl+p', function(e) {
        e.preventDefault();
        doParse(); 
    });

    // SETTINGS:
    // Increase font size for both editors:
    Mousetrap.bind('ctrl+shift+=', function(e) {
        e.preventDefault();
        changeSize(editor, 2);
        changeSize(output, 2);
    });
    // Decrease font size for both editors:
    Mousetrap.bind('ctrl+shift+-', function(e) {
        e.preventDefault();
        changeSize(editor, -2);
        changeSize(output, -2);
    });

    // NAVIGATION:
    // Tab #1
    Mousetrap.bind('ctrl+shift+1', function(e) {
        e.preventDefault();
        $('#parser-output-tab a').click();
    });
    // Tab #2
    Mousetrap.bind('ctrl+shift+2', function(e) {
        e.preventDefault();
        $('#tree-view-tab a').click();
    });
    // Tab #3
    Mousetrap.bind('ctrl+shift+3', function(e) {
        e.preventDefault();
        $('#console-view-tab a').click();
    });
    // Tab #4
    Mousetrap.bind('ctrl+shift+4', function(e) {
        e.preventDefault();
        $('#symbol-table-view-tab a').click();
    });
};

var initPegEditor =  function() {
    editor = ace.edit("editor");

    editor.setTheme(globalAceTheme);
    editor.getSession().setMode("ace/mode/javascript");

    // If the user has saved options:
    if (localStorage.getItem('peg-editor-settings')) {
        editor.setOptions(JSON.parse(localStorage.getItem('peg-editor-settings')));
    // Otherwise, load the defaults:
    } else {
        // No static JS analysis
        editor.setOption("useWorker", false);

        // Personal preferences:
        editor.setOption("tabSize", 2);
        editor.setOption('scrollPastEnd', '40');
    }        

    // Retrieve stored text:
    editor.setValue(localStorage.getItem('grammar'));
    
    // Retrieve stored filename:
    $('#peg-editor-title').html(localStorage.getItem('filename'));

    if (editor.getValue !== "") {
        buildParser();
    }

    // On changes, save the new text to localStorage:
    editor.getSession().on("change", function() {
        localStorage.setItem("grammar", editor.getValue());
        if ($('#auto-build').prop('checked')) {
            buildParser();
        }
    });

    // Key bindings:
    bindKeys(editor);
};

var initSourceEditor = function() {
    output = ace.edit("output");

    // If the user has saved options:
    if (localStorage.getItem('source-editor-settings')) {
        output.setOptions(JSON.parse(localStorage.getItem('source-editor-settings')));
    // Otherwise, load the defaults:
    } else {
        // No static JS analysis
        output.setOption("useWorker", false);

        output.setTheme(globalAceTheme);
        // Personal preferences:
        editor.setOption("tabSize", 2);
        editor.setOption('scrollPastEnd', '40');
    }       
    
    output.setValue(localStorage.getItem('source'));
    
    output.getSession().on('change', function() {
        localStorage.setItem("source", output.getValue());
        doParse();
    });

    resizeElements();

    Mousetrap.bind('v 2', function() { $('#treediv').addClass('active'); });
    Mousetrap.bind('v 3', function() { $('#console-view').addClass('active'); });
    

    createButtonEvents();

    bindKeys(output);
    // Build parser when focus goes to source editor:   
    // $(output).focus(function() {
    //     if (editor.getValue()) {
    //         buildParser();
    //     }
    // });
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
            $('#gist-list').append(
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
        
        $('a.gist-file-name').click( function(e) {
            e.preventDefault();
            console.log('clicked');
            var filename = $(this).html();
            $.get('https://api.github.com/gists/'+ $(this).attr('gistid'))
                .done( function (data) {
                    localStorage.setItem('current-gist', JSON.stringify(data));
                    console.dir(data);
                    localStorage.setItem('current-file', JSON.stringify({
                            "gist-id": data.id,
                            "file-name": data.files[filename].filename
                            }));
                    $('#peg-editor-title').html(filename);

                    // Save the filename in localStorage for reloads:
                    localStorage.setItem('filename', filename);
                    
                    // Load file content into editor:
                    editor.setValue(data.files[filename].content);
                    editor.scrollToLine(0);
                    
                    // Build the parser:
                    buildParser();
                });
        });
        $(document).foundation('offcanvas', 'reflow');
    });
};

var resizeElements = function() {
    // Resize peg editor:
    $('#editor').height(window.innerHeight * 0.8);
    $('#editor').height(window.innerHeight * 0.8);
    
    editor.resize();

    $('#right-panel').height($('#left-panel').height());

    // Resize source editor:
    $('#output').height(window.innerHeight * 0.3);
    output.resize();
    $('#parser-output').height(window.innerHeight * 0.4);
    $('#treediv').height(window.innerHeight * 0.4);
    $('#console-view').height(window.innerHeight * 0.4);
    $('#parser-output').css('overflow-y', 'scroll');
    // $('#bottom-right').height(window.innerHeight * 0.4);
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
      
        // Save the user's github login id:
        localStorage.setItem('github-login',data.login)
      
        // Hide login stuff, reveal user stuff:
        $('#login-btn').toggleClass('gone');
        $('#offcanvas-load-user-gists').toggleClass('gone')
        $('#user-account').toggleClass('gone');

        // Insert user login into offcanvas menu:
        $('#offcanvas-load-user-gists a').append(localStorage.getItem('github-login')+"'s Gists");
        $('#users-gists-label').append(localStorage.getItem('github-login')+"'s Gists");
        // If the token isn't in storage yet, put it there.
        localStorage["github_access_token"] = $('#access-token').val() || localStorage["github_access_token"];

        // Show the user's GitHub name and avatar:
        $('#github-id').html(localStorage.getItem('github-login') + ' ');
        $('#github-id').append('<img src="' + data.avatar_url + '" class="thumbnail"/>');

        // Now load their gists:
        openUserGists();
        
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

/** startRide
 *  If a visitor is a virgin, it loads the first sample and takes them on a
 *  joyride.
 *
 *  It then marks them down as ridden . . . no longer a virgin.
 */
var startRide = function() {
   if (!localStorage.getItem('joyride')) {
        $(document).foundation('joyride', 'start');
    }
    localStorage.setItem('joyride', 'true');
};
