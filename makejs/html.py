#!/usr/bin/python

import os
import os.path
import hashlib
import xml.dom.minidom
import plistlib
import shutil
import json
import mimetypes
import StringIO
import tempfile
from HTMLParser import HTMLParser
from .builder import Builder
from .javascript import JSCompilation, JSFeature


class HTMLBuilder(Builder):
    outputProductPath = ""
    outputResourcePath = ""
    indexFile = None
    jsCompilation = None
    appJS = None
    manifestFile = None
    featureCheck = None
    manifest = None
    includes = None

    def __init__(self, buildID, buildLabel, outputRootPath, debug=False):
        super(HTMLBuilder, self).__init__(buildID, buildLabel, outputRootPath, debug)
        self.outputProductPath = os.path.join(self.outputRootPath, self.buildID)
        self.outputResourcePath = os.path.join(self.outputRootPath, "Resources")
        self.includes = []

    def build(self):
        self.setup()
        self.buildResources()
        self.findIncludes()
        self.buildAppJavascript()
        self.buildPreflight()
        self.buildAppCacheManifest()
        self.buildIndex()
        self.finish()

    def setup(self):
        super(HTMLBuilder, self).setup()
        os.makedirs(self.outputProductPath)
        os.makedirs(self.outputResourcePath)
        self.manifest = []
        self.appJS = []

    def buildImageResource(self, resourcePath, fullPath):
        super(HTMLBuilder, self).buildImageResource(resourcePath, fullPath)
        info = self.mainBunlde[resourcePath]
        info.update(dict(
             url=_webpath(os.path.relpath(outputPath, self.outputRootPath))
        ))
        dontcare, ext = os.path.splitext(os.path.basename(resourcePath))
        outputPath = os.path.join(self.outputResourcePath, info['hash'] + ext)
        shutil.copyfile(fullPath, outputPath)
        self.manifest.append(outputPath)

    def findIncludes(self):
        for path in self.info.get('JSIncludes', []):
            self.includes.append(path)
        mainSpecName = self.info.get('JSMainUIDefinitionFile', None)
        if mainSpecName is not None:
            mainSpec = self.mainBundle[mainSpecName]
            self.findSpecIncludes(mainSpec)

    def findSpecIncludes(self, spec):
        for k, v in spec.items():
            if k == 'JSIncludes':
                for path in v:
                    self.includes.append(path)
            elif k == 'JSInclude':
                self.includes.append(v)
            elif isinstance(v, dict):
                self.findSpecIncludes(v)

    def buildAppJavascript(self):
        includePaths = self.absolutePathsRelativeToSourceRoot('Frameworks', 'Classes', '.')
        with tempfile.NamedTemporaryFile() as bundleJSFile:
            bundleJSFile.write("'use strict';\n")
            bundleJSFile.write("JSBundle.bundles = %s;\n" % json.dumps(self.bundles, indent=self.debug))
            bundleJSFile.write("JSBundle.mainBundleIdentifier = '%s';\n" % self.info['JSBundleIdentifier'])
            self.jsCompilation = JSCompilation(includePaths, minify=not self.debug, combine=not self.debug)
            for path in self.includes:
                self.jsCompilation.include(path)
            self.jsCompilation.include(bundleJSFile, 'bundle.js')
            for outfile in self.jsCompilation.outfiles:
                outfile.fp.flush()
                if outfile.name:
                    outputPath = os.path.join(self.outputProductPath, outfile.name)
                elif len(self.appJS) == 0:
                    outputPath = os.path.join(self.outputProductPath, 'app.js')
                else:
                    outputPath = os.path.join(self.outputProductPath, 'app%d.js' % len(self.appJS))
                if not os.path.exists(os.path.dirname(outputPath)):
                    os.makedirs(os.path.dirname(outputPath))
                if self.debug and outfile.fp.name[0:len(self.sourceRootPath)] == self.sourceRootPath:
                    os.symlink(outfile.fp.name, outputPath)
                else:
                    shutil.copy(outfile.fp.name, outputPath)
                self.manifest.append(outputPath)
                self.appJS.append(outputPath)

    def buildPreflight(self):
        self.featureCheck = JSFeatureCheck()
        self.featureCheck.addFeature(JSFeature('window'))
        self.featureCheck.addFeature(JSFeature("document.body"))
        for feature in self.jsCompilation.features:
            self.featureCheck.addFeature(feature)
        self.preflightFile = open(os.path.join(self.outputRootPath, 'preflight-%s.js' % self.featureCheck.hash), 'w')
        self.featureCheck.serialize(self.preflightFile, 'bootstrapper')

    def buildAppCacheManifest(self):
        self.manifestFile = open(os.path.join(self.outputRootPath, "manifest.appcache"), 'w')
        self.manifestFile.write("CACHE MANIFEST\n")
        self.manifestFile.write("# build %s\n" % self.buildID)
        for name in self.manifest:
            self.manifestFile.write("%s\n" % _webpath(os.path.relpath(name, self.outputRootPath)))

    def buildIndex(self):
        indexName = self.info.get('JSApplicationHTMLIndexFile', 'index.html')
        document = HTML5Document(os.path.join(self.sourceRootPath, indexName)).domDocument
        self.indexFile = open(os.path.join(self.outputRootPath, indexName), 'w')
        stack = [document.documentElement]
        appSrc = []
        for includedSourcePath in self.appJS:
            relativePath = _webpath(os.path.relpath(includedSourcePath, os.path.dirname(self.indexFile.name)))
            appSrc.append(relativePath)
        jscontext = {
            'preflightID': self.featureCheck.hash,
            'preflightSrc': _webpath(os.path.relpath(self.preflightFile.name, self.outputRootPath)),
            'appSrc': appSrc
        }
        includePaths = (os.path.join(os.path.dirname(__file__), 'html_resources'),)
        while len(stack) > 0:
            node = stack.pop()
            if node.tagName == 'title' and node.parentNode.tagName == 'head':
                node.appendChild(document.createTextNode(self.info.get('JSApplicationTitle', '')))
            elif node.tagName == 'script' and node.getAttribute('type') == 'text/javascript':
                oldScriptText = u''
                for child in node.childNodes:
                    if child.nodeType == xml.dom.Node.TEXT_NODE:
                        oldScriptText += child.nodeValue
                with tempfile.NamedTemporaryFile() as inscript:
                    inscript.write(JSCompilation.preprocess(oldScriptText.strip(), jscontext))
                    compilation = JSCompilation(includePaths, minify=not self.debug, combine=not self.debug)
                    compilation.include(inscript)
                    for outfile in compilation.outfiles:
                        outfile.fp.flush()
                        script = document.createElement('script')
                        script.setAttribute('type', 'text/javascript')
                        if outfile.name is None:
                            outfile.fp.seek(0)
                            textNode = document.createTextNode("\n" + outfile.fp.read() + "\n")
                            script.appendChild(textNode)
                        else:
                            outputPath = os.path.join(self.outputProductPath, outfile.name)
                            if self.debug:
                                os.link(outfile.fp.name, outputPath)
                            else:
                                shutil.copy(outfile.fp.name, outputPath)
                            relativePath = _webpath(os.path.relpath(outputPath, os.path.dirname(self.indexFile.name)))
                            script.setAttribute('src', relativePath)
                        node.parentNode.insertBefore(script, node)
                node.parentNode.removeChild(node)
            for child in node.childNodes:
                if child.nodeType == xml.dom.Node.ELEMENT_NODE:
                    stack.append(child)
        if self.manifestFile and not self.debug:
            document.documentElement.setAttribute('manifest', _webpath(os.path.relpath(self.manifestFile.name, os.path.dirname(self.indexFile.name))))
        HTML5DocumentSerializer(document).serializeToFile(self.indexFile)

    def finish(self):
        super(HTMLBuilder, self).finish()
        self.indexFile.close()
        self.indexFile = None


def _webpath(ospath):
    if os.sep != '/':
        return ospath.replace(os.sep, '/')
    return ospath


class JSFeatureCheck(object):

    features = None
    _hash = None
    TEMPLATE_VERSION = 1

    template = """HTMLAppBootstrapper.mainBootstrapper.preflightChecks = %s;"""

    def __init__(self):
        self.features = []

    def addFeature(self, f):
        self.features.append(f)
        self._hash = None

    @property
    def hash(self):
        if self._hash is None:
            parts = {}
            for f in self.features:
                parts[f.check] = True
            parts = sorted(parts.keys())
            parts.append('TEMPLATE_VERSION=%s' % self.TEMPLATE_VERSION)
            return hashlib.sha1(':'.join(parts)).hexdigest()
        return self._hash

    def serialize(self, fp, globalDelegateName):
        checks = []
        for f in self.features:
            checks.append("{name: %s, fn: function(){ return !!(%s); }}" % (json.dumps('feature %s' % f.check), f.check))
        fp.write(self.template % ("[\n  %s\n]" % ",\n  ".join(checks)),)


class HTML5Document(object, HTMLParser):
    path = None
    domDocument = None
    element = None

    def __init__(self, path):
        HTMLParser.__init__(self)
        self.path = path
        dom = xml.dom.minidom.getDOMImplementation()
        doctype = dom.createDocumentType("html", None, None)
        self.domDocument = dom.createDocument(None, "html", doctype)
        fp = open(path, 'r')
        for line in fp:
            self.feed(line.decode('utf-8'))
        self.close()

    def handle_starttag(self, name, attrs):
        # TODO: see how this handles namespaces (like for svg)
        if name == 'html' and not self.element:
            self.element = self.domDocument.documentElement
        else:
            element = self._handle_starttag(name, attrs)
            if name not in HTML5DocumentSerializer.VOID_ELEMENTS:
                self.element = element

    def _handle_starttag(self, name, attrs):
        element = self.domDocument.createElement(name)
        for attr in attrs:
            element.setAttribute(attr[0], attr[1])
        self.element.appendChild(element)
        return element

    def handle_endtag(self, name):
        self.element.normalize()
        remove = []
        for child in self.element.childNodes:
            if child.nodeType == xml.dom.Node.TEXT_NODE and child.nodeValue.strip() == '':
                remove.append(child)
        for child in remove:
            self.element.removeChild(child)
        self.element = self.element.parentNode

    def handle_startendtag(self, name, attrs):
        self._handle_starttag(name, attrs)

    def handle_data(self, data):
        if self.element and self.element != self.domDocument.documentElement:
            node = self.domDocument.createTextNode(data)
            self.element.appendChild(node)

    def handle_entityref(self, name):
        # TODO
        pass

    def handle_charref(self, name):
        # TODO
        pass

    def handle_comment(self, data):
        pass

    def handle_decl(self, decl):
        pass

    def handle_pi(self, data):
        pass

    def unknown_decl(self, data):
        pass


class HTML5DocumentSerializer(object):

    document = None

    VOID_ELEMENTS = ('area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr')
    CLOSED_ELEMENTS = ('script', 'style', 'title', 'body')
    RAW_ELEMENTS = ('script', 'style')

    def __init__(self, document):
        super(HTML5DocumentSerializer, self).__init__()
        self.document = document

    def serializeToFile(self, writer):
        self.indent = ""
        self.indentString = "  "
        self.onlyTextChildren = [False]

        def _node(node):
            if node.nodeType == xml.dom.Node.ELEMENT_NODE:
                writer.write("%s<%s" % (self.indent, node.tagName))
                i = 0
                while i < node.attributes.length:
                    _node(node.attributes.item(i))
                    i += 1
                if node.tagName in self.VOID_ELEMENTS:
                    writer.write(">\n")
                else:
                    self.onlyTextChildren.append(True)
                    if node.childNodes.length:
                        writer.write(">")
                        for child in node.childNodes:
                            if child.nodeType not in (xml.dom.Node.TEXT_NODE, xml.dom.Node.ENTITY_NODE):
                                self.onlyTextChildren[-1] = False
                                break
                        if not self.onlyTextChildren[-1]:
                            writer.write("\n")
                            self.indent += self.indentString
                        for child in node.childNodes:
                            _node(child)
                        if not self.onlyTextChildren[-1]:
                            self.indent = self.indent[0:-len(self.indentString)]
                            writer.write("%s</%s>" % (self.indent, node.tagName))
                        else:
                            writer.write("</%s>" % node.tagName)
                    else:
                        writer.write("></%s>" % node.tagName)
                    writer.write("\n")
                    self.onlyTextChildren.pop()
            elif node.nodeType == xml.dom.Node.ATTRIBUTE_NODE:
                writer.write(' %s="%s"' % (node.name, node.value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").encode('utf-8')))
            elif node.nodeType == xml.dom.Node.TEXT_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                if node.parentNode.tagName in self.RAW_ELEMENTS:
                    writer.write(node.nodeValue.encode('utf-8'))
                else:
                    writer.write(node.nodeValue.replace("&", "&amp;").replace("<", "&lt;").encode('utf-8'))
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.CDATA_SECTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.ENTITY_NODE:
                if not self.onlyTextChildren[-1] and (not node.previousSibling or node.previousSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write(self.indent)
                writer.write("&%s;" % node.nodeName)
                if not self.onlyTextChildren[-1] and (not node.nextSibling or node.nextSibling.nodeType == xml.dom.Node.ELEMENT_NODE):
                    writer.write("\n")
            elif node.nodeType == xml.dom.Node.PROCESSING_INSTRUCTION_NODE:
                pass
            elif node.nodeType == xml.dom.Node.COMMENT_NODE:
                pass
            elif node.nodeType == xml.dom.Node.DOCUMENT_NODE:
                _node(node.doctype)
                _node(node.documentElement)
            elif node.nodeType == xml.dom.Node.DOCUMENT_TYPE_NODE:
                writer.write("%s<!DOCTYPE html>\n" % self.indent)
            elif node.nodeType == xml.dom.Node.NOTATION_NODE:
                pass

        _node(self.document)

    def serializeToString(self):
        writer = StringIO.StringIO()
        self.serializeToFile(writer)
        writer.close()
        return writer.getvalue()
