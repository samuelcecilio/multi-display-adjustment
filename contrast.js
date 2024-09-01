/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

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
