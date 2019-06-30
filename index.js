'use strict';

const fileType = require('file-type')

const fileTypeExt = input => {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
        throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
    }

    const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);

    if (!(buffer && buffer.length > 1)) {
        return;
    }

    const check = (header, options) => {
        options = {
            offset: 0,
            ...options
        };

        for (let i = 0; i < header.length; i++) {
            // If a bitmask is set
            if (options.mask) {
                // If header doesn't equal `buf` with bits masked off
                if (header[i] !== (options.mask[i] & buffer[i + options.offset])) {
                    return false;
                }
            } else if (header[i] !== buffer[i + options.offset]) {
                return false;
            }
        }

        return true;
    };

    const type = fileType(buffer)
    if(type && type.ext === 'msi'){
        // Use CLSIDs to check old Microsoft Office file types: .doc, .xls, .ppt
        // Ref: http://fileformats.archiveteam.org/wiki/Microsoft_Compound_File
        const sectorSize = 1 << buffer[30];
        let index = (buffer[49] * 256) + buffer[48];
        index = ((index + 1) * sectorSize) + 80;

        // If the CLSID block is located outside the buffer, it will return an extra field `minimumRequiredBytes`.
        // Therefore, user can optionally retry it with a larger buffer.
        if (index + 16 > buffer.length) {
            return {
                ext: 'msi',
                mime: 'application/x-msi',
                minimumRequiredBytes: index + 16
            };
        }

        // If the CLSID block is located within the buffer, it will try to identify its file type (.doc, .xls, .ppt) by CLSID.
        if (check([0x06, 0x09, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
            return {
                ext: 'doc',
                mime: 'application/msword'
            };
        }

        if (check([0x10, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
            return {
                ext: 'xls',
                mime: 'application/vnd.ms-excel'
            };
        }

        if (check([0x20, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
            return {
                ext: 'xls',
                mime: 'application/vnd.ms-excel'
            };
        }

        if (check([0x10, 0x8D, 0x81, 0x64, 0x9B, 0x4F, 0xCF, 0x11, 0x86, 0xEA, 0x00, 0xAA, 0x00, 0xB9, 0x29, 0xE8], {offset: index})) {
            return {
                ext: 'ppt',
                mime: 'application/vnd.ms-powerpoint'
            };
        }
       return {
            ext: 'msi',
            mime: 'application/x-msi'
        };
    }

    return type
}

module.exports = fileTypeExt

Object.defineProperty(fileTypeExt, 'minimumBytes', {value: fileType.minimumBytes});

fileTypeExt.stream = async readableStream => {
    const readBytes = async (rs, num = 0) => {
        return rs.read(num) || new Promise((resolve, reject) => {
            let onEnd;
            let onError;
            rs.once('end', onEnd = () => resolve(rs.read()));
            rs.once('error', onError = e => reject(e));
            rs.once('readable', async () => {
                rs.removeListener('end', onEnd);
                rs.removeListener('error', onError);
                resolve(await readBytes(rs, num));
            });
        });
    };

    // Using `eval` to work around issues when bundling with Webpack
    const stream = eval('require')('stream'); // eslint-disable-line no-eval

    // A recursive function will first try to check the file type by using the first 'minimumBytes' chunk.
    // If the first 'minimumBytes' chunk is not enough to identify the file type, e.g. .doc, it will try it again with a larger chunk as specified by 'minimumRequiredBytes'.
    // It returns a promise which resolves a PassThrough stream plus a `fileType` field.
    const streamFileType = async (inputStream, minimumBytes) => {
        const outputStream = new stream.PassThrough();
        const chunk = await readBytes(inputStream, minimumBytes);
        const ft = fileTypeExt(chunk);
        outputStream.write(chunk);
        if (stream.pipeline) {
            stream.pipeline(inputStream, outputStream, () => {});
        } else {
            inputStream.pipe(outputStream);
        }

        if (ft && ft.minimumRequiredBytes) {
            return streamFileType(outputStream, ft.minimumRequiredBytes);
        }

        outputStream.fileType = ft;
        return outputStream;
    };

    return streamFileType(readableStream, module.exports.minimumBytes);
};

