'use strict';

var xmlViewer = (function() {
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
    attrEquals = "<span class='attrEquals ff'>=</span>",
    attrQuotes = '<span class="attrQuotes ff">"</span>';
    if (!node.attributes) {
      return attrHtml;
    }
    $.each(node.attributes, function (index, value) {
      attrHtml += "<span class='attrName ff'> "+value.nodeName + attrEquals+ '</span><span class="attrValue ff">'+ attrQuotes + value.nodeValue + attrQuotes + '</span> ';
    });
    return attrHtml;
  }
  function _getNodeValue(node) {
    var nodeValue = "";
    if (node.firstChild && node.firstChild.nodeType === 3) {
      if (node.firstChild.nodeValue.trim()) {
        nodeValue = node.firstChild.nodeValue;
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
    firstTagOpen = "<span class='tagBracket ff'>&lt</span>",
    tagClose = "<span class='tagBracket ff'>&gt</span>",
    secondTagOpen = "<span class='tagBracket ff'>&lt/</span>",
    singleTagClose = "<span class='tagBracket ff'> /&gt</span>",
    tagText = "<span class='tagName ff'>"+node.nodeName+"</span>",
    openTag = firstTagOpen + tagText + attrHtml +tagClose,
    closeTag = secondTagOpen + tagText + tagClose,
    singleTag = firstTagOpen + tagText + attrHtml + singleTagClose;

    if (nodeValueHtml.length === 0 && childrenHtml.length === 0) {
      nodeHtml = "<li class='node " + node.nodeName + "' nodeIndex=" + (++_self.nodeIndex) + ">" + "<div class='hitarea'></div><span class='nodeName'>"+ singleTag + "</span></li>";
    } else {
        nodeHtml = "<li class='node " + node.nodeName + "' nodeIndex=" + (++_self.nodeIndex) + ">" + "<div class='hitarea'></div><span class='nodeName'>" + openTag +"</span>" +"<span class='nodeValue ff'>" + nodeValueHtml + "</span>"+childrenHtml+"<span class='closeTag'>"+ closeTag + "</span></li>";
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

  var _self = {
    xmlContent  : {},
    nodeIndex : -1,

    assignClickHandlers: function() {
      $('#xmlTree')
      .on("click", "span.nodeName", function () {
        _toggleNode.apply($(this).parent().get(0));
      })
      .on("click", "div.hitarea", function () {
        _toggleNode.apply($(this).parent().get(0));
      });
    },
    renderHtmlTree: function () {
      var addListItem = function (curNode) {
        var parentNodeName,
        parentNodeIndex,
        nodeHtml = '';

        if (curNode.nodeType === 1) {
          nodeHtml = _createNodeHtml(curNode);
          if (curNode.parentNode.nodeName === "#document") {
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
    loadXML: function (messageData) {
      var xmlDoc = document.getElementById('xmlMsgDetails').innerHTML;
      _self.xmlContent = _getXmlDOMFromString(messageData);
      $('#xmlTree').append("<ul class='children treeview'></ul>");
      _self.renderHtmlTree();
      _self.assignClickHandlers();
    }
  }
  return _self;
}());

xmlViewer.loadXmlFromFile('../res/newXml.xml', '.xmlTree', function(){xmlViewer.renderHtmlTree(); xmlViewer.assignClickHandlers();});
