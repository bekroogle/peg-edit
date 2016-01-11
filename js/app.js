var DOCUMENT_GROUP_WIDTH = window.innerWidth / 2;
var MENU_WIDTH = window.innerWidth;

$(document).ready(function () {
  $("#jqxMenu").jqxMenu({ width: MENU_WIDTH, height: 30});
  // the 'layout' JSON array defines the internal structure of the docking layout
  var layout = [{
      type: 'layoutGroup',
      orientation: 'horizontal',
      items: [{
          type: 'autoHideGroup',
          alignment: 'left',
          width: 80,
          unpinnedWidth: 200,
          items: [{
              type: 'layoutPanel',
              title: 'Toolbox',
              contentContainer: 'ToolboxPanel'
          }, {
              type: 'layoutPanel',
              title: 'Help',
              contentContainer: 'HelpPanel'
          }]
      }, {
          type: 'layoutGroup',
          orientation: 'vertical',
          width: DOCUMENT_GROUP_WIDTH,
          items: [{
              type: 'documentGroup',
              height: 400,
              minHeight: 200,
              items: [{
                  type: 'documentPanel',
                  title: 'Document 1',
                  contentContainer: 'Document1Panel'
              }, {
                  type: 'documentPanel',
                  title: 'Document 2',
                  contentContainer: 'Document2Panel'
              }]
          }, {
              type: 'tabbedGroup',
              height: 200,
              pinnedHeight: 30,
              items: [{
                  type: 'layoutPanel',
                  title: 'Error List',
                  contentContainer: 'ErrorListPanel'
              }]
          }]
      }, {
          type: 'tabbedGroup',
          width: 220,
          minWidth: 200,
          items: [{
              type: 'layoutPanel',
              title: 'Solution Explorer',
              contentContainer: 'SolutionExplorerPanel'
          }, {
              type: 'layoutPanel',
              title: 'Properties',
              contentContainer: 'PropertiesPanel'
          }]
      }]
  }, {
      type: 'floatGroup',
      width: 200,
      height: 200,
      position: {
          x: 150,
          y: 150
      },
      items: [{
          type: 'layoutPanel',
          title: 'Output',
          contentContainer: 'OutputPanel'
      }]
  }];
  $('#jqxDockingLayout').jqxDockingLayout({ width: window.innerWidth, height: window.innerHeight, layout: layout });
});
