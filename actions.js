export { Actions };
class Actions {
    div = document.createElement('div');
    constructor() {
        this.div.classList.add('sw-table-actions-div');
    }
    render(settings) {
        this.div.replaceChildren();
    }
}
