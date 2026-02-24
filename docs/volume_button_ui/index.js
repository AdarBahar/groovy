const STEP = 32;
const DEG_RANGE = 135;

const gradateGroup = document.querySelector("#gradate");
const inputRange = document.querySelector("#inputRange");
const slider = document.querySelector("#slider");
const sliderShadow = document.querySelector("#slider-shadow");

const gradateLineTemplate = (deg: number, hue: number) =>
	`<line data-deg="${deg}" class="active" style="--deg: ${deg}deg; --h: ${hue}" x1="300" y1="30" x2="300" y2="70" />`;

let gradateLines = ``;
const Q = DEG_RANGE / STEP;
for (let i = DEG_RANGE * -1; i <= DEG_RANGE; i += Q) {
	gradateLines += gradateLineTemplate(i, i + DEG_RANGE * 2);
}

gradateGroup.innerHTML = gradateLines;

gradateLines = gradateGroup.querySelectorAll("line");

function deactiveAll() {
	gradateLines.forEach((l) => {
		l.classList.remove("active");
	});
}

function active(v) {
	for (let i = 0; i < gradateLines.length; i++) {
		const l = gradateLines[i];
		if (parseFloat(l.dataset.deg) <= v) l.classList.add("active");
	}
}

inputRange.addEventListener("input", (e) => {
	const V = inputRange.value;

	console.log(V);
	setValue(V);
});

function setValue(v) {
	deactiveAll();
	active(v);
	slider.style.setProperty("--deg", `${v}deg`);
	sliderShadow.style.setProperty("--deg", `${v}deg`);
	slider.style.setProperty("--h", `${v * 1 + DEG_RANGE * 2}`);
}

setValue(0);

/**/
// https://stackoverflow.com/questions/42110701/how-to-calculate-percentage-between-the-range-of-two-values-a-third-value-is-in
function mapBetween(currentNum, minAllowed, maxAllowed, min, max) {
	return (
		((maxAllowed - minAllowed) * (currentNum - min)) / (max - min) + minAllowed
	);
}
const getRangeNumber = (percent, min, max) =>
	mapBetween(percent, min, max, 0, 100);
const getRangePercent = (number, min, max) =>
	mapBetween(number, 0, 100, min, max);

const volumeButtonKnob = document.querySelector(".volume-button-knob");

volumeButtonKnob.addEventListener("click", clickHandler);

const toRadians = (degrees) => (degrees / 180) * Math.PI;
const getRadians = (x, y) => Math.atan2(y, x);
const toDegrees = (radians) => (radians / Math.PI) * 180;

function setByCoords(clientX, clientY) {
	const rect = volumeButtonKnob.getBoundingClientRect();
	const CX = rect.width / 2;
	const CY = rect.height / 2;

	const x = clientX - rect.left;
	const y = clientY - rect.top;

	const r = getRadians(x - CX, y - CY);
	const res = Math.round(toDegrees(r)) + 90;

	let value = res <= 180 ? res : res - 360;
	value = value <= DEG_RANGE * -1 ? DEG_RANGE * -1 : value;
	value = value >= DEG_RANGE ? DEG_RANGE : value;

	setValue(value);
	inputRange.value = value;
}

function clickHandler(e) {
	setByCoords(e.clientX, e.clientY);
}

sliderShadow.onmousedown = (e) => {
	//
	volumeButtonKnob.classList.add("without-animate");
	volumeButtonKnob.onmousemove = clickHandler;
	volumeButtonKnob.style.cursor = "grabbing";
	document.addEventListener("mouseup", (e) => {
		volumeButtonKnob.onmousemove = null;
		volumeButtonKnob.classList.remove("without-animate");
		volumeButtonKnob.style.cursor = "unset";
	});
};

sliderShadow.ontouchstart = (e) => {
	volumeButtonKnob.classList.add("without-animate");
	document.ontouchmove = function (e) {
		const movePageX = e.touches[0].pageX;
		const movePageY = e.touches[0].pageY;
		setByCoords(movePageX, movePageY);
	};
	document.ontouchend = function (e) {
		volumeButtonKnob.classList.remove("without-animate");
	};
};
