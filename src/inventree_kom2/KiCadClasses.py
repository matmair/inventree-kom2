"""KiCad database classes."""

import json
from dataclasses import asdict, dataclass, field
from typing import List


class JsonClass:
    """Mixin for dataclasses to support serialsation."""

    @property
    def __dict__(self):
        """Get a python dictionary."""
        return asdict(self)

    @property
    def json(self):
        """Get the json formated string."""
        return json.dumps(self.__dict__, indent=4)


@dataclass
class KiCadMetadata:
    """KiCad database metadata class."""

    version: int = 0


@dataclass
class KiCadSource:
    """KiCad database source class."""

    type: str = "odbc"
    connection_string: str = "Driver=~/Library/kom2/kom2.dylib;username=reader;password=readonly;server=https://demo.inventree.org"
    timeout_seconds: int = 2

    def set_connection_string(self, path: str, server: str, username: str = None, password: str = None, token: str = None):
        """Set the connection string."""
        if not path.endswith("kom2.dylib"):
            path = path + "/kom2.dylib"

        if token:
            self.connection_string = f"Driver={path};apitoken={token};server={server}"
        else:
            self.connection_string = f"Driver={path};username={username};password={password};server={server}"


@dataclass
class KiCadField:
    """KiCad database field class."""

    column: str = "IPN"
    name: str = "IPN"
    visible_on_add: bool = False
    visible_in_chooser: bool = True
    show_name: bool = True
    inherit_properties: bool = False


@dataclass
class KiCadProperties:
    """KiCad database properties class."""

    description: str = "description"
    keywords: str = "keywords"


@dataclass
class KiCadLibrary:
    """KiCad database library class."""

    name: str = "Resistors"
    table: str = "Electronics/Passives/Resistors"
    key: str = "IPN"
    symbols: str = "parameter.Symbol"
    footprints: str = "parameter.Footprint"
    fields: List[KiCadField] = field(default_factory=list)
    properties: KiCadProperties = field(default=KiCadProperties())


@dataclass
class KiCadSetting(JsonClass):
    """KiCad database settings class."""

    meta: KiCadMetadata = field(default=KiCadMetadata())
    name: str = "InvenTree Library"
    description: str = "Components pulled from InvenTree"
    source: KiCadSource = field(default=KiCadSource())
    libraries: List[KiCadLibrary] = field(default_factory=list)
