import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { addObserver, removeObserver } from '@ember/object/observers';

function parseIds(ids) {
    const parseIds = ids
        .split('|')
        .map((c) => parseInt(c, 10))
        .filter(isFinite);
    if (parseIds.length === 0) return null;

    return parseIds;
}

export default class CloseNotifyComponent extends Component {
    @service siteSettings;
    @tracked shouldRender = false;
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
        const enabledCategories = parseIds(
            this.siteSettings.notify_enabled_categories,
        );
        const categoryId = this.getTopic().category_id;
        this.shouldRender = enabledCategories?.includes(categoryId) ?? true;
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
        try {
            topic.toggleStatus('closed').then((result) => {
                topic.set('topic_status_update', result.topic_status_update);
            });
        } catch (e) {
            console.error(e);
        }
    }

    #updateFromTopicStatus() {
        const topic = this.getTopic();
        const closed = topic.closed;
        const buttonState = closed ? 'open' : 'close';
        this.icon = closed ? 'unlock' : 'lock';
        this.title = `close_notify.button.${buttonState}.title`;
        this.label = `close_notify.button.${buttonState}.label`;
    }
}
