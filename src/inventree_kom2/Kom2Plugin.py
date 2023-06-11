"""Use InvenTree with KiCad."""

import json
from uuid import uuid4

import requests
from django.http import HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.urls import re_path, reverse
from InvenTree.permissions import auth_exempt
from plugin import InvenTreePlugin
from plugin.helpers import render_template
from plugin.mixins import NavigationMixin, UrlsMixin
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied

from .KiCadClasses import KiCadField, KiCadLibrary, KiCadSetting


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
            re_path(r'script', self.script_func, name='script'),
            re_path(r'settings/', self.settings_func, name='settings'),
            re_path(r'api/tables', self.api_tables, name='api_tables'),
            re_path(r'api/table-add', self.api_table_add, name='api_table-add'),
            re_path(r'', self.index_func, name='index'),
        ]

    def index_func(self, request):
        """Render index page with install instructions."""
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
        token, _ = Token.objects.get_or_create(user=request.user)
        ctx['settings_url'] = f"{request.build_absolute_uri(reverse('plugin:inventree-kom2:settings'))}?token={token}"

        return HttpResponse(render_template(request, 'inventree_kom2/index.html', ctx))

    @auth_exempt
    def settings_func(self, request):
        """Show database settings as json."""
        if request.GET and request.GET['token']:
            server = request.build_absolute_uri("/")
            token = request.GET['token']

            settings = self.get_settings(server, token)
            # Render the template
            return HttpResponse(settings.json, content_type='application/json')

        # Create DB user with readonly access
        # settings.source.set_connection_string(path="~/Library/kom2/kom2.dylib", username="reader", password="readonly", server=request.build_absolute_uri("/"))
        raise PermissionDenied({"error": "No token provided."})

    def get_settings(self, server, token):
        """Get the settings for kom2."""
        # Get data
        data = self.db.get_metadata('kom2')
        if data:
            data = json.loads(data)
            settings = KiCadSetting()
            settings.from_json(**data)
        else:
            # Construct default objects
            settings = KiCadSetting()
            lib = KiCadLibrary(id=str(uuid4()))
            lib.fields = [
                KiCadField(column="IPN", name="IPN", visible_on_add=False, visible_in_chooser=True, show_name=True, inherit_properties=True),
                KiCadField(column="parameter.Resistance", name="Resistance", visible_on_add=True, visible_in_chooser=True, show_name=True),
                KiCadField(column="parameter.Package", name="Package", visible_on_add=True, visible_in_chooser=True, show_name=False)
            ]
            settings.libraries = [lib]

        # Define access
        settings.source.set_connection_string(path="~/Library/kom2/kom2.dylib", token=token, server=server)

        return settings

    def set_settings(self, settings: KiCadSetting):
        """Set the settings for kom2."""
        self.db.set_metadata('kom2', settings.json)

    def script_func(self, request):
        """Return the script.js file."""
        return TemplateResponse(request, 'inventree_kom2/script.js', content_type='application/javascript')

    def api_tables(self, request):
        """Return the tables as json."""
        settings = self.get_settings(request.build_absolute_uri("/"), 'token')

        libs = [x.__dict__ for x in settings.libraries]
        # Add keys
        for lib in libs:
            lib['id'] = f'id{lib["id"]}'

        return JsonResponse({'libraries': libs, 'test': 'test2'})

    def api_table_add(self, request):
        """Add a table."""
        data = request.body
        if data:
            data = json.loads(data.decode('utf-8'))['data']

            # Create Table
            table = KiCadLibrary(id=str(uuid4()), name=data['name'], table=data['table'], key=data['key'], symbols=data['symbols'], footprints=data['footprints'])
            table.properties.description = data['description']
            table.properties.keywords = data['keywords']

            settings = self.get_settings(request.build_absolute_uri("/"), 'token')
            settings.libraries.append(table)

            # Save table
            self.set_settings(settings)

            return JsonResponse({'status': 'ok'})
        return JsonResponse({'status': 'error'})
