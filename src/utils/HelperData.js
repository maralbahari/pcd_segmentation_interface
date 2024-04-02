import { LabelClass } from "../selection";

/**
 * 
 * @returns {LabelClass[]}
 */
export function datasetLabelClasses() {
    const c1 = new LabelClass(1, 'car', 'pink');
    const c2 = new LabelClass(2, 'lamp post', 'purple');
    const c3 = new LabelClass(3, 'wall', 'green');

    return [c1, c2, c3];
}
