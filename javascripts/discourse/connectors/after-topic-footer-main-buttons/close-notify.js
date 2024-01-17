import Component from '@glimmer/component';
import I18n from 'I18n';

export default class TopicStatusFilterComponenent extends Component {
    constructor() {
        super(...arguments);
        console.log(themePrefix('close_notify.button.label'));
        console.log(I18n.t('close_notify.button.label'));
        console.log(I18n.t(themePrefix('close_notify.button.label')));
    }
}
