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

import React from 'react';
import { logger } from 'nrfconnect/core';

import ControlPanel from './containers/controlPanel';
import AppMainView from './containers/appMainView';
import * as fileActions from './actions/fileActions';
import * as targetActions from './actions/targetActions';
import appReducer from './reducers';

import './resources/css/index.less';

export default {
    onInit: dispatch => {
        document.ondrop = event => {
            event.preventDefault();
        };

        document.ondragover = document.ondrop;

        document.body.ondragover = event => {
            const dragOverEvent = event;
            if (!dragOverEvent.dataTransfer.files.length) {
                dragOverEvent.dataTransfer.dropEffect = 'none';
                dragOverEvent.dataTransfer.effectAllowed = 'none';
            } else {
                dragOverEvent.dataTransfer.effectAllowed = 'uninitialized';
            }
        };

        document.body.ondrop = event => {
            Array.from(event.dataTransfer.files).forEach(i => {
                dispatch(fileActions.openFile(i.path));
            });
            event.preventDefault();
        };
    },
    decorateMainView: MainView => () => (
        <MainView>
            <AppMainView />
        </MainView>
    ),
    decorateSidePanel: SidePanel => () => (
        <SidePanel>
            <ControlPanel />
        </SidePanel>
    ),
    reduceApp: appReducer,
    mapSerialPortSelectorState: (state, props) => ({
        portIndicatorStatus: (state.app.target.port !== null) ? 'on' : 'off',
        ...props,
    }),
    middleware: store => next => action => {
        const state = store.getState();
        const { dispatch } = store;
        switch (action.type) {
            case 'SERIAL_PORT_SELECTED': {
                dispatch(targetActions.logDeviceInfo(
                    action.port.serialNumber,
                    action.port.comName,
                ));
                break;
            }
            case 'SERIAL_PORT_DESELECTED': {
                logger.info('Target device closed.');
                break;
            }
            case targetActions.WRITE_START: {
                if (state.app.file.memMaps.length === 0) {
                    return;
                }
                dispatch(targetActions.write());
                break;
            }
            case targetActions.RECOVER_START: {
                dispatch(targetActions.recover());
                break;
            }
            case targetActions.REFRESH_ALL_FILES_START: {
                dispatch(fileActions.refreshAllFiles());
                break;
            }
            default:
        }
        next(action);
    },
};
