# frozen_string_literal: true

# name: discourse-close-notify
# about: Simple plugin to notify users about closed topic
# version: 0.1.0
# authors: Pavel Mudroch
# url: https://github.com/pavelmudroch/discourse-close-notify

enabled_site_setting :notify_enabled

register_asset 'stylesheets/notify.scss'

def is_topic_from_enabled_category(topic)
    SiteSetting.notify_enabled_categories.blank? || SiteSetting.notify_enabled_categories.split('|').include?(topic.category_id.to_s)
end

def get_notification_levels
    case SiteSetting.notify_watch_level
    when 'normal'
        return [
            TopicUser.notification_levels[:normal],
            TopicUser.notification_levels[:tracking],
            TopicUser.notification_levels[:watching]
    ]
    when 'tracking'
        return [
            TopicUser.notification_levels[:tracking],
            TopicUser.notification_levels[:watching]
        ]
    end

    [TopicUser.notification_levels[:watching]]
end

def notify_user(user, topic, data)
    puts '[notify_close] :: notify_user :: user_id: ' + user.id.to_s + ' topic_id: ' + topic.id.to_s + ' notification_type: ' + Notification.types[:custom].to_s
    Notification.create!(
        notification_type: Notification.types[:custom],
        user_id: user.id,
        topic_id: topic.id,
        post_number: 1,
        data: data
    )
end

def notify_users(owner, topic, status)
    data = {
        topic_title: topic.title,
        display_username: owner.username,
        message: status,
    }.to_json
    puts '[notify_close] :: notify_users :: begin :: data: ' + data.to_s
    puts '[notify_close] :: notify_users :: notification_levels: ' + get_notification_levels.inspect
    topic.topic_users.where(notification_level: get_notification_levels).each do |tu|
        puts '[notify_close] :: notify_users :: tu.user_id: ' + tu.user_id.to_s + ' == ' + owner.id.to_s
        break if tu.user_id == owner.id
        notify_user(tu.user, topic, data)
    end
end

def process_post_event(post)
    puts '[notify_close] :: process_post_event :: begin :: ' + post.post_type.to_s + ' == ' + Post.types[:small_action].to_s
    return if post.post_type != Post.types[:small_action]

    status = nil
    case post.action_code
    when 'closed.enabled'
        puts '[notify_close] :: process_post_event :: action: closed.enabled' + ' condition: ' + SiteSetting.notify_on_close.to_s
        return unless SiteSetting.notify_on_close
        status = 'close'
    when 'closed.disabled'
        puts '[notify_close] :: process_post_event :: action: closed.disabled' + ' condition: ' + SiteSetting.notify_on_open.to_s
        return unless SiteSetting.notify_on_open
        status = 'open'
    end

    owner = post.user
    topic = post.topic

    puts '[notify_close] :: process_post_event :: category-condition: ' + is_topic_from_enabled_category(topic).to_s
    return unless is_topic_from_enabled_category(post.topic)

    notify_users(owner, topic, status)
end

after_initialize do
    DiscourseEvent.on(:post_created) do |post, opts, user|
        begin
            puts '[notify_close] :: on "post_created" :: begin'
            process_post_event(post)
            puts '[notify_close] :: on "post_created" :: end'
        rescue => e
            puts '[notify_close] :: on "post_created" :: error: ' + e.message
        end
    end

    DiscourseEvent.on(:post_edited) do |post, topic_change|
        begin
            puts '[notify_close] :: on "post_edited" :: begin'
            process_post_event(post)
            puts '[notify_close] :: on "post_edited" :: end'
        rescue => e
            puts '[notify_close] :: on "post_edited" :: error: ' + e.message
        end
    end
end