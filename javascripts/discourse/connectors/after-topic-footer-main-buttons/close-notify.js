import Component from '@glimmer/component';

export default class CloseNotifyComponent extends Component {
    get label() {
        return themePrefix('close_notify.button.label');
    }

    get title() {
        return themePrefix('close_notify.button.title');
    }

    constructor() {
        super(...arguments);
        console.log(arguments);
        console.log(this);
    }
}
