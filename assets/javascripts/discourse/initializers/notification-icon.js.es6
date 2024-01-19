import { withPluginApi } from 'discourse/lib/plugin-api';
import I18n from 'I18n';

export default {
    name: 'replace-notification-icon',
    initialize: () => {
        document.body.classList.add(`locale-${I18n.locale}`);
        withPluginApi('1.0.0', (api) => {
            api.replaceIcon('notification.open', 'unlock-alt');
            api.replaceIcon('notification.close', 'lock');
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
                                case 'close':
                                    return 'lock';
                                case 'open':
                                    return 'unlock-alt';
                                default:
                                    return `notification.${type}`;
                            }
                        }

                        get label() {
                            const type = this.notifyType;
                            switch (type) {
                                case 'close':
                                    return `${this.username} ${I18n.t(
                                        'close_notify.notification.close',
                                    )}`;
                                case 'open':
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

            // api.modifyClass('component:notification-type-base', {
            //     get icon() {
            //         return 'bell';
            //     },
            // });
        });
    },
};
