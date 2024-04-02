import _ from 'lodash';

/**
 * Checks that the input value is numeric, and throws an error otherwise.
 * 
 * @param {number} x The input value.
 * @throws {Error} If the input is not numeric.
 */
export function assertIsNumeric(x) {
    if (typeof x !== 'number') throw new Error('The input is not numeric');
}

/**
 * Same as {@link Math.sign}, except that `-0` returns `-1`, `+0` returns `1`,
 * and type-checking is enabled.
 * 
 * @param {number} x The numeric expression to test.
 * @returns {number} A number representing the sign of the argument.
 * @throws {Error} If the input is not numeric.
 */
export function sign1(x) {
    assertIsNumeric(x);

    if (Object.is(x, -0)) return -1;
    if (Object.is(x, +0)) return 1;

    return Math.sign(x);
}

/**
 * A mathematical constant equivalent to 2 * {@link Math.PI}.
 */
export const TAU = 2 * Math.PI;

/**
 * Normalizes an angle such that it falls within the interval `(-pi, pi)`.
 * 
 * @param {number} angle The input angle.
 * @returns {number} The normalized input angle.
 */
export function normalizeAngle(angle) {
    assertIsNumeric(angle);

    // https://stackoverflow.com/questions/2320986/easy-way-to-keeping-angles-between-179-and-180-degrees
    return angle - Math.ceil(angle / TAU - 0.5) * TAU;
}

/**
 * Finds the (population) standard deviation of a set of values.
 * 
 * @param {ReadonlyArray<number>} values The values from which to compute the standard deviation.
 * @param {?number} precomputedMean The precomputed mean of the provided values.
 * If not provided, it is computed automatically.
 * @returns {number} The standard deviation of the given values.
 * @throws {Error} If the input array is empty, or if an element is not numeric.
 */
export function getStd(values, precomputedMean = null) {
    if (values.length === 0) throw new Error('Cannot compute standard deviation of empty array');

    const mean = precomputedMean ?? _.mean(values);

    const result = values.reduce(({ ssd, count }, v) => {
        assertIsNumeric(v);

        const diff = v - mean;
        return { ssd: ssd + diff * diff, count: count + 1 };
    }, { ssd: 0, count: 0 });

    return Math.sqrt(result.ssd / result.count);
}

/**
 * 
 * @param {THREE.Vector2} center
 * @param {number} radius
 * @param {THREE.Vector3} point
 * @returns {boolean} 
 */
export function isPointInCircle(center, radius, point) {
    return ((Math.pow(((point.x) - (center.x)), 2) + Math.pow(((point.y) - (center.y)),2)) < Math.pow(radius,2));
}

/**
 * 
 * @param {THREE.Vector2} pointA first point of the polygon.
 * @param {THREE.Vector2} pointB second point of the polygon.
 * @param {THREE.Vector3} queryPoint the point to check.
 * @returns {number}
 */
function substitutePointOnLine(pointA, pointB, queryPoint) {
    return ((queryPoint.y - pointA.y) * (pointB.x - pointA.x)) - 
            ((queryPoint.x - pointA.x) * (pointB.y - pointA.y));
}

/**
 * 
 * @param {THREE.Vector3} point 
 * @param {THREE.Vector2[]} polygon
 * @returns {boolean}
 */
export function isPointInPolygon(point, polygon) {
    let windingNum = 0; 
    let pointOnLine = 0;

    for (let i = 0; i <  polygon.length ; i ++ ) {
        pointOnLine = substitutePointOnLine(polygon[i], polygon[(i+1) % polygon.length ], point);

        if (pointOnLine == 0.0) {
            return false;
        }

        if (polygon[i].y <= point.y) {
            if (polygon[(i+1) % polygon.length].y > point.y) {
                if (pointOnLine > 0) {
                    windingNum++;
                }
            }
        } else {
            if (polygon[(i+1) % polygon.length].y < point.y) {
                if (pointOnLine < 0) {
                    windingNum--;
                }
            }
        }
    }

    return windingNum !==0;
}