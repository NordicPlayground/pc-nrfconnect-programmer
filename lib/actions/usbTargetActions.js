/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as dfujs from 'pc-nrf-dfu-js';
import MemoryMap from 'nrf-intel-hex';
import SerialPort from 'serialport';
import TargetActions from './targetActions';
import * as deviceDefinitions from '../util/deviceDefinitions';

class USBTargetAcations extends TargetActions {
    constructor() {
        super();
        this.USB_TARGET_GET_VERSIONS = 'USB_TARGET_GET_VERSIONS';
    }

    usbTargetGetVersionsActions([protocolVersion, hardwareVersion, firmwareVersions]) {
        return {
            type: this.USB_TARGET_GET_VERSIONS,
            protocolVersion,
            hardwareVersion,
            firmwareVersions,
        };
    }

    async getDeviceVersions(comName) {
        return new Promise(async (resolve, reject) => {
            const port = new SerialPort(comName, { baudRate: 115200, autoOpen: false });
            this.serialTransport = new dfujs.DfuTransportSerial(port, 0);
            const protocolVersion = await this.serialTransport.getProtocolVersion();
            const hardwareVersion = await this.serialTransport.getHardwareVersion();
            const firmwareVersions = await this.serialTransport.getAllFirmwareVersions();
            port.close();

            resolve([protocolVersion, hardwareVersion, firmwareVersions]);
        });
    }

    // Display some information about a devkit. Called on a devkit connection.
    loadDeviceInfo(comName) {
        return async dispatch => {
            const versions =
                await this.getDeviceVersions(comName);
            const hardwareVersion = versions[1];
            const deviceDefinition = deviceDefinitions.getDeviceDefinition(
                hardwareVersion.part.toString(16),
            );

            dispatch(this.targetSizeKnownAction(
                hardwareVersion.memory.romSize || deviceDefinition.romSize,
                deviceDefinition.pageSize,
            ));
            // dispatch(this.usbTargetGetVersionsActions());

            dispatch(this.targetContentsKnownAction(
                contents.memMap,
                contents.regions,
                contents.labels,
            ));
        };
    }


}

export default USBTargetAcations;