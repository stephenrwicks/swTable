import { css } from './css.js';
export { icons };
const icons = {
    magnifyingGlass(): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        circle.setAttribute('cx', '10');
        circle.setAttribute('cy', '10');
        circle.setAttribute('r', '7');
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('fill', 'none');
        line.setAttribute('x1', '14');
        line.setAttribute('y1', '14');
        line.setAttribute('x2', '20');
        line.setAttribute('y2', '20');
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '2');
        svg.append(circle, line);
        svg.classList.add(css.icon);
        return svg;
    },
    ellipsis(): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.appendChild(createCircle('12', '6')); // Top dot
        svg.appendChild(createCircle('12', '12')); // Middle dot
        svg.appendChild(createCircle('12', '18')); // Bottom dot
        svg.classList.add(css.icon);
        return svg;
    },
    chevron(): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('fill', 'black');
        path.setAttribute('d', 'M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z');
        svg.append(path);
        svg.classList.add(css.icon);
        return svg;
    },
} as const;

// Function to create a single circle
const createCircle = (cx: string, cy: string) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '2');
    circle.setAttribute('fill', 'currentColor');
    return circle;
};