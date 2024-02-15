# frozen_string_literal: true

# name: discourse-close-notify
# about: Simple plugin to notify users about closed topic
# version: 0.3.2
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
    when 'watching', 'watching_first_post'
        return [
            TopicUser.notification_levels[:tracking],
            TopicUser.notification_levels[:watching],
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
        message: 'notify.' + status,
    }.to_json

    notified_user_ids = Set.new
    notification_levels = get_notification_levels

    topic.topic_users.where(notification_level: notification_levels).each do |tu|
        puts '[notify_close] :: notify_users :: tu.user_id: ' + tu.user_id.to_s + ' == ' + owner.id.to_s
        next if tu.user_id == owner.id
        notify_user(tu.user, topic, data)
        notified_user_ids.add(tu.user_id)
    end

    if SiteSetting.notify_watch_level == 'watching_first_post'
        notification_levels.push(CategoryUser.notification_levels[:watching_first_post])
    end

    CategoryUser.where(category: topic.category, notification_level: notification_levels).each do |cu|
        next if cu.user_id == owner.id
        next if notified_user_ids.include?(cu.user_id)
        notify_user(cu.user, topic, data)
    end
end

def process_post_event(post)
    return if post.post_type != Post.types[:small_action]

    status = nil
    case post.action_code
    when 'closed.enabled'
        return unless SiteSetting.notify_on_close
        status = 'close'
    when 'closed.disabled'
        return unless SiteSetting.notify_on_open
        status = 'open'
    end

    owner = post.user
    topic = post.topic

    return unless is_topic_from_enabled_category(post.topic)

    notify_users(owner, topic, status)
end

after_initialize do
    DiscourseEvent.on(:post_created) do |post, opts, user|
        begin
            process_post_event(post)
        rescue => e
            puts '[notify_close] :: on "post_created" :: error: ' + e.message
        end
    end

    DiscourseEvent.on(:post_edited) do |post, topic_change|
        begin
            process_post_event(post)
        rescue => e
            puts '[notify_close] :: on "post_edited" :: error: ' + e.message
        end
    end
end