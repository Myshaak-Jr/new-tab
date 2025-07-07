const letter_width_px = 20;
const letter_height_px = 20;
const adlam_alphabet = [
	"𞤀", "𞤁", "𞤂", "𞤃", "𞤄", "𞤅", "𞤆", "𞤇", "𞤈", "𞤉",
	"𞤊", "𞤋", "𞤌", "𞤍", "𞤎", "𞤏", "𞤐", "𞤑", "𞤒", "𞤓",
	"𞤔", "𞤕", "𞤖", "𞤗", "𞤘", "𞤙", "𞤚", "𞤛", "𞤜", "𞤝",
	"𞤞", "𞤟", "𞤠", "𞤡"
];
const container = document.getElementById("letter-container");

function createLetterSpan(char) {
	const span = document.createElement("span");
	span.className = "letter";
	span.textContent = char;
	span.style.width = `${letter_width_px}px`;
	span.style.height = `${letter_height_px}px`;
	span.style.fontSize = `${letter_height_px}px`;
	return span;
}

function renderText() {
	const container_width = window.innerWidth;
	const container_height = window.innerHeight;

	const total_letters = Math.floor(container_width / letter_width_px) * Math.floor(container_height / letter_height_px);
	
	let old_children = container.childNodes;

	const old_children_count = old_children.length;

	if (old_children_count > total_letters) {
		for (let i = old_children_count - 1; i >= total_letters; i--) {
			container.removeChild(old_children[i]);
		}
	} else {
		for (let i = old_children_count; i < total_letters; i++) {
			const randomIndex = Math.floor(Math.random() * adlam_alphabet.length);
			const letter = createLetterSpan(adlam_alphabet[randomIndex]);
			container.appendChild(letter);
		}
	}
}

function updateClock() {
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	const digits = [
		hours[0], hours[1],
		minutes[0], minutes[1],
		seconds[0], seconds[1]
	];
	const digitElements = document.querySelectorAll('.digit');
	digitElements.forEach((digitElement, index) => {
		digitElement.textContent = digits[index];
	});

	// Calculate the strength based on the largest digit changed
	for (let i = 0; i < digits.length; i++) {
		const digit = parseInt(digits[digits.length - i - 1]);
		if (digit == 0) continue;
		return i;
	} 
}

class Line {
	constructor() {
		this.line = null;
		this.charWidth = 0;
		this.waveSpeed = 0.01;
		this.damping = 0.0005;
		this.length = 0;
		this.lastTs = 0;
		this.scaleDown = 5;

		this.line = document.querySelector("#line");
		this.lastTs = performance.now();

		this.paused = false;
		this.rafId = null;

		this.resize();

		this.impulse(Math.floor(this.length / 2));

		this.start();
	}

	start() {
		this.rafId = requestAnimationFrame(this.update.bind(this));
	}

	stop() {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	resize() {
		const lineWidth = this.line.parentElement.offsetWidth;

		const text = this.line.textContent;
		this.line.textContent = "0";
		this.charWidth = this.line.getBoundingClientRect().width;
		this.line.textContent = text;

		this.length = Math.floor(lineWidth / this.charWidth);

		// resize the height data and speed data arrays
		if (!this.lineHeightData || this.lineHeightData.length !== this.length) {
			this.lineHeightData = new Array(this.length).fill(0);
		}
		if (!this.lineSpeedData || this.lineSpeedData.length !== this.length) {
			this.lineSpeedData = new Array(this.length).fill(0);
		}
	}

	update(ts) {
		if (this.paused) return;

		var dt = ts - this.lastTs;
		this.lastTs = ts;

		if (dt > 1000 / 60) {
			dt = 1000 / 60;
		}

		// update the height data using the wave equation
		const old_heightData = [...this.lineHeightData];

		// \frac{ \partial^{2}h }{ \partial t^{2} } = c^{2}\frac{ \partial^{2}h }{ \partial x^{2} } - k\frac{ \partial h }{ \partial t }
		for (let i = 0; i < this.length; i++) {
			const center = old_heightData[i];
			const left = old_heightData[i - 1] || 0;
			const right = old_heightData[i + 1] || 0;

			const acceleration = (left + right - 2 * center) * this.waveSpeed * this.waveSpeed;

			// update the speed and height data
			this.lineSpeedData[i] += acceleration * dt;
			this.lineSpeedData[i] -= this.damping * this.lineSpeedData[i] * dt;
			this.lineHeightData[i] += this.lineSpeedData[i] * dt;
		}

		this.line.textContent = this.convertData();

		requestAnimationFrame(this.update.bind(this));
	}

	convertData() {
		const characters = [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
			"k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
			"u", "v", "w", "x", "y", "z", "A", "B", "C", "D",
			"E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
			"O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
			"Y", "Z"
		];

		return this.lineHeightData.map((v, i) => {
			const value = (v + this.scaleDown) / (2 * this.scaleDown); // škálování na interval [0, 1]
			const charIndex = Math.min(Math.max(Math.floor(value * 52), 0), 51); // škálování na indexy 0-51
			return characters[charIndex];
		}).join("");
	}

	impulse(position, radius, strength) {
		const base = strength;
		const sigma = radius / 2;
		for (let i = -radius; i <= radius; i++) {
			const index = position + i;
			if (index >= 0 && index < this.lineSpeedData.length) {
				const gaussian = Math.exp(- (i * i) / (2 * sigma * sigma));
				this.lineSpeedData[index] += base * gaussian;
			}
		}
	}}

var line = null;

function init() {
	updateClock();
	renderText();
	line = new Line();

	const searchBars = document.querySelectorAll(".search-bar");

	searchBars.forEach(bar => {
		const input = bar.querySelector(".search-input");
		const button = bar.querySelector(".search-button");
		const baseUrl = bar.dataset.url;

		const search = () => {
			const query = input.value.trim();
			input.value = "";

			if (!query) return;

			const urlRegex = /^(https?:\/\/)?(www\.)?[\w\-\.]+\.\w{2,}(\/[\w\-\.~:\/?#[\]@!$&'()*+,;=%]*)?$/i;

			if (urlRegex.test(query)) {
				// Pokud chybí http/https, přidáme ho
				const fullUrl = query.startsWith("http") ? query : "https://" + query;
				window.location.href = fullUrl;
			} else {
				// Pokud to není URL, pokračujeme ve vyhledávání
				window.location.href = baseUrl + encodeURIComponent(query);
			}
		};

		button.addEventListener("click", search);
		input.addEventListener("keypress", (e) => {
			if (e.key === "Enter") search();
		});
	});

	requestAnimationFrame(() => {
		const input = searchBars[0]?.querySelector(".search-input");
		if (input) input.focus();
	});
}

function onResize() {
	renderText();
	if (line) {
		line.resize();
	}
}

function onTick() {
	const biggestDigit = updateClock();
	if (line) {
		const strength = [
			{"radius": 5, "strength": 0.005},
			{"radius": 7, "strength": 0.007},
			{"radius": 10, "strength": 0.01},
			{"radius": 10, "strength": 0.01},
			{"radius": 10, "strength": 0.01},
			{"radius": 10, "strength": 0.01}
		][biggestDigit];
		var sign = Math.random() < 0.5 ? -1 : 1;
		line.impulse(Math.floor(Math.random() * line.length), strength.radius, sign * strength.strength);
	}
}

// Event listeners
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") {
		line.paused = true;
		line.stop();
		console.log("Paused");
	} else {
		line.paused = false;
		line.start();
		console.log("Resumed");
	}
});

window.addEventListener("resize", onResize);
window.addEventListener("DOMContentLoaded", () => {
	document.fonts.load('2rem "Linefont"').then(() => {
		init();
	});
});
setInterval(onTick, 1000);
