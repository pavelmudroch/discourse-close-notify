import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { addObserver, removeObserver } from '@ember/object/observers';
import { ajax } from 'discourse/lib/ajax';
import { next } from '@ember/runloop';

export default class CloseNotifyComponent extends Component {
    @tracked icon;
    @tracked title;
    @tracked label;

    constructor() {
        super(...arguments);
        this.#updateFromTopicStatus();
        addObserver(
            this.getTopic(),
            'closed',
            this,
            this.#updateFromTopicStatus,
        );
    }

    willDestroy() {
        removeObserver(
            this.getTopic(),
            'closed',
            this,
            this.#updateFromTopicStatus,
        );
    }

    getTopic() {
        return this.args.outletArgs.topic;
    }

    @action
    async do() {
        const topic = this.getTopic();
        const closed = topic.closed;
        const response = await ajax(`/t/${topic.id}/status`, {
            type: 'PUT',
            data: { status: 'closed', enabled: closed ? 'false' : 'true' },
        });
        next(() => DiscourseURL.routeTo(topic.url));
    }

    #updateFromTopicStatus() {
        const topic = this.getTopic();
        const closed = topic.closed;
        const buttonState = closed ? 'open' : 'close';
        this.icon = closed ? 'unlock' : 'lock';
        this.title = themePrefix(`close_notify.button.${buttonState}.title`);
        this.label = themePrefix(`close_notify.button.${buttonState}.label`);
    }
}
