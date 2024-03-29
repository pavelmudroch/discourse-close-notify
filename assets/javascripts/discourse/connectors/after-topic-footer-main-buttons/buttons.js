import { action } from "@ember/object";
import { addObserver, removeObserver } from "@ember/object/observers";
import { inject as service } from "@ember/service";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";

function parseIds(ids) {
	const parseIds = ids
		.split("|")
		.map((c) => Number.parseInt(c, 10))
		.filter(Number.isFinite);
	if (parseIds.length === 0) return null;

	return parseIds;
}

function createObserversForTopic(topic, target) {
	addObserver(topic, "closed", target, target.updateFromTopicStatus);
	addObserver(topic, "tags", target, target.updateFromTopicStatus);

	return {
		remove: () => {
			removeObserver(topic, "closed", target, target.updateFromTopicStatus);
			removeObserver(topic, "tags", target, target.updateFromTopicStatus);
		},
	};
}

export default class CloseNotifyComponent extends Component {
	@service siteSettings;
	@service appEvents;

	@tracked shouldRender = false;
	@tracked closed;
	@tracked closeIcon;
	@tracked closeTitle;
	@tracked closeLabel;
	@tracked deployIcon;
	@tracked deployTitle;
	@tracked deployLabel;
	@tracked deployClass;

	#observers;

	constructor(...args) {
		super(...args);
		this.updateFromTopicStatus();
		this.#observers = createObserversForTopic(this.getTopic(), this);
		const enabledCategories = parseIds(
			this.siteSettings.notify_enabled_categories,
		);
		const categoryId = this.getTopic().category_id;
		this.shouldRender = enabledCategories?.includes(categoryId) ?? true;
		this.appEvents.on("page:changed", this, this.#onTopicChange);
	}

	willDestroy() {
		this.#observers.remove();
		this.appEvents.off("page:changed", this, this.#onTopicChange);
	}

	getTopic() {
		return this.args.outletArgs.topic;
	}

	isDeployed() {
		const topic = this.getTopic();
		if (!topic) return false;

		return topic.tags?.includes(this.siteSettings.notify_deployed_tag) ?? false;
	}

	@action
	async doClose() {
		const topic = this.getTopic();
		try {
			const result = await topic.toggleStatus("closed");
			await topic.set("topic_status_update", result.topic_status_update);
			// topic.toggleStatus('closed').then((result) => {
			//     topic.set('topic_status_update', result.topic_status_update);
			// });
		} catch (e) {
			console.error(e);
		}
	}

	@action
	async doDeploy() {
		const topic = this.getTopic();
		const tags = this.isDeployed()
			? topic.tags.filter((t) => t !== this.siteSettings.notify_deployed_tag)
			: [...topic.tags, this.siteSettings.notify_deployed_tag];

		console.log("#setting tags:", tags.join(","));
		await ajax(`/t/-/${topic.id}.json`, {
			type: "PUT",
			data: {
				tags,
			},
		});
		// topic.tags = tags;
	}

	updateFromTopicStatus() {
		const topic = this.getTopic();
		const closed = topic.closed;
		this.closed = closed;
		const buttonState = closed ? "open" : "close";
		this.closeIcon = closed ? "unlock" : "lock";
		this.closeTitle = `close_notify.button.${buttonState}.title`;
		this.closeLabel = `close_notify.button.${buttonState}.label`;

		const deployed = this.isDeployed();
		const deployState = deployed ? "undeploy" : "deploy";
		this.deployIcon = deployed ? "times" : "check";
		this.deployTitle = `close_notify.button.${deployState}.title`;
		this.deployLabel = `close_notify.button.${deployState}.label`;
		this.deployClass = deployed ? "btn-danger" : "btn-deploy";
	}

	#onTopicChange() {
		this.#observers.remove();
		this.#observers = createObserversForTopic(this.getTopic(), this);
		this.updateFromTopicStatus();
	}
}
