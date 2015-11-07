'use strict';

var xmlViewer = (function(xmlViewer) {
  xmlViewer.xmlViewerViewModel = {
    showSettings: ko.observable(false),
    showXmlRenders: ko.observable(true),
    showCustomSettings: ko.observable(false),
    appliedStyle: ko.observable(''),
    previewStyle: ko.observable(''),

    customFontSizes: ko.observableArray(['10px', '12px', '14px', '16px', '18px']),
    customColours: ko.observableArray(['Red', 'Green', 'Black', 'Blue']),

    angleBracketText: 'Angle Bracket',
    angleBracketColour: ko.observable('Black'),
    angleBracketSize: ko.observable('14px'),
    nodeValueText: 'Node Value',
    nodeValueColour: ko.observable('Black'),
    nodeValueSize: ko.observable('14px'),
    nodeNameText: 'Node Name',
    nodeNameColour: ko.observable('Black'),
    nodeNameSize: ko.observable('14px'),
    attrNameText: 'Attribute Name',
    attrNameColour: ko.observable('Black'),
    attrNameSize: ko.observable('14px'),
    attrValueText: 'Attribute Value',
    attrValueColour: ko.observable('Black'),
    attrValueSize: ko.observable('14px'),
    attrEqualsText: 'Attribute Equals Symbol',
    attrEqualsColour: ko.observable('Black'),
    attrEqualsSize: ko.observable('14px'),
    attrQuotesText: 'Attribute Quotes',
    attrQuotesColour: ko.observable('Black'),
    attrQuotesSize: ko.observable('14px'),
    toggleIconText: 'Toggle Icon',
    toggleIconSize: ko.observable('10px'),
    toggleIconColour: ko.observable('Black')
  }

  var _appliedStyle = '',
  _previewStyle = '',
  _tempStyle = '';

  function _getXmlDOMFromString(xmlStr) {
    xmlStr = xmlStr.trim();
    if (window.ActiveXObject && window.GetObject) {
      // for Internet Explorer
      var dom = new ActiveXObject('Microsoft.XMLDOM');
      dom.loadXML(xmlStr);
      return dom;
    }
    if (window.DOMParser) { // for other browsers
      return new DOMParser().parseFromString(xmlStr, 'text/xml');
    }
    throw new Error('No XML parser available');
  }
  function _traverseDOM(node, fn) {
    fn(node); // execute passed function on current node
    node = node.firstChild;
    while (node) { // if child exists
      _traverseDOM(node, fn); // recursively call the passed function on it
      node = node.nextSibling; // set node to its next sibling
    }
  }
  function _getAttributes(node) {
    var attrHtml = "",
    attrEquals = "<span class='attrEquals'>=</span>",
    attrQuotes = '<span class="attrQuotes">"</span>';
    if (!node.attributes) {
      return attrHtml;
    }
    $.each(node.attributes, function (index, value) {
      attrHtml += "<span class='attrName'> "+value.nodeName + attrEquals+ '</span><span class="attrValue">'+ attrQuotes + value.nodeValue + attrQuotes + '</span> ';
    });
    return attrHtml;
  }
  function _getNodeValue(node) {
    var nodeValue = "";
    if (node.firstChild && node.firstChild.nodeType === 3) {
      if (node.firstChild.nodeValue.trim()) {
        nodeValue = "<span class='nodeValue'>"+node.firstChild.nodeValue+"</span>";
      }
    }
    return nodeValue;
  }
  function _getChildren(node) {
    var childrenHtml = '';
    if (node.firstElementChild) {
      childrenHtml = "<ul class='children'></ul>";
    }
    return childrenHtml;
  }
  function _createNodeHtml(node) {
    var attrHtml = _getAttributes(node),
    nodeValueHtml = _getNodeValue(node),
    childrenHtml = _getChildren(node),
    nodeHtml = "",
    firstTagOpen = "<span class='tagBracket'>&lt</span>",
    tagClose = "<span class='tagBracket'>&gt</span>",
    secondTagOpen = "<span class='tagBracket'>&lt/</span>",
    singleTagClose = "<span class='tagBracket'> /&gt</span>",
    tagText = "<span class='tagName'>"+node.nodeName+"</span>",
    openTag = firstTagOpen + tagText + attrHtml +tagClose,
    closeTag = secondTagOpen + tagText + tagClose,
    singleTag = firstTagOpen + tagText + attrHtml + singleTagClose;

    if (nodeValueHtml.length === 0 && childrenHtml.length === 0) {
      nodeHtml = "<li class='node " + node.nodeName + "' nodeIndex=" + (++_self.nodeIndex) + ">" + "<div class='hitarea'></div><span class='nodeName'>"+ singleTag + "</span></li>";
    } else {
        nodeHtml = "<li class='node " + node.nodeName + "' nodeIndex=" + (++_self.nodeIndex) + ">" + "<div class='hitarea'></div><span class='nodeName'>" + openTag +"</span>" + nodeValueHtml +childrenHtml+"<span class='closeTag'>"+ closeTag + "</span></li>";
    }

    return nodeHtml;
  }
  function _toggleNode() {
    var thisLi = $(this),
    liIcon = thisLi.find(">div");
    thisLi.find(">ul").toggle("normal");
    if (thisLi.hasClass("collapsible")) {
      if (liIcon.hasClass("glyphicon glyphicon-minus")) {
        liIcon.removeClass("glyphicon glyphicon-minus").addClass("glyphicon glyphicon-plus");
      } else {
        liIcon.removeClass("glyphicon glyphicon-plus").addClass("glyphicon glyphicon-minus");
      }
    }
  }
  function _applyTheme(xmlTree, newStyle, oldStyle){
    var nodeValueElements = $(xmlTree).find('.treeview span.nodeValue'),
    tagBracketElements = $(xmlTree).find('.treeview span.tagBracket'),
    tagNameElements = $(xmlTree).find('.treeview span.tagName'),
    attrNameElements = $(xmlTree).find('.treeview span.attrName'),
    attrValueElements = $(xmlTree).find('.treeview span.attrValue'),
    attrEqualsElements = $(xmlTree).find('.treeview span.attrEquals'),
    attrQuotesElements = $(xmlTree).find('.treeview span.attrQuotes'),
    hitareaElements = $(xmlTree).find('.treeview div.hitarea'),
    elementsArray = [nodeValueElements, tagBracketElements, tagNameElements, attrNameElements, attrValueElements, attrEqualsElements, attrQuotesElements, hitareaElements];

    $(xmlTree).removeClass(oldStyle).addClass(newStyle);
    $.each(elementsArray, function (arrayIndex, array) {
      $.each(array, function(index, value){
        $(value).removeClass(oldStyle).addClass(newStyle);
      });
    });
  }
  function _toggleSettingsView() {
    if (xmlViewer.xmlViewerViewModel.showSettings() === false) {
      xmlViewer.xmlViewerViewModel.showSettings(true).showXmlRenders(false);
    } else {
      xmlViewer.xmlViewerViewModel.showSettings(false).showXmlRenders(true);
    }
  }
  function _getCookies() {
    if (Cookies.get('theme')) {
      _appliedStyle = Cookies.get('theme');
      _previewStyle = Cookies.get('theme');
    }
  }
  function _eliminateDuplicates(arr) {
    var i,
    len = arr.length,
    out = [],
    obj = {};

    for (i = 0; i < len; i++) {
      if (!obj[arr[i]]) {
        obj[arr[i]] = {};
        out.push(arr[i]);
      }
    }
    return out;
  }
  function _updateCustomTheme(selector, attribute, value) {
    $('#xmlTree-settings').find('.treeview '+selector).css(attribute, value);
  }
  var _self = {
    xmlContent  : {},
    $container : '',
    nodeIndex : -1,
    hasInit : false,
    themes : {
      'ie': 'Internet Explorer',
      'chrome': 'Google Chrome',
      'ff': 'FireFox',
      'dark': 'Dark Theme',
      '': 'No Theme',
      'custom': 'Custom'
    },

    assignClickHandlers: function() {
      $(_self.$container)
      .on("click", "span.nodeName", function () {
        _toggleNode.apply($(this).parent().get(0));
      })
      .on("click", "div.hitarea", function () {
        _toggleNode.apply($(this).parent().get(0));
      });

      $('#settingsBtn')
      .on("click", function(){
        _applyTheme("#xmlTree-settings", _appliedStyle, _tempStyle);
        _tempStyle = _appliedStyle;
        xmlViewer.xmlViewerViewModel
        .appliedStyle(_self.themes[_appliedStyle])
        .previewStyle(_self.themes[_appliedStyle]);
        _toggleSettingsView();
      });

      $('#settingsBackBtn')
      .on("click", function () {
        _toggleSettingsView();
      })

      $('#settings-theme-btns>button.theme-btn')
      .on("click", function(){
        _previewStyle = $(this).get(0).value;
        _applyTheme("#xmlTree-settings", _previewStyle, _tempStyle);
        _tempStyle = _previewStyle;
        xmlViewer.xmlViewerViewModel.previewStyle(_self.themes[_previewStyle]);
        (_previewStyle === 'custom' ? xmlViewer.xmlViewerViewModel.showCustomSettings(true) : xmlViewer.xmlViewerViewModel.showCustomSettings(false));
      });

      $('#settingsSaveBtn')
      .on("click", function(){
        _applyTheme("#xmlTree", _tempStyle, _appliedStyle);
        _appliedStyle = _tempStyle;
        xmlViewer.xmlViewerViewModel.appliedStyle(_self.themes[_appliedStyle]);
        Cookies.set('theme', _appliedStyle);
      });
    },
    setUpSubscribers: function () {
      xmlViewer.xmlViewerViewModel.angleBracketColour.subscribe(function(newValue){
        _updateCustomTheme('span.tagBracket', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.angleBracketSize.subscribe(function(newValue) {
        _updateCustomTheme('span.tagBracket', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.nodeValueColour.subscribe(function(newValue) {
        _updateCustomTheme('span.nodeValue', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.nodeValueSize.subscribe(function(newValue){
        _updateCustomTheme('span.nodeValue', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.nodeNameColour.subscribe(function(newValue){
        _updateCustomTheme('span.tagName', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.nodeNameSize.subscribe(function(newValue){
        _updateCustomTheme('span.tagName', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrNameColour.subscribe(function(newValue){
        _updateCustomTheme('span.attrName', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrNameSize.subscribe(function(newValue){
        _updateCustomTheme('span.attrName', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrValueColour.subscribe(function(newValue) {
        _updateCustomTheme('span.attrValue', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrValueSize.subscribe(function(newValue){
        _updateCustomTheme('span.attrValue', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrEqualsColour.subscribe(function(newValue) {
        _updateCustomTheme('span.attrEquals', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrEqualsSize.subscribe(function(newValue){
        _updateCustomTheme('span.attrEquals', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrQuotesColour.subscribe(function(newValue) {
        _updateCustomTheme('span.attrQuotes', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.attrQuotesSize.subscribe(function(newValue){
        _updateCustomTheme('span.attrQuotes', "font-size", newValue);
      });
      xmlViewer.xmlViewerViewModel.toggleIconColour.subscribe(function(newValue) {
        _updateCustomTheme('div.hitarea', "color", newValue);
      });
      xmlViewer.xmlViewerViewModel.toggleIconSize.subscribe(function(newValue){
        _updateCustomTheme('div.hitarea', "font-size", newValue);
      });
    },
    resetView: function () {
      xmlViewer.xmlViewerViewModel.showSettings(false).showXmlRenders(true);
    },
    renderHtmlTree: function () {
      var configNode = function (curNode) {
        var parentNodeName,
        parentNodeIndex,
        nodeHtml = '';

        if (curNode.nodeType === 1) {
          nodeHtml = _createNodeHtml(curNode);
          parentNodeName = curNode.parentNode.nodeName;
          if (parentNodeName === "#document") {
            $(_self.$container).append("<ul class='children treeview'></ul>");
            $("ul.treeview").append(nodeHtml);
          } else {
            parentNodeIndex = parseInt($("li." + parentNodeName + ":last").attr('nodeIndex'), 10);
            $('[nodeIndex="' + parentNodeIndex +'"]')
            .children("ul.children")
            .append(nodeHtml);
          }
          if (curNode.firstElementChild) {
            $('[nodeIndex="' + _self.nodeIndex + '"]')
            .addClass("collapsible")
            .find(">div").addClass("glyphicon glyphicon-minus");
          }
        }
      }
      _traverseDOM(_self.xmlContent, configNode);
    },
    renderHtmlTable: function () {
      var rootNode = _self.xmlContent.documentElement,
          tempTableHeaders = [],
          tableHeaders = [];
      $('#xmlTable').append("<table class='table tableview'><thead></thead><tbody></tbody></table>");
      $.each(rootNode.children, function (index, node) {
        $.each(node.children, function (index, childNode) {
          tempTableHeaders.push(childNode.nodeName);
        });
      });
      tableHeaders =_eliminateDuplicates(tempTableHeaders);
      $('#xmlTable.table.thead')
    },
    loadXmlFromFile: function (xmlPath, containerSelector, callback) {
      _self.$container = $(containerSelector);
      $.ajax({
        type: "GET",
        async: true,
        url: xmlPath,
        dataType: "xml",
        error: function(){console.log("Error loading XML File")},
        success: function (xml) {
          console.log(xml.documentElement);
          _self.xmlContent = xml;
          callback();
        }
      });
    },
    loadXML: function (messageData, containerSelector) {
      var xmlDoc = document.getElementById('xmlMsgDetails').innerHTML;
      _self.xmlContent = _getXmlDOMFromString(messageData);
      _self.init();
    },
    init: function (containerSelector) {
      _self.draw(containerSelector);
      if (!_self.hasInit) {
        ko.applyBindings(xmlViewer.xmlViewerViewModel, document.getElementById('xmlModal'));
        _self.setUpSubscribers();
        _self.assignClickHandlers();
        _self.hasInit = true;
      }
    },
    draw: function (xmlTree) {
      $(xmlTree).empty();
      _getCookies();
      _self.renderHtmlTree(xmlTree);
      _applyTheme(xmlTree, _appliedStyle, '');
    }
  }
  return _self;
}(xmlViewer || {}));

$('#xmlModal').on('shown.bs.modal', function () {
  xmlViewer.loadXmlFromFile('../res/myXml.xml', '#xmlTree', function(){xmlViewer.init('#xmlTree');});
});

$('#xmlModal').on('hidden.bs.modal', function () {
  xmlViewer.resetView();
});
