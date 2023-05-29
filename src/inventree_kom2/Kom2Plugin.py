"""Use InvenTree with KiCad."""

import requests
from django.http import HttpResponse
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
            re_path(r'settings/', self.settings_func, name='settings'),
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
        settings = KiCadSetting()

        if request.GET and request.GET['token']:
            settings.source.set_connection_string(path="~/Library/kom2/kom2.dylib", token=request.GET['token'], server=request.build_absolute_uri("/"))
        else:
            # Create DB user with readonly access
            # settings.source.set_connection_string(path="~/Library/kom2/kom2.dylib", username="reader", password="readonly", server=request.build_absolute_uri("/"))
            raise PermissionDenied({"error": "No token provided."})
        lib = KiCadLibrary()
        lib.fields = [
            KiCadField(column="IPN", name="IPN", visible_on_add=False, visible_in_chooser=True, show_name=True, inherit_properties=True),
            KiCadField(column="parameter.Resistance", name="Resistance", visible_on_add=True, visible_in_chooser=True, show_name=True),
            KiCadField(column="parameter.Package", name="Package", visible_on_add=True, visible_in_chooser=True, show_name=False)
        ]
        settings.libraries = [lib]

        # Render the template
        return HttpResponse(settings.json, content_type='application/json')
