"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimumBytes = exports.fileTypeExt = void 0;
var file_type_1 = require("file-type");
exports.fileTypeExt = function (input) {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
        throw new TypeError("Expected the `input` argument to be of type `Uint8Array` or `Buffer` or `ArrayBuffer`, got `" + typeof input + "`");
    }
    var buffer = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!(buffer && buffer.length > 1)) {
        return;
    }
    var check = function (header, options) {
        for (var i = 0; i < header.length; i++) {
            // If a bitmask is set
            if (options.mask) {
                // If header doesn't equal `buf` with bits masked off
                if (header[i] !== (options.mask[i] & buffer[i + options.offset])) {
                    return false;
                }
            }
            else if (header[i] !== buffer[i + options.offset]) {
                return false;
            }
        }
        return true;
    };
    var type = file_type_1.default(buffer);
    if (type == null || (type && type.ext === 'msi')) {
        // Use CLSIDs to check old Microsoft Office file types: .doc, .xls, .ppt
        // Ref: http://fileformats.archiveteam.org/wiki/Microsoft_Compound_File
        var sectorSize = 1 << buffer[30];
        var index = (buffer[49] * 256) + buffer[48];
        index = ((index + 1) * sectorSize) + 80;
        console.log("INDEX", index);
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
        if (check([0x06, 0x09, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], { offset: index })) {
            return {
                ext: 'doc',
                mime: 'application/msword'
            };
        }
        if (check([0x10, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], { offset: index })) {
            return {
                ext: 'xls',
                mime: 'application/vnd.ms-excel'
            };
        }
        if (check([0x20, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], { offset: index })) {
            return {
                ext: 'xls',
                mime: 'application/vnd.ms-excel'
            };
        }
        if (check([0x10, 0x8D, 0x81, 0x64, 0x9B, 0x4F, 0xCF, 0x11, 0x86, 0xEA, 0x00, 0xAA, 0x00, 0xB9, 0x29, 0xE8], { offset: index })) {
            return {
                ext: 'ppt',
                mime: 'application/vnd.ms-powerpoint'
            };
        }
        if (type && type.ext === "msi") {
            return {
                ext: 'msi',
                mime: 'application/x-msi'
            };
        }
    }
    return type;
};
exports.minimumBytes = file_type_1.default.minimumBytes;
exports.fileTypeExt.stream = function (readableStream) {
    var readBytes = function (rs, num) {
        if (num === void 0) { num = 0; }
        return rs.read(num) || new Promise(function (resolve, reject) {
            var onEnd;
            var onError;
            rs.once('end', onEnd = function () { return resolve(rs.read()); });
            rs.once('error', onError = function (e) { return reject(e); });
            rs.once('readable', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            rs.removeListener('end', onEnd);
                            rs.removeListener('error', onError);
                            _a = resolve;
                            return [4 /*yield*/, readBytes(rs, num)];
                        case 1:
                            _a.apply(void 0, [_b.sent()]);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    // Using `eval` to work around issues when bundling with Webpack
    var stream = eval('require')('stream'); // eslint-disable-line no-eval
    // A recursive function will first try to check the file type by using the first 'minimumBytes' chunk.
    // If the first 'minimumBytes' chunk is not enough to identify the file type, e.g. .doc, it will try it again with a larger chunk as specified by 'minimumRequiredBytes'.
    // It returns a promise which resolves a PassThrough stream plus a `fileType` field.
    var streamFileType = function (inputStream, minimumBytes) { return __awaiter(void 0, void 0, void 0, function () {
        var outputStream, chunk, ft;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputStream = new stream.PassThrough();
                    return [4 /*yield*/, readBytes(inputStream, minimumBytes)];
                case 1:
                    chunk = _a.sent();
                    ft = exports.fileTypeExt(chunk);
                    outputStream.write(chunk);
                    if (stream.pipeline) {
                        stream.pipeline(inputStream, outputStream, function () { return ({}); });
                    }
                    else {
                        inputStream.pipe(outputStream);
                    }
                    if (ft && ft.minimumRequiredBytes) {
                        return [2 /*return*/, streamFileType(outputStream, ft.minimumRequiredBytes)];
                    }
                    outputStream.fileType = ft;
                    return [2 /*return*/, outputStream];
            }
        });
    }); };
    return streamFileType(readableStream, exports.minimumBytes);
};
//# sourceMappingURL=index.js.map