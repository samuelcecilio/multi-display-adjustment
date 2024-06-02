import GObject from 'gi://GObject'

// import { PopupMenuSection } from 'resource:///org/gnome/shell/ui/popupMenu.js'
import { QuickSlider } from 'resource:///org/gnome/shell/ui/quickSettings.js'

const BrightnessSlider = GObject.registerClass(
class BrightnessSlider extends QuickSlider {
    _init(extension, displayId) {
        super._init({
            iconName: 'display-brightness-symbolic',
            // menuEnabled: true
        })

        this._extension = extension
        this._displayId = displayId
        this._maxValue = 100

        this._sliderChangedId = this.slider.connect('notify::value', this._sliderChanged.bind(this));
        this.slider.accessible_name = _('Brightness')

        // this._popupMenuSection = new PopupMenuSection()
        // this.menu.addMenuItem(this._popupMenuSection)
        // this.menu.setHeader('display-symbolic', _('Display'))
    }

    async _fetchInitialBrightness() {
        const brightness = await this._extension._ddcutilService._getBrightness(this._displayId)

        this._maxValue = brightness.max

        this.slider.value = brightness.current / brightness.max
    }

    _sliderChanged() {
        const step = this._maxValue / 20
        const percent = Math.round(this.slider.value * this._maxValue / step) * step;

        if (percent != this._previousPercent) {
            this._previousPercent = percent
            this._extension._ddcutilService._setBrightness(this._displayId, percent)
        }
    }

    _changeSlider(value) {
        this.slider.block_signal_handler(this._sliderChangedId);
        this.slider.value = value;
        this.slider.unblock_signal_handler(this._sliderChangedId);
    }
})

export { BrightnessSlider }
