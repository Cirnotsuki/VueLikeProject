// 生成唯一标识，可忽略
function getUUID() {
    let getRandomValues;
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    // find the complete implementation of crypto (msCrypto) on IE11.
    if (typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function') {
        getRandomValues = msCrypto.getRandomValues.bind(msCrypto);
    }

    const SplitNumber = [3, 5, 7, 9];
    const Verify = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

    const HexList = [];

    for (let u = 0; u < 256; ++u) {
        HexList.push((u + 256).toString(16).substr(1));
    }

    return function (simplify) {
        if (!getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        // Create Ramdon Ranges
        const range = getRandomValues(new Uint8Array(16));

        let result = '';

        range[6] = range[6] & 0x0f | 0x40;
        range[8] = range[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

        // Generate UUID
        for (let i = 0; i < 16; ++i) {
            result += HexList[range[i]];
            SplitNumber.indexOf(i) >= 0 && (result += '-');
        }
        // Verify UUID
        if (typeof result === 'string' && Verify.test(result)) {
            return simplify ? result.replace(/-/g, '') : result;
        }
        throw TypeError('Stringified UUID is invalid');
    };
}

window.uuidv4 = getUUID();