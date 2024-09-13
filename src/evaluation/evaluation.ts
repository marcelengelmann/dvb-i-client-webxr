import { Entity } from "aframe";
import { BaseComponent } from "../components/base-component/base-component";
import { toComponent } from "../components/base-component/class-to-component";

export class SpawnStreamButton extends BaseComponent {
	private readonly width = 3;
	private readonly height = this.width / (16 / 9);
	private readonly streams: Entity[] = [];
	private readonly scene: HTMLElement | null = document.getElementById("scene");

	public async init() {
		const geometry = new AFRAME.THREE.PlaneGeometry(2, 0.5);

		const material = new AFRAME.THREE.MeshStandardMaterial({
			color: "red",
		});
		const mesh = new AFRAME.THREE.Mesh(geometry, material);
		this.el.setObject3D("mesh", mesh);
		this.el.object3D.rotateX(-Math.PI / 2);
		this.el.object3D.position.setZ(-2);
		this.el.addEventListener("click", () => this.createNewPlayer());
	}

	private createNewPlayer() {
		const player = document.createElement("a-dvbi-player");
		player.setAttribute("position", "0.0 1.6 -2");
		player.setAttribute("muted", "true");
		player.setAttribute("channelnumber", "2");
		player.setAttribute("camera-position-listener", "");
		this.streams.push(player);
		this.scene?.appendChild(player);
		this.positionStreams();
	}

	private positionStreams() {
		const requ_coloumns = Math.round(Math.sqrt(this.streams.length));
		const requ_rows = Math.ceil(this.streams.length / requ_coloumns);
		const z_pos = -2 * requ_rows;
		const startX = (1 - requ_coloumns) * (this.width / 2);
		const startY = -(1 - requ_rows) * this.height + 1.6;
		let posX = startX;
		let posY = startY;
		for (let i = 0; i < this.streams.length; i++) {
			const stream = this.streams[i];
			stream.setAttribute("position", `${posX} ${posY} ${z_pos}`);
			if ((i + 1) % requ_rows == 0) {
				posX += this.width;
				posY = startY;
				continue;
			}
			posY -= this.height;
		}
	}
}
AFRAME.registerComponent("spawn-stream-button", toComponent(SpawnStreamButton));
