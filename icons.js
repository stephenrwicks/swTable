export { icons };
const icons = {
    sliders() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        const topCircle = createCircle('6', '5');
        svg.append(topCircle);
        const topRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        topRect.setAttribute('x', '2');
        topRect.setAttribute('y', '4');
        topRect.setAttribute('width', '20');
        topRect.setAttribute('height', '2');
        topRect.setAttribute('rx', '1');
        svg.append(topRect);
        const middleCircle = createCircle('18', '12');
        svg.append(middleCircle);
        const middleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        middleRect.setAttribute('x', '2');
        middleRect.setAttribute('y', '11');
        middleRect.setAttribute('width', '20');
        middleRect.setAttribute('height', '2');
        middleRect.setAttribute('rx', '1');
        svg.append(middleRect);
        const bottomCircle = createCircle('10', '19');
        svg.append(bottomCircle);
        const bottomRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bottomRect.setAttribute('x', '2');
        bottomRect.setAttribute('y', '18');
        bottomRect.setAttribute('width', '20');
        bottomRect.setAttribute('height', '2');
        bottomRect.setAttribute('rx', '1');
        svg.append(bottomRect);
        svg.classList.add('sw-table-icon', 'sw-table-sliders');
        return svg;
    }
};
// Function to create a single circle
const createCircle = (cx, cy) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '2');
    circle.setAttribute('fill', 'currentColor');
    return circle;
};
