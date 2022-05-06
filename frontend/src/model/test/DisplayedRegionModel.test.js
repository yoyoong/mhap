import { CHROMOSOMES } from './toyRegion';
import DisplayedRegionModel from '../DisplayedRegionModel';
import NavigationContext from '../NavigationContext';

function expectRegion(instance, start, end) {
    // For a less flaky test, I would want to manually compare just the `start` and `end` props, but done this way,
    // failure messages are more readable.
    expect(instance.getContextCoordinates()).toEqual({start: start, end: end});
}

const NAV_CONTEXT = new NavigationContext("Gee, gnome!", CHROMOSOMES);
const NAV_CONTEXT_LENGTH = NAV_CONTEXT.getTotalBases();

var instance;
beforeEach(() => {
    instance = new DisplayedRegionModel(NAV_CONTEXT);
});

describe("constructor", () => {
    it("by default sets view region to the entire navigation context", () => {
        expectRegion(instance, 0, NAV_CONTEXT_LENGTH);
    })

    it("sets initial view region correctly", () => {
        let instance2 = new DisplayedRegionModel(NAV_CONTEXT, 10, 20);
        expectRegion(instance2, 10, 20);
    });
});

/*
 * Test setRegion() first since a lot of our other tests rely on it.
 */
describe("setRegion()", () => {
    it("fails if end is less than start", () => {
        expect(() => instance.setRegion(1, 0)).toThrow(RangeError);
    });

    it("makes sure the region stays within bounds of the genome", () => {
        instance.setRegion(-1, 100);
        expectRegion(instance, 0, NAV_CONTEXT_LENGTH);

        instance.setRegion(100, 150);
        expectRegion(instance, 0, NAV_CONTEXT_LENGTH);

        instance.setRegion(-150, -100);
        expectRegion(instance, 0, NAV_CONTEXT_LENGTH);
    });

    it("rounds the arguments", () => {
        instance.setRegion(1.1, 1.9);
        expectRegion(instance, 1, 2);
    });

    it("preserves input width", () => {
        instance.setRegion(-5, 10);
        expectRegion(instance, 0, 15);

        instance.setRegion(25, 35);
        expectRegion(instance, 20, NAV_CONTEXT_LENGTH);

        instance.setRegion(40, 45);
        expectRegion(instance, 25, NAV_CONTEXT_LENGTH);
    })
});

describe("clone()", () => {
    it("makes a clone, and modifying the clone does not modify the original", () => {
        instance.setRegion(20, NAV_CONTEXT_LENGTH);
        let clone = instance.clone();
        expect(clone).not.toBe(instance);
        clone.setRegion(0, 10);
        expectRegion(clone, 0, 10);
        expectRegion(instance, 20, NAV_CONTEXT_LENGTH);
    });
});

describe("pan()", () => {
    it("adds a positive offset to view region", () => {
        instance.setRegion(1, 2);
        instance.pan(1);
        expectRegion(instance, 2, 3);
    });

    it("adds a negative offset to view region", () => {
        instance.setRegion(2, 3);
        instance.pan(-1);
        expectRegion(instance, 1, 2);
    });

    it("does not pan off the genome, and preserves region width", () => {
        instance.setRegion(2, 4);
        instance.pan(-10);
        expectRegion(instance, 0, 2);
    });
});

describe("zoom()", () => {
    it("fails if given a zoom factor 0 or less", () => {
        expect(() => instance.zoom(0)).toThrow(RangeError);
        expect(() => instance.zoom(-1)).toThrow(RangeError);
    });

    it("can zoom in and out", () => {
        instance.setRegion(10, 20);
        instance.zoom(2);
        expectRegion(instance, 5, 25);

        instance.zoom(0.5);
        expectRegion(instance, 10, 20);
    });

    it("can zoom on different focal points", () => {
        instance.setRegion(10, 15);
        instance.zoom(2, 0);
        expectRegion(instance, 10, 20);

        instance.zoom(0.5, 1);
        expectRegion(instance, 15, 20);
    });

    it("stays within the genome when zooming out", () => {
        instance.setRegion(0, 10);
        instance.zoom(2);
        expectRegion(instance, 0, 20);
    });
});
