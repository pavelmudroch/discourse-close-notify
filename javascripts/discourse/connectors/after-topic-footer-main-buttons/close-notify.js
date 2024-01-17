import Component from '@glimmer/component';
import I18n from 'I18n';

export default class TopicStatusFilterComponenent extends Component {
    get label() {
        return I18n.t(themePrefix('close_notify.button.label'));
    }

    get title() {
        return I18n.t(themePrefix('close_notify.button.title'));
    }
}
