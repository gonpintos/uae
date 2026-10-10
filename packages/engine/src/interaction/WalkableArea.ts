import type { Point } from "../math/Point";
import { containsPoint, type Rectangle } from "./Rectangle";

export interface RectangularWalkableArea extends Rectangle {
    type?: "rectangle";
}

export interface PolygonWalkableArea {
    type: "polygon";
    points: readonly Point[];
}

export type WalkableArea = RectangularWalkableArea | PolygonWalkableArea;

export function containsWalkablePoint(
    area: WalkableArea,
    point: Point
): boolean {
    if (area.type !== "polygon") {
        return containsPoint(area, point);
    }

    if (area.points.length < 3) {
        return false;
    }

    let inside = false;

    for (
        let currentIndex = 0, previousIndex = area.points.length - 1;
        currentIndex < area.points.length;
        previousIndex = currentIndex, currentIndex += 1
    ) {
        const current = area.points[currentIndex];
        const previous = area.points[previousIndex];

        if (!current || !previous) {
            continue;
        }

        if (isPointOnSegment(point, previous, current)) {
            return true;
        }

        const crossesHorizontalRay =
            (current.y > point.y) !== (previous.y > point.y) &&
            point.x < (previous.x - current.x) *
                (point.y - current.y) /
                (previous.y - current.y) + current.x;

        if (crossesHorizontalRay) {
            inside = !inside;
        }
    }

    return inside;
}

function isPointOnSegment(
    point: Point,
    start: Point,
    end: Point
): boolean {
    const crossProduct =
        (point.y - start.y) * (end.x - start.x) -
        (point.x - start.x) * (end.y - start.y);

    if (Math.abs(crossProduct) > 0.000_001) {
        return false;
    }

    return point.x >= Math.min(start.x, end.x) &&
        point.x <= Math.max(start.x, end.x) &&
        point.y >= Math.min(start.y, end.y) &&
        point.y <= Math.max(start.y, end.y);
}
