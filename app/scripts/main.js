'use strict';

var xmlViewer = (function() {
  var _appliedStyle = '',
  _newStyle = '';

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
  function _changeTheme() {
    var newStyle = 'ff',
    xmlTree = '#xmlTree';

    _applyTheme(xmlTree, _newStyle);
  }
  function _applyTheme(xmlTree, newStyle){
    var nodeValueElements = $(xmlTree).find('.treeview span.nodeValue'),
    tagBracketElements = $(xmlTree).find('.treeview span.tagBracket'),
    tagNameElements = $(xmlTree).find('.treeview span.tagName'),
    attrNameElements = $(xmlTree).find('.treeview span.attrName'),
    attrValueElements = $(xmlTree).find('.treeview span.attrValue'),
    attrEqualsElements = $(xmlTree).find('.treeview span.attrEquals'),
    attrQuotesElements = $(xmlTree).find('.treeview span.attrQuotes'),
    hitareaElements = $(xmlTree).find('.treeview div.hitarea'),
    elementsArray = [nodeValueElements, tagBracketElements, tagNameElements, attrNameElements, attrValueElements, attrEqualsElements, attrQuotesElements, hitareaElements];

    $(xmlTree).removeClass(_appliedStyle).addClass(newStyle);
    $.each(elementsArray, function (arrayIndex, array) {
      $.each(array, function(index, value){
        $(value).removeClass(_appliedStyle).addClass(newStyle);
      });
    });
  }

  var _self = {
    xmlContent  : {},
    nodeIndex : -1,
    hasInit : false,
    themes : {
      'ie': 'Internet Explorer',
      'chrome': 'Google Chrome',
      'ff': 'FireFox',
      'dark': 'Dark Theme',
      '': 'No Theme'
    },

    assignClickHandlers: function() {
      // TODO: Assign dynamically
      $('#xmlTree')
      .on("click", "span.nodeName", function () {
        _toggleNode.apply($(this).parent().get(0));
      })
      .on("click", "div.hitarea", function () {
        _toggleNode.apply($(this).parent().get(0));
      });

      $('#changeThemeBtn')
      .on("click", function(){
        _changeTheme();
      });

      $('#settingsBtn')
      .on("click", function(){
        $('#settings-current-theme').text(_self.themes[_appliedStyle]);
        $('#xmlTree').toggle();
        $('#settings-tab').toggle();
      });

      $('#settings-theme-btns>button.theme-btn')
      .on("click", function(){
        _newStyle = $(this).get(0).value;
        _applyTheme("#xmlTree-settings", _newStyle);
        $('#settings-current-theme').text(_self.themes[_appliedStyle]);
      });
    },
    renderHtmlTree: function (xmlTree) {
      var addListItem = function (curNode) {
        var parentNodeName,
        parentNodeIndex,
        nodeHtml = '';

        if (curNode.nodeType === 1) {
          nodeHtml = _createNodeHtml(curNode);
          if (curNode.parentNode.nodeName === "#document") {
            $(xmlTree).append("<ul class='children treeview'></ul>");
            $("ul.treeview").append(nodeHtml);
          } else {
            parentNodeName = curNode.parentNode.nodeName;
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
      _traverseDOM(_self.xmlContent, addListItem);
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
        _self.assignClickHandlers();
        _self.hasInit = true;
      }
    },
    draw: function (xmlTree) {
      $(xmlTree).empty();
      _self.renderHtmlTree(xmlTree);
      _applyTheme(xmlTree, _appliedStyle);
    }
  }
  return _self;
}());

$('#xmlModal').on('shown.bs.modal', function () {
  xmlViewer.loadXmlFromFile('../res/newXml.xml', '#xmlTree', function(){xmlViewer.init('#xmlTree');});
})
