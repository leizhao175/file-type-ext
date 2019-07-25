# file-type-ext
An extension to `file-type` lib with additional supports for .doc, .xls, .ppt

For none ms office files, it works same as `file-type`, but for these ancient file types, it provides additional check based on http://fileformats.archiveteam.org/wiki/Microsoft_Compound_File.

# Install
`$ npm install file-type-ext`

# Usage
From a **stream**, `file-type-ext` uses the same interface as `file-type`
```
const stream = require('stream');
const fs = require('fs');
const fileType = require('file-type-ext');

(async () => {
    const read = fs.createReadStream('sample.doc');
    const stream = await fileType.stream(read);

    console.log(stream.fileType);
    //=> {ext: 'doc', mime: 'application/msword'}

    const write = fs.createWriteStream(`output.doc`);
    stream.pipe(write);
})();
```

From a chunk **buffer**, since the `CLSID`, which is required to identify the ancient ms office file types, may located at anywhere in the file, it requires to load almost the entire file.

Therefore, if you would like to use the chunk buffer method, there are two options:

1, load the entire file
```
const readChunk = require('read-chunk');
const fs = require("fs");
const fileType = require('file-type-ext');

const stats = fs.statSync("sample.doc");
const buffer = readChunk.sync('sample.doc', 0, stats.size);

var type = fileType(buffer);
console.log(type);
//=> {ext: 'doc', mime: 'application/msword'}

```

2, or, check it twice with a small buffer:
```
const readChunk = require('read-chunk');
const fileType = require('file-type-ext');

// the first part is same as `file-type`:
var buffer = readChunk.sync('sample.doc', 0, fileType.minimumBytes);
var type = fileType(buffer);

console.log(type);
//=> { ext: 'msi', mime: 'application/x-msi', minimumRequiredBytes: 12384 }

// if the file is one of the ancient ms office file, and the buffer provided is not enough to identify the type, an extra field `minimumRequiredBytes` will be returned.

if (type.minimumRequiredBytes) {
  buffer = readChunk.sync('sample.doc', 0, type.minimumRequiredBytes);
  type = fileType(buffer);
}
console.log(type);
//=> { ext: 'doc', mime: 'application/msword' }
```
