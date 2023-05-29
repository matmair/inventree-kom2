"""Use InvenTree with KiCad."""

from plugin import InvenTreePlugin
# from plugin.mixins import SettingsMixin
# from django.utils.translation import gettext_lazy as _


class Kom2Plugin(InvenTreePlugin):
    """Use InvenTree with KiCad."""

    NAME = 'Kom2Plugin'
    SLUG = 'inventree-kom2'
    TITLE = "InvenTree Kom2"

    def your_function_here(self):
        """Do something."""
        pass
