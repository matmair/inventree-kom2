"""Use InvenTree with KiCad."""

from plugin import InvenTreePlugin
from plugin.mixins import NavigationMixin, UrlsMixin

from django.urls import re_path
from django.http import Http404, HttpResponse
from plugin.helpers import (MixinNotImplementedError, render_template,
                            render_text)
from InvenTree.permissions import auth_exempt
from typing import List
from dataclasses import dataclass, asdict, field
from json import dumps

import requests
from django.template.loader import render_to_string
import json
from dataclasses import dataclass
from django.urls import reverse

# from django.utils.translation import gettext_lazy as _

@dataclass
class KiCadMetadata:
    version: int = 0

@dataclass
class KiCadSource:
    type: str = "odbc"
    connection_string: str = "Driver=/Users/matmair/Library/kom2/kom2.dylib;username=reader;password=readonly;server=https://demo.inventree.org"
    timeout_seconds: int = 2

@dataclass
class KiCadField:
    column: str = "IPN"
    name: str = "IPN"
    visible_on_add: bool = False
    visible_in_chooser: bool = True
    show_name: bool = True
    inherit_properties: bool = False

@dataclass
class KiCadProperties:
    description: str = "description"
    keywords: str = "keywords"


@dataclass
class KiCadLibrary:
    name: str = "Resistors"
    table: str = "Electronics/Passives/Resistors"
    key: str = "IPN"
    symbols: str = "parameter.Symbol"
    footprints: str = "parameter.Footprint"
    fields: List[KiCadField] = field(default_factory=list)
    properties: KiCadProperties = field(default=KiCadProperties())

class JsonClass:
    @property
    def __dict__(self):
        """Get a python dictionary."""
        return asdict(self)

    @property
    def json(self):
        """Get the json formated string."""
        return dumps(self.__dict__, indent=4)


@dataclass
class KiCadSetting(JsonClass):
    meta: KiCadMetadata = field(default=KiCadMetadata())
    name: str = "InvenTree Library"
    description: str = "Components pulled from InvenTree"
    source: KiCadSource = field(default=KiCadSource())
    libraries: List[KiCadLibrary] = field(default_factory=list)


class Kom2Plugin(UrlsMixin, NavigationMixin, InvenTreePlugin):
    """Use InvenTree with KiCad."""

    NAME = 'InvenTree Kom2'
    SLUG = 'inventree-kom2'
    TITLE = "KiCad Integration (Kom2)"

    # Navigation
    NAVIGATION = [
        {'name': 'KiCad Integration', 'link': 'plugin:inventree-kom2:index', 'icon': 'fas fa-database'},
    ]
    NAVIGATION_TAB_NAME = "KiCad"
    NAVIGATION_TAB_ICON = 'fas fa-database'

    # Urls
    def setup_urls(self):
        """Urls that are exposed by this plugin."""
        return [
            re_path(r'settings/', self.settings_func, name='settings'),
            re_path(r'', self.index_func, name='index'),
        ]

    def index_func(self, request):
        """Setup page."""
        url = 'https://api.github.com/repos/clj/kom2/releases/latest'
        refs = ['linux-amd64', 'linux-arm64', 'macos-amd64', 'macos-arm64', 'windows-amd64']

        ctx = {}
        # Get the latest release
        gh_url = requests.get(url, headers={'Accept': 'application/json'})
        assets = gh_url.json()['assets']
        for asset in assets:
            for ref in refs:
                if asset['name'].endswith(ref + '.zip'):
                    ctx[ref.replace('-', '_')] = asset['browser_download_url']

        # Render the template

        # Set up the settings url
        ctx['settings_url'] = request.build_absolute_uri(reverse('plugin:inventree-kom2:settings'))

        return HttpResponse(render_template(request, 'inventree_kom2/index.html', ctx))
    
    @auth_exempt
    def settings_func(self, request):
        """Setup page."""

        settings = KiCadSetting()

        lib = KiCadLibrary()
        lib.fields = [
            KiCadField(column="IPN", name="IPN", visible_on_add=False, visible_in_chooser=True, show_name=True, inherit_properties=True),
            KiCadField(column="parameter.Resistance", name="Resistance", visible_on_add=True, visible_in_chooser=True, show_name=True),
            KiCadField(column="parameter.Package", name="Package", visible_on_add=True, visible_in_chooser=True, show_name=False)
        ]
        settings.libraries = [lib]

        # Render the template
        return HttpResponse(settings.json, content_type='application/json')
