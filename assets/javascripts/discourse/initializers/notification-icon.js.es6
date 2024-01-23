import { withPluginApi } from 'discourse/lib/plugin-api';
import I18n from 'I18n';

const STATUS_OPEN = 'notify.open';
const STATUS_CLOSE = 'notify.close';

export default {
    name: 'replace-notification-icon',
    initialize: () => {
        document.body.classList.add(`locale-${I18n.locale}`);
        withPluginApi('1.0.0', (api) => {
            api.replaceIcon('notification.notify.open', 'unlock-alt');
            api.replaceIcon('notification.notify.close', 'lock');
            api.registerNotificationTypeRenderer(
                'custom',
                (NotificationTypeBase) => {
                    return class extends NotificationTypeBase {
                        get notifyType() {
                            return this.notification.data.message ?? 'custom';
                        }

                        get icon() {
                            const type = this.notifyType;
                            switch (type) {
                                case STATUS_CLOSE:
                                    return 'lock';
                                case STATUS_OPEN:
                                    return 'unlock-alt';
                                default:
                                    return `notification.${type}`;
                            }
                        }

                        get label() {
                            const type = this.notifyType;
                            switch (type) {
                                case STATUS_CLOSE:
                                    return `${this.username} ${I18n.t(
                                        'close_notify.notification.close',
                                    )}`;
                                case STATUS_OPEN:
                                    return `${this.username} ${I18n.t(
                                        'close_notify.notification.open',
                                    )}`;
                                default:
                                    return this.username;
                            }
                        }
                    };
                },
            );
        });
    },
};
