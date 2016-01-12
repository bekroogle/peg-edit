var THEME_CHOICE = 'metrodark';

// the 'layout' JSON array defines the internal structure of the docking layout
var layout = [{
  type: 'layoutGroup',
  orientation: 'vertical',
  // height: window.innerHeight,
  width: window.innerWidth,
  items: [{
    type: 'documentGroup',
    height: window.innerHeight - 246,
    width: '100%',
    items: [{
      type: 'documentPanel',
      title: 'Grammar',
      contentContainer: 'peg-editor-container'
    }, {
      type: 'documentPanel',
      title: 'Source Code',
      contentContainer: 'SourceCode'
    }]
  }, {
    type: 'tabbedGroup',
    align: 'bottom',
    height: 200,
    pinnedHeight: 150,
    items: [{
      type: 'layoutPanel',
      title: 'Parser Output',
      container: 'ParserOutput'
    }, {
      type: 'layoutPanel',
      title: 'Parse Tree',
      container: 'ParseTree'
    }]
  }]
}];

$(window).on('resize', function(e) {
  $('#jqxMenu').width(window.innerWidth);
  // $('#jqxDockingLayout').jqxDockingLayout('refresh');
  doDockingLayoutFlow();
});

var doMenuFlow = function() {
  $("#jqxMenu").jqxMenu({
    theme: THEME_CHOICE,
    width: '100%',
    height: 30
  });
};

var doDockingLayoutFlow = function() {
  $('#jqxDockingLayout').jqxDockingLayout({
    theme: THEME_CHOICE,
    width: '100%',
    height: window.innerHeight - $('#jqxMenu').height(),
    layout: layout,
  });
};

doMenuFlow();
doDockingLayoutFlow();

var editor = ace.edit('editor');
$('#editor').height('100%');
$('#editor').width('100%');
