import GObject from 'gi://GObject'

import { QuickSlider } from 'resource:///org/gnome/shell/ui/quickSettings.js'

const ContrastSlider = GObject.registerClass(
class ContrastSlider extends QuickSlider {
    _init(ddcutilService, displayId) {
        super._init({
            iconName: 'camera-iso-symbolic'
        })

        this._ddcutilService = ddcutilService
        this._displayId = displayId
        this._maxValue = 100

        this._sliderChangedId = this.slider.connect('notify::value', this._sliderChanged.bind(this));
        this.slider.accessible_name = _('Contrast')
    }

    async _fetchInitialContrast() {
        const contrast = await this._ddcutilService._getContrast(this._displayId)

        this._maxValue = contrast.max

        this.slider.value = contrast.current / contrast.max
    }

    _sliderChanged() {
        const step = this._maxValue / 20
        const percent = Math.round(this.slider.value * this._maxValue / step) * step;

        if (percent != this._previousPercent) {
            this._previousPercent = percent
            this._ddcutilService._setContrast(this._displayId, percent)
        }
    }

    _changeSlider(value) {
        this.slider.block_signal_handler(this._sliderChangedId);
        this.slider.value = value;
        this.slider.unblock_signal_handler(this._sliderChangedId);
    }
})

export { ContrastSlider }
