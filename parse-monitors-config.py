import json
from pathlib import Path
import sys
from typing import Callable, Optional
from xml.etree import ElementTree


def get(element: Optional[any], parser: Callable = None):
    if element is None:
        return element

    if parser:
        return parser(element.text)
    
    return element.text


def parse_display(logical_monitor):
    return {
        "x": get(logical_monitor.find('x'), int),
        "y": get(logical_monitor.find('y'), int),
        "scale": get(logical_monitor.find('scale'), float),
        "primary": get(logical_monitor.find('primary'), bool) or False,
        "connector": get(logical_monitor.find('monitor/monitorspec/connector')),
        "model": get(logical_monitor.find('monitor/monitorspec/product')),
        "serial": get(logical_monitor.find('monitor/monitorspec/serial')),
        "width": get(logical_monitor.find('monitor/mode/width'), int),
        "height": get(logical_monitor.find('monitor/mode/height'), int),
        "rate": get(logical_monitor.find('monitor/mode/rate'), float),
        "rawRate": get(logical_monitor.find('monitor/mode/rate')),
        "enabled": True
    }


def parse_disabled_display(monitor_spec):
    return {
        "connector": get(monitor_spec.find('connector')),
        "model": get(monitor_spec.find('product')),
        "serial": get(monitor_spec.find('serial')),
        "enabled": False
    }


def parsePresets(configuration):
    presets = []

    for configuration_entry in configuration:
        displays = { }

        for entry in configuration_entry:
            if entry.tag == 'logicalmonitor':
                logical_monitor = entry
                display = parse_display(logical_monitor)
                key = display["model"] + "@" + display["connector"]
                displays[key] = display
            # elif entry.tag == 'disabled':
            #     for monitor_spec in entry:
            #         disabled_display = parse_disabled_display(monitor_spec)
            #         key = disabled_display["model"] + "@" + disabled_display["connector"]
            #         displays[key] = disabled_display

        presets.append(displays)

    return { "presets": presets }


rawPresets = ElementTree.parse(str(Path.home()) + '/.config/monitors.xml').getroot()

indent = len(sys.argv) == 2 and sys.argv[1] == "--indent"

if indent:
    print(json.dumps(parsePresets(rawPresets), indent=2))
else:
    print(json.dumps(parsePresets(rawPresets)))
