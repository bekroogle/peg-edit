// "use strict";

var parser,
    debugData,
    editor,
    logged_in = false,
    params = {},
    parserIsBuilt = false,
    pegedit_opts = {},
    source,
    symbol_table,
    traverse,
    treeData;
var globalAceTheme = "ace/theme/solarized_dark";

$('document').ready(function() {
    
    // If the user doesn't have any previous data in localStorage, 
    // Load the samples gist.

    extractParams();
    

    $(document).foundation({
        offcanvas : {
            open_method: 'move',
            close_on_click: false
        }
    });
    
    // Create the PEG editor
    // initPegEditor();

    buildParser();

    // Create parse string editor
    initSourceEditor();

    // If the user included a gist id in the URL, load the first file:
    applyParams();

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

    // Joyride housekeeping:
    $('.ace_print-margin').attr('id', 'firstStop');
    $('#source > .ace_scroller').attr('id', 'stopTwo');

    // If the user isn't in a hurry for a specific PEG, take her for a ride.
    if (!params.gistid) {
        startRide();
    }

    $(document).foundation('reflow');
    $('#forkme-img').css('height', window.innerHeight - $('#right-panel').height() - 60);
    // Save user preferences for the Ace editors:
    $(window).unload(function() {
        localStorage.setItem('peg-editor-settings', JSON.stringify(editor.getOptions()));
        localStorage.setItem('source-editor-settings', JSON.stringify(source.getOptions())); 
    });
});

var applyParams = function() {
    if (params.gistid) {
        openFileFromGist(params.gistid);
    }
};

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

// Get the latest c.run grammar definition from github
var buildParser = function() {
  var contents_uri = 'https://api.github.com/repos/bekroogle/cspotrun/contents/cspotrun.pegjs';
  $.get(contents_uri, function(repo) {
    parser = PEG.buildParser(atob(repo.content));
  });
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
    $('#download-prompt form').submit( function(e) {
        downloadParser($('#parser-variable-name').val() || $('#parser-variable-name').attr('placeholder'));
    });
    $('#download-prompt-btn').click(function(e) {
        e.preventDefault();
        $('#download-prompt form').submit();
        $('#download-prompt').foundation('reveal', 'close');
    });

    $('.gist-file-name').click( function(e) {
        alert(e);
        console.log(e);
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
    $('#gist-prompt').on('submit', function(e) {
        e.preventDefault();
        document.location = document.location.origin + document.location.pathname + '?gistid=' + $('#gist-id').val()
    })
    $('#open-gist-btn').click( function(e) {
        e.preventDefault();
        $('#gist-prompt').submit();
    });
    $('#open-samples-btn').click( function(e) {
        e.preventDefault();
        document.location = document.location.origin + document.location.pathname + '?gistid=705fdf83758491bbd5c5';
    }); 
    $('#parse-btn').click(function(e) {
        e.preventDefault();
        doParse(e);
    });
    $('#peg-editor-fullscreen-btn').click( function(e) {
        e.preventDefault();
        if (screenfull.enabled) {
            screenfull.request(document.getElementById("editor"));
        }
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
    $('#peg-editor-title').dblclick( function (e) {
        console.log("e.target: " + e.target);
        $('#rename-prompt').foundation('reveal', 'open');
    });
     $('#rename-prompt form').submit( function(e) {
        e.preventDefault();
        //renameFile() Implement this.
        $('#peg-editor-title .title-text').html($('#new-filename').val());
        console.log($('#new-filename').val());
        $('#rename-prompt').foundation('reveal', 'close');
     });
    $('#rename-submit-btn').click( function(e) {
        e.preventDefault();
        $('#rename-prompt form').submit();
    });
    $('#set-token-btn').click(  function(e) {
        e.preventDefault();
        $('#token-prompt form').submit();
    });
    $('#source-editor-fullscreen-btn').click( function(e) {
        e.preventDefault();
        if (screenfull.enabled) {
            screenfull.request(document.getElementById("source"));
        }
    });
    $('#source-editor-settings-btn').click(function(e) {
        e.preventDefault();
        source.execCommand('showSettingsMenu');
    });
    $('#source-reset').click(function(e) {
        e.preventDefault();
        setSize(source, 14);
    });
    $('#source-zoom-in-btn').click(function(e) {
        e.preventDefault();
        changeSize(source, 2);
    });
    $('#source-zoom-out-btn').click(function(e) {
        e.preventDefault();
        changeSize(source, -2);
    });
    $('#topbar-build-parser-btn').click(function(e) {
        e.preventDefault();
        buildParser();
    });
    $('#topbar-parse-btn').click(function(e) {
        e.preventDefault();
        doParse();
    });
    $('#token-prompt').on('submit', function(e) {
        e.preventDefault();
        setToken(true);
    });
    $('#tree-reset').click(function(e) {
        e.preventDefault();
        doParse();
    });
};

var doParse = function() {
    

    // If a parser hasn't been built, build one:
    if (!parser) {
        buildParser();
    }

    // Now parse!
    try {
        source.getSession().clearAnnotations();
        $('.parse-error').remove();
        // The resulting data structure:
        var result = parser.parse(source.getValue());

        treeData = result;
        var formatted_result = JSON.stringify(result, null, 2);
        // console.log(formatted_result);
        $('#parser-output').html('<pre>'+ formatted_result +'</pre>');
    } catch (exn) {
        $('#parser-output').html('<div data-alert class="alert-box alert parse-error">Parse Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
        if (!source.getSession().$annotations) {
            source.getSession().$annotations = [];
        }

        var myAnno = {
            "column": exn.column,
            "row": exn.line - 1,
            "type": "error",
            "raw": exn.message,
            "text": exn.message
        };

        source.getSession().$annotations.push(myAnno);
        source.getSession().setAnnotations(source.getSession().$annotations);

        console.log(exn);
    } try {
        
        switch(pegedit_opts.treenav) {
            case "collapse":     doCollapsibleTree();
                                 break;
            case "zoom":         doZoomableTree();
                                 break;
            case "cluster":      doClusterTree();
                                 break;
            default:             doZoomableTree();
        }
    } catch(exn) {
        $('#tree-view').html('<div data-alert class="alert-box alert parse-error">Parse Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
        console.log(exn);
    } try {
        if (traverse) {
            $('#console-view').html('<pre>'+ traverse(result) +'</pre>');    
        }
    } catch(exn) {
        $('#console-view').html('<div data-alert class="alert-box alert parse-error">Parse Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
        console.log(exn);
    } try {
        if (symbol_table) {
            $('#symbol-table-view').html('<pre>'+ JSON.stringify((symbol_table), null, 2) + '</pre>');    
        }
    } catch(exn) {
        $('#symbol-table-view').html('<div data-alert class="alert-box alert parse-error">Parse Error: ' + exn.message + '<a href="#" class="close">&times;</a></div>');
        console.log(exn);
    }

    $(document).foundation();
 
    if (params.active_tab) {
        switch (params.active_tab) {
            case "treeview": $('#tree-view-tab a').click(); break;
            case "consoleview": $('#console-view-tab a').click(); break;
            case "symboltableview": $('#symbol-table-view-tab a').click(); break;
            default: break;
        }
    }
    $(document).foundation('tab','reflow');
    // Log any parse errors in the console:
};

var downloadParser = function(varname) {
  
    // This is the snippet to be used for exporting the peg parser.
    var fileString = varname +" = "+ PEG.buildParser(editor.getValue(), {output: "source"});
    var newWindow = window.open();    
    var newDoc = newWindow.document;
    newDoc.write(fileString);
    newDoc.close();

 };

var extractParams = function() {
    var search = document.location.search.substr(1);
    var param_pairs = search.split('&');

    for (var i = 0; i < param_pairs.length; i++) {
        var param_pair = param_pairs[i].split('=');
        params[param_pair[0]] = param_pair[1];
    };
}

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
        changeSize(source, 2);
    });
    // Decrease font size for both editors:
    Mousetrap.bind('ctrl+shift+-', function(e) {
        e.preventDefault();
        changeSize(editor, -2);
        changeSize(source, -2);
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

    // Retrieve stored text/titlename if gist wasn't provided in url:
    if (!document.location.search) {
        editor.setValue(localStorage.getItem('grammar'), -1);
        $('#peg-editor-title').html(localStorage.getItem('filename'));
    }    

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
    source = ace.edit("source");

    // If the user has saved options:
    if (localStorage.getItem('source-editor-settings')) {
        source.setOptions(JSON.parse(localStorage.getItem('source-editor-settings')));
    // Otherwise, load the defaults:
    } else {
        // No static JS analysis
        source.setOption("useWorker", false);

        source.setTheme(globalAceTheme);
        // Personal preferences:
        source.setOption("tabSize", 2);
        source.setOption('scrollPastEnd', '40');
    }       
    
    source.setValue(localStorage.getItem('source'), -1);
    
    source.getSession().on('change', function() {
        localStorage.setItem("source", source.getValue());
        // doParse();
    });

    resizeElements();

    Mousetrap.bind('v 2', function() { $('#treediv').addClass('active'); });
    Mousetrap.bind('v 3', function() { $('#console-view').addClass('active'); });
    

    createButtonEvents();

    bindKeys(source);
    // Build parser when focus goes to source editor:   
    // $(source).focus(function() {
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
        $('#offcanvas-load-user-gists').toggleClass('gone');
        $('#user-account').toggleClass('gone');
        $('#save-changes-btn').toggleClass('gone');

        $(document).foundation('reflow');
    }
};

var openFileFromGist = function(gistid) {
    $.get('https://api.github.com/gists/' + gistid, function(gist_data) {
        var files = [],
            file,
            peg_filename,
            peg_content;
         debugData = gist_data;
        // Build an array of files in the gist            
        for (var f in gist_data.files) {
            files.push(gist_data.files[f]);
        }

        // If the url specifies a file for the peg which is in the gist, use it:
        if (params.peg_filename && gist_data.files[params.peg_filename]) {
            peg_filename = params.peg_filename;
            peg_content = gist_data.files[peg_filename].content;
        // Otherwise, get the first file:
        } else {
            peg_filename = files[0].filename;
            peg_content = files[0].content;
        }

        // Apply the filename to the editor title:
        $('#peg-editor-title .title-text').html(peg_filename + '&nbsp');
        
        // If there's more than one file:
        if (files.length > 1) {
            // Show the drop-down caret
            $('#peg-editor-title i').toggleClass('gone');
            // Build the drop-down file list:
            $('#peg-editor-file-list').append(getGistList(gist_data));
        }

        // Apply the file contents to the editor:
        editor.setValue(peg_content, -1);

        // Listen for clicks on the dropdown file-list to open those files:
        $('#peg-editor-file-list a').click( function(e) {
            $('#peg-editor-title .title-text').html(e.target.text);
            editor.setValue(gist_data.files[e.target.text].content, -1);
        });    

        // If the url specifies a file for the peg which is in the gist, use it:
        if (params.source_filename && gist_data.files[params.source_filename]) {
            // Set the title:
            $('#source-editor-title').text(params.source_filename);
            // Set the contents
            source.setValue(gist_data.files[params.source_filename].content, -1);
        };
    }).fail( function (data ) {
        alert("failed");
    });
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
            localStorage.setItem('gist_data', JSON.stringify(gist_data));

            return gist_data;
        }
    });
};

var openUserGists = function() {
    $.ajax({
        url: 'https://api.github.com/users/' +             // /users/
            localStorage.getItem('github-login') +         // :owner
            '/gists?access_token=' +                       // authorization type
            localStorage.getItem('github_access_token'),   // :token
        type: 'GET',
        dataType: 'jsonp',
    }).done( function(gist_data) {

        // To be used for creating a list of recent gist ids:
    
        


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
                    $('#peg-editor-title .title-text').html(filename);

                    // Save the filename in localStorage for reloads:
                    localStorage.setItem('filename', filename);
                    
                    // Load file content into editor:
                    editor.setValue(data.files[filename].content, -1);
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
    // $('#editor').height(window.innerHeight * 0.9);
    // $('#editor').height(window.innerHeight * 0.9);
    
    // editor.resize();
    $('.inner-wrap p').height(window.innerHeight * 0.9);
    $('#right-panel').height($('#left-panel').height());

    // Resize source editor:
    $('#source').height(window.innerHeight * 0.3);
    source.resize();
    $('#parser-output').height(window.innerHeight * 0.4);
    $('#treediv').height(window.innerHeight * 0.4);
    $('#console-view').height(window.innerHeight * 0.4);
    $('#symbol-table-view').height(window.innerHeight * 0.4);
    $('#symbol-table-view').css('overflow-y', 'scroll');
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
        $('#save-changes-btn').toggleClass('gone');

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
    // if (!localStorage.getItem('visited')) {
    //     localStorage.setItem('visited', 'true');    
    //     document.location = document.location.origin + document.location.pathname + '?705fdf83758491bbd5c5'        
    // } else if (!localStorage.getItem('joyridden')) {
    //     localStorage.setItem('joyridden', 'true');
    //     $(document).foundation('joyride', 'start');
    // }
    
};
