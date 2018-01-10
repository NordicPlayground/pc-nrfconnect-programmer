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

import protobuf from 'protobufjs';
import path from 'path';
import { getAppDir } from 'nrfconnect/core';

const protoPath = path.join(getAppDir(), 'resources/dfu-cc.proto');

export const OpCode = {
    RESET: 0,
    INIT: 1,
};

export const FwType = {
    APPLICATION: 0,
    SOFTDEVICE: 1,
    BOOTLOADER: 2,
    SOFTDEVICE_BOOTLOADER: 3,
};

export const HashType = {
    NO_HASH: 0,
    CRC: 1,
    SHA128: 2,
    SHA256: 3,
    SHA512: 4,
};

export const SignatureType = {
    ECDSA_P256_SHA256: 0,
    ED25519: 1,
};

async function createHash(hashType, hashInput) {
    const root = await protobuf.load(protoPath);
    const hashMessage = root.lookupType('dfu.Hash');
    const hashPayload = {
        hashType,
        hash: hashInput,
    };

    const hash = hashMessage.create(hashPayload);

    return hash;
}

// Create reset command
async function createResetCommand(timeout) {
    const root = await protobuf.load(protoPath);
    const resetCommandMessage = root.lookupType('dfu.ResetCommand');
    const resetCommandPayload = {
        timeout,
    };

    const resetCommand = resetCommandMessage.create(resetCommandPayload);

    return resetCommand;
}

// Create init command
async function createInitCommand(
    fwVersion,
    hwVersion,
    sdReq,
    type,
    sdSize,
    blSize,
    appSize,
    hash,
    isDebug,
) {
    const root = await protobuf.load(protoPath);
    const initCommandMessage = root.lookupType('dfu.InitCommand');
    const initCommandPayload = {
        fwVersion: fwVersion || 0,
        hwVersion,
        sdReq,
        type,
        sdSize,
        blSize,
        appSize,
        hash,
        isDebug: isDebug || false,
    };

    return initCommandMessage.create(initCommandPayload);
}

// Create command
async function createCommand(opCode, commandInput) {
    const root = await protobuf.load(protoPath);
    let init;
    let reset;
    if (opCode) {
        init = commandInput;
    } else {
        reset = commandInput;
    }
    const commandMessage = root.lookupType('dfu.Command');
    const commandPayload = {
        op_code: opCode,
        init,
        reset,
    };

    const command = commandMessage.create(commandPayload);

    return command;
}

// Create signed command
async function createSignedCommand(command, signatureType, signature) {
    const root = await protobuf.load(protoPath);
    // Create SignedCommand
    const signedCommandMessage = root.lookupType('dfu.SignedCommand');
    const signedCommandPayload = {
        command,
        signatureType,
        signature,
    };
    const signedCommand = signedCommandMessage.create(signedCommandPayload);

    return signedCommand;
}

// Create packet
async function createPacket(command, isSigned) {
    const root = await protobuf.load(protoPath);
    const packetPayload = isSigned ? {
        signedCommand: command,
    } : {
        command,
    };

    console.log(packetPayload);
    const packetMessage = root.lookupType('dfu.Packet');
    const packet = packetMessage.create(packetPayload);

    return packet;
}

async function messageToBuffer(type, message) {
    const root = await protobuf.load(protoPath);
    const dfuMessage = root.lookup(`dfu.${type}`);
    const buffer = dfuMessage.encode(message).finish();

    return buffer;
}

/**
 * Create reset command
 *
 * @param {Integer} timeout the timeout for reset
 * @param {Integer} signatureType the type of signature
 * @param {Array} signature the signature in bytes
 *
 * @returns {Packet} the unsigend reset command packet
 */
export async function createResetPacket(timeout, signatureType, signature) {
    try {
        // Check input parameters
        if (timeout === undefined) {
            throw new Error('Timeout is not set');
        }
        if (signatureType === undefined ^ signature === undefined) {
            throw new Error('Either signature type or signature is not set');
        }

        // Create reset command
        const resetCommand = await createResetCommand(timeout);
        let isSigned = false;
        let command = await createCommand(OpCode.RESET, resetCommand);
        // Create signed command if it is signed
        if (signatureType !== undefined && signature !== undefined) {
            isSigned = true;
            command = await createSignedCommand(command, signatureType, signature);
        }

        const packet = await createPacket(command, isSigned);

        return packet;
    } catch (e) {
        return undefined;
    }
}

export async function createResetPacketBuffer(timeout, signatureType, signature) {
    const packet = await createResetPacket(timeout, signatureType, signature);
    const buffer = await messageToBuffer('Packet', packet);
    return buffer;
}

export async function createInitPacket(
    fwVersion,
    hwVersion,
    sdReq,
    fwType,
    sdSize,
    blSize,
    appSize,
    hashType,
    hash,
    isDebug,
    signatureType,
    signature,
) {
    // Create init command
    const hashInput = await createHash(hashType, hash);
    const initCommand = await createInitCommand(
        fwVersion,
        hwVersion,
        sdReq,
        fwType,
        sdSize,
        blSize,
        appSize,
        hashInput,
        isDebug,
    );
    let command = await createCommand(OpCode.INIT, initCommand);
    let isSigned = false;

    // Create signed command if it is signed
    if (signatureType !== undefined && signature !== undefined) {
        command = await createSignedCommand(command, signatureType, signature);
        isSigned = true;
    }

    const packet = await createPacket(command, isSigned);

    return packet;
}

export async function createInitPacketBuffer(
    fwVersion,
    hwVersion,
    sdReq,
    fwType,
    sdSize,
    blSize,
    appSize,
    hashType,
    hash,
    isDebug,
    signatureType,
    signature,
) {
    const packet = await createResetPacket(
        fwVersion,
        hwVersion,
        sdReq,
        fwType,
        sdSize,
        blSize,
        appSize,
        hashType,
        hash,
        isDebug,
        signatureType,
        signature,
    );
    const buffer = await messageToBuffer('Packet', packet);
    console.log(buffer);
    return buffer;
}