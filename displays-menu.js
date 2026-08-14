import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import St from 'gi://St'

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { gettext as _, ngettext } from 'resource:///org/gnome/shell/extensions/extension.js'
import { QuickMenuToggle } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { Slider } from 'resource:///org/gnome/shell/ui/slider.js'

import { devLog } from './code-convenience.js'


const BRIGHTNESS_VCP_CODE = 0x10
const CONTRAST_VCP_CODE = 0x12

/**
 * Displays are written to in twentieths of their range. DDC/CI writes are slow
 * and every intermediate value of a drag would otherwise be sent to the display.
 */
const STEPS = 20

/**
 * A slider bound to a single VCP feature of a single display, laid out as a
 * menu item so that several of them fit in one dropdown. The shell uses the
 * same shape for the keyboard backlight in `status/backlight.js`.
 */
const VcpSliderItem = GObject.registerClass(
class VcpSliderItem extends PopupMenu.PopupBaseMenuItem {
    _init(ddcutilService, displayId, vcpCode, gicon, accessibleName) {
        super._init({ activate: false })

        this._ddcutilService = ddcutilService
        this._displayId = displayId
        this._vcpCode = vcpCode
        this._maxValue = 100
        this._previousValue = null
        this._destroyed = false

        this.connect('destroy', () => (this._destroyed = true))

        this.add_child(new St.Icon({
            gicon,
            style_class: 'popup-menu-icon'
        }))

        this._slider = new Slider(0)
        this._slider.x_expand = true
        this._slider.accessible_name = accessibleName

        this.add_child(this._slider)

        this._sliderChangedId = this._slider.connect('notify::value', this._onSliderChanged.bind(this))
    }

    /**
     * Reads the current value from the display. Returns false when the display
     * does not support the feature, in which case the item stays hidden.
     */
    async fetchValue() {
        const value = await this._ddcutilService.getVcp(this._displayId, this._vcpCode)

        if (this._destroyed) {
            return false
        }

        if (value === null || !value.max) {
            this.hide()

            return false
        }

        this._maxValue = value.max
        this._previousValue = value.current

        this._slider.block_signal_handler(this._sliderChangedId)
        this._slider.value = value.current / value.max
        this._slider.unblock_signal_handler(this._sliderChangedId)

        this.show()

        return true
    }

    _onSliderChanged() {
        const step = this._maxValue / STEPS
        const value = Math.round(this._slider.value * this._maxValue / step) * step

        if (value === this._previousValue) {
            return
        }

        this._previousValue = value

        this._ddcutilService.setVcp(this._displayId, this._vcpCode, value)
    }

    /**
     * Menu items consume left and right arrows for navigation, which are the
     * keys expected to move a slider.
     */
    vfunc_key_press_event(event) {
        const key = event.get_key_symbol()

        if (key === Clutter.KEY_Left || key === Clutter.KEY_Right) {
            return this._slider.vfunc_key_press_event(event)
        }

        return super.vfunc_key_press_event(event)
    }
})

/**
 * One Quick Settings tile holding every display, instead of a pair of unlabelled
 * sliders per display. Sliders in the grid have no room for a title, so with more
 * than one display there is no way to tell which slider belongs to which screen.
 */
const DisplaysToggle = GObject.registerClass(
class DisplaysToggle extends QuickMenuToggle {
    /**
     * `iconsDirectory` is the extension's own `icons`. Adwaita has no contrast
     * icon since GNOME 47 trimmed its legacy set, so the extension ships one.
     * The `-symbolic.svg` suffix is what makes the shell recolour it.
     */
    _init(ddcutilService, iconsDirectory) {
        super._init({
            title: _('Displays'),
            iconName: 'display-brightness-symbolic'
        })

        /**
         * The property only exists since GNOME 49, and passing an unknown
         * property to _init fails construction on older shells. Those fall
         * back to the shell's built-in "Open menu" label.
         */
        if ('menuButtonAccessibleName' in this) {
            this.menuButtonAccessibleName = _('Open display adjustments menu')
        }

        this._ddcutilService = ddcutilService
        this._destroyed = false

        this._brightnessIcon = new Gio.ThemedIcon({ name: 'display-brightness-symbolic' })
        this._contrastIcon = new Gio.FileIcon({
            file: iconsDirectory.get_child('contrast-symbolic.svg')
        })

        /**
         * Values are read from the displays asynchronously and a display can be
         * unplugged meanwhile. Replies of a previous layout are discarded.
         */
        this._generation = 0

        this.menu.setHeader('display-brightness-symbolic', _('Displays'))

        this.connect('clicked', () => this.menu.toggle())
        this.connect('destroy', () => (this._destroyed = true))

        this.visible = false
    }

    setDisplays(displays) {
        this._generation++

        this.menu.removeAll()

        for (const display of displays) {
            this._addDisplay(display, this._generation)
        }

        this.visible = displays.length > 0

        if (displays.length === 1) {
            this.subtitle = displays[0].name
        } else {
            this.subtitle = ngettext('%d display', '%d displays', displays.length).format(displays.length)
        }
    }

    _addDisplay(display, generation) {
        const heading = new PopupMenu.PopupSeparatorMenuItem(display.name)

        /**
         * The connector disambiguates two displays of the same model, which
         * share the name Mutter reports.
         */
        heading.add_child(new St.Label({
            text: display.connector,
            style_class: 'popup-menu-item-connector',
            y_align: Clutter.ActorAlign.CENTER,
            opacity: 150
        }))

        this.menu.addMenuItem(heading)

        const brightness = new VcpSliderItem(
            this._ddcutilService, display.displayId, BRIGHTNESS_VCP_CODE,
            this._brightnessIcon, _('Brightness of %s').format(display.name)
        )

        const contrast = new VcpSliderItem(
            this._ddcutilService, display.displayId, CONTRAST_VCP_CODE,
            this._contrastIcon, _('Contrast of %s').format(display.name)
        )

        this.menu.addMenuItem(brightness)
        this.menu.addMenuItem(contrast)

        this._fetchValues(display, heading, brightness, contrast, generation)
    }

    async _fetchValues(display, heading, brightness, contrast, generation) {
        const hasBrightness = await brightness.fetchValue()
        const hasContrast = await contrast.fetchValue()

        if (this._destroyed || generation !== this._generation) {
            return
        }

        if (!hasBrightness && !hasContrast) {
            devLog("[multi-display-adjustment] No adjustable features on display", display.name)

            heading.hide()
        }
    }
})

export { DisplaysToggle }
