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

import { List } from 'immutable';

const deviceDefinitions = new List([
    {
        family: 'nRF52',
        type: 'nRF52840',
        name: 'Graviton',
        romSize: 0x100000, // 1 MB
        romBaseAddr: 0x0,
        ramSize: 0x40000, // 256 KB
        pageSize: 0x4,  // 4 KB
        blockSize: 0.5, // KB
        ficrBaseAddr: 0x10000000,
        uicrBaseAddr: 0x10001000,
        blAddrBaseAddr: 0x10001014,
    },
]);

export function getDeviceDefinition(type) {
    return deviceDefinitions.find(device => device.type.includes(type));
}

export function getStringDescriptor(device, index) {
    return new Promise((resolve, reject) => {
        device.getStringDescriptor(index, (error, data) => {
            if (error) {
                reject(error);
            }
            resolve(data);
        });
    });
}

export async function checkBootloaderMode(device) {
    device.open();
    const manufacturer = await getStringDescriptor(device, device.deviceDescriptor.iManufacturer);
    const product = await getStringDescriptor(device, device.deviceDescriptor.iProduct);
    device.close();

    if (manufacturer === 'Nordic Semiconductor' && product.includes('USB SDFU')) {
        return true;
    }
    return false;
}
