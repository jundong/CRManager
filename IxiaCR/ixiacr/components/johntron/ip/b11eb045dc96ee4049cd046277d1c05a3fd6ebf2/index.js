var v4 = new RegExp(/^(\d{1,3}\.){3}\d{1,3}$/),
    v6 = new RegExp(/^[a-f0-9:]+$/i);

function IP(addr) {
    if (addr instanceof IP) {
        return addr;
    }

    var self = this;

    self.addr = addr;
    self.tets = []; // octets (v4) or hextets (v6)

    if (v4.test(addr)) {
        addr.split(/\./g).forEach(function (octet) {
            octet = parseInt(octet, 10);
            self.tets.push(octet);
        });
    } else if (v6.test(addr)) {
        IP.normalize_v6(addr).forEach(function (hextet) {
            hextet = parseInt(hextet, 16);
            self.tets.push(hextet >> 8); // First word
            self.tets.push(hextet & 0xff); // Second word
        });
    }
}


/**
 * Decompresses zeros
 * @param addr
 * @return {Array} of hextets in base16
 */
IP.normalize_v6 = function (addr) {
    addr = addr.split(/::/g, 2); // Zero-compression - split at double-colon

    // Break into hextets
    var head = (addr[0] || '').split(/:/g, 8),
        tail = (addr[1] || '').split(/:/g, 8);

    // Remove '' elements from tail
    tail = tail.filter(function (el) { return el.length; });

    // Decompress zero hextets
    if (tail.length === 0) {
        // Nothing after ::, so pad tail with empty hextets
        while (head.length < 8) {
            head.push('0000');
        }
    } else if (head.length === 0) {
        // Nothing before ::, so prefix tail with empty hextets
        while (tail.length < 8) {
            tail.unshift('0000');
        }
    } else {
        // Has head and tail, so just pad to proper length
        while (head.length + tail.length < 8) {
            head.push('0000');
        }
    }

    return head.concat(tail);
};

IP.prototype.version = function () {
    return this.tets.length > 4 ? 6 : 4;
};

IP.prototype.equal = function (test) {
    test = IP(test);

    if (this.tets.length !== test.tets.length) {
        throw new Error('Cannot compare v4 and v6');
    }

    return this.tets.every(function (tet, i) {
        return tet === test.tets[i];
    });
};

IP.prototype.greater = function (test) {
    test = IP(test);

    for (var i = 0; i < this.tets.length; i++) {
        if (this.tets[i] > test.tets[i]) {
            return true; // Short-circuit
        } else if (this.tets[i] < test.tets[i]) {
            return false; // Short-circuit
        }
    }

    return false;
};

IP.prototype.less = function (test) {
    test = IP(test);

    for (var i = 0; i < this.tets.length; i++) {
        if (this.tets[i] < test.tets[i]) {
            return true; // Short-circuit
        } else if (this.tets[i] > test.tets[i]) {
            return false; // Short-circuit
        }
    }

    return false;
};

IP.prototype.lessOrEqual = function (test) {
	return this.less(test) || this.equal(test);
};

IP.prototype.greaterOrEqual = function (test) {
	return this.greater(test) || this.equal(test);
};

module.exports = IP;

//var tests = [
//    // Format: method, first operand, second operand, expected value
//
//    // v4
//    // Basics
//    ['equal', '0.0.0.0', '0.0.0.0', true],
//    ['equal', '255.255.255.255', '255.255.255.255', true],
//    ['equal', '255.255.255.255', '0.0.0.0', false],
//
//    // Verify offsets
//    ['equal', '255.0.0.0', '255.0.0.0', true],
//    ['equal', '0.0.255.0', '0.0.255.0', true],
//    ['equal', '0.0.0.255', '0.0.0.255', true],
//    ['equal', '0.0.0.0', '0.0.255.0', false],
//    ['equal', '255.0.0.0', '0.0.0.255', false],
//
//    // Greater
//    ['greater', '225.0.0.1', '225.0.0.0', true],
//    ['greater', '255.0.0.0', '0.0.0.0', true],
//    ['greater', '255.255.255.255', '255.255.0.255', true],
//    ['greater', '0.0.0.255', '0.0.0.0', true],
//    ['greater', '0.0.0.0', '255.0.0.0', false],
//    ['greater', '255.0.255.255', '255.255.255.255', false],
//
//    // Less
//    ['less', '225.0.0.0', '225.0.0.1', true],
//    ['less', '0.0.0.0', '255.0.0.0', true],
//    ['less', '0.0.0.0', '0.0.0.255', true],
//    ['less', '255.255.255.0', '255.255.255.255', true],
//    ['less', '255.255.0.255', '255.255.255.255', true],
//    ['less', '255.0.0.0', '0.0.0.0', false],
//    ['less', '255.255.255.255', '255.0.255.255', false],
//
//    // v6
//    // Basics
//    ['equal', '0:0:0:0:0:0:0:0', '0:0:0:0:0:0:0:0', true],
//    ['equal', 'ff:ff:ff:ff:ff:ff:ff:ff', 'ff:ff:ff:ff:ff:ff:ff:ff', true],
//
//    // Zero decompression
//    ['equal', '::11ff', '::11ff', true],
//    ['equal', '11ff::', '11ff::', true],
//    ['equal', 'ff11::', '11ff::', false],
//    ['equal', '11ff::11ff', '11ff::11ff', true],
//    ['equal', 'ff11::11ff', '11ff::11ff', false],
//    ['equal', '11ff:11ff::11ff', '11ff:11ff::11ff', true],
//    ['equal', '11ff::11ff:11ff', '11ff::11ff:11ff', true],
//    ['equal', '11ff::ff11:11ff', '11ff::11ff:11ff', false],
//    ['equal', '11ff:11ff::11ff:11ff', '11ff:11ff::11ff:11ff', true],
//    ['equal', 'ff11:11ff::11ff:11ff', '11ff:11ff::11ff:11ff', false],
//    ['equal', '11ff:11ff::11ff:11ff', '11ff:11ff::ff11:11ff', false],
//
//    // Verify offsets
//    ['equal', 'ff11:11ff:11ff:11ff:11ff:11ff:11ff:11ff', 'ff11:11ff:11ff:11ff:11ff:11ff:11ff:11ff', true], // first
//    ['equal', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:ff11', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:ff11', true], // last
//    ['equal', '11ff:11ff:11ff:11ff:11ff:ff11:11ff:11ff', '11ff:11ff:11ff:11ff:11ff:ff11:11ff:11ff', true], // middle
//    ['equal', 'ff11:11ff:11ff:11ff:11ff:11ff:11ff:11ff', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:11ff', false], // first
//    ['equal', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:11ff', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:ff11', false], // last
//    ['equal', '11ff:11ff:11ff:ff11:11ff:11ff:11ff:11ff', '11ff:11ff:11ff:11ff:11ff:11ff:11ff:11ff', false], // middle
//
//    // Greater
//    ['greater', 'ff11::', '11ff::', true],
//    ['greater', 'ff11:ff11::ff11', 'ff11:11ff::ff11', true],
//    ['greater', 'ff11::ff11:ff11', 'ff11::11ff:ff11', true],
//    ['greater', 'ff11:11ff::ff11', 'ff11:ff11::ff11', false],
//    ['greater', 'ff11::11ff:ff11', 'ff11::ff11:ff11', false],
//
//    // Less
//    ['less', '11ff::', 'ff11::', true],
//    ['less', 'ff11:11ff::ff11', 'ff11:ff11::ff11', true],
//    ['less', 'ff11::11ff:ff11', 'ff11::ff11:ff11', true],
//    ['less', 'ff11:ff11::ff11', 'ff11:11ff::ff11', false],
//    ['less', 'ff11::ff11:ff11', 'ff11::11ff:ff11', false]
//];
//
//tests.forEach(function (test) {
//    var fn = test[0],
//        a = new IP(test[1]),
//        b = new IP(test[2]),
//        actual = a[fn](b),
//        expected = test[3];
//
////    console.log(test[1], fn, test[2], expected, actual === expected);
//    if (actual !== expected) {
//        console.log('Fail:', test[1], fn, test[2], actual, expected);
//    }
//});
