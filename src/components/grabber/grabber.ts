AFRAME.registerComponent("grabber", {
	init: function () {
		this.grabbed = undefined;
	},
	events: {
		gripdown: function (evt) {
			if (evt.currentTarget.components["raycaster"].intersections.length > 0) {
				this.grabbed =
					evt.currentTarget.components["raycaster"].intersections[0].object.el;
				console.log(this.grabbed);

				this.grabbed.emit("grabbing_start", undefined, false);
				evt.currentTarget.object3D.attach(this.grabbed.object3D);
			}
		},
		gripup: function () {
			if (this.grabbed) {
				this.el.sceneEl.object3D.attach(this.grabbed.object3D);
				this.grabbed.emit("grabbing_end", undefined, false);
				this.grabbed = undefined;
			}
		},
	},
});
