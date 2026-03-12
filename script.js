const planetEl = document.querySelector("#planet");
const stats = {
  name: document.querySelector("#stat-name"),
  radius: document.querySelector("#stat-radius"),
  mass: document.querySelector("#stat-mass"),
  temperature: document.querySelector("#stat-temperature"),
  orbit: document.querySelector("#stat-orbit")
};
const generateButton = document.querySelector("#generate");

const EXO_URL = "nasa.php";
let exoplanets = [];

function setLoadingState(message) {
  stats.name.textContent = message;
  stats.radius.textContent = "-";
  stats.mass.textContent = "-";
  stats.temperature.textContent = "-";
  stats.orbit.textContent = "-";
}

function formatValue(value, suffix) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Unknown";
  }
  return `${Number(value).toFixed(2)} ${suffix}`.trim();
}

function temperatureToColor(temperature) {
  if (temperature === null || temperature === undefined || Number.isNaN(Number(temperature))) {
    return "#9fb6d0";
  }
  const clamped = Math.max(50, Math.min(Number(temperature), 2000));
  const t = (clamped - 50) / 1950;
  const cold = { r: 100, g: 150, b: 220 };
  const warm = { r: 230, g: 170, b: 100 };
  const hot = { r: 240, g: 90, b: 70 };

  const mix = (a, b, amount) => Math.round(a + (b - a) * amount);
  let color = cold;
  if (t < 0.5) {
    const local = t / 0.5;
    color = {
      r: mix(cold.r, warm.r, local),
      g: mix(cold.g, warm.g, local),
      b: mix(cold.b, warm.b, local)
    };
  } else {
    const local = (t - 0.5) / 0.5;
    color = {
      r: mix(warm.r, hot.r, local),
      g: mix(warm.g, hot.g, local),
      b: mix(warm.b, hot.b, local)
    };
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function sizeFromRadius(radius) {
  const value = Number(radius);
  if (Number.isNaN(value) || value <= 0) {
    return 120;
  }
  const clamped = Math.min(Math.max(value, 0.5), 12);
  return 80 + clamped * 12;
}

function updatePlanetVisual(planet) {
  const size = sizeFromRadius(planet.pl_rade);
  const color = temperatureToColor(planet.pl_eqt);
  planetEl.style.width = `${size}px`;
  planetEl.style.height = `${size}px`;
  planetEl.style.background = `radial-gradient(circle at 30% 30%, #ffffffaa, ${color} 70%)`;
}

function updateStats(planet) {
  stats.name.textContent = planet.pl_name ?? "Unknown";
  stats.radius.textContent = formatValue(planet.pl_rade, "Earth radius");
  stats.mass.textContent = formatValue(planet.pl_bmasse, "Earth masses");
  stats.temperature.textContent = formatValue(planet.pl_eqt, "K");
  stats.orbit.textContent = formatValue(planet.pl_orbper, "days");
}

function randomPlanet() {
  if (exoplanets.length === 0) return null;
  return exoplanets[Math.floor(Math.random() * exoplanets.length)];
}

async function fetchExoplanets() {
  try {
    generateButton.disabled = true;
    setLoadingState("Loading exoplanets...");
    const response = await fetch(EXO_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Exoplanet request failed");
    }
    const data = await response.json();
    exoplanets = data.filter((planet) => planet.pl_name);
    if (exoplanets.length === 0) {
      throw new Error("No exoplanet data returned");
    }
    generateButton.disabled = false;
    const planet = randomPlanet();
    if (planet) {
      updateStats(planet);
      updatePlanetVisual(planet);
    }
  } catch (error) {
    console.log("Exoplanet fetch error:", error);
    setLoadingState("Exoplanet data unavailable");
  }
}

generateButton.addEventListener("click", () => {
  const planet = randomPlanet();
  if (!planet) return;
  updateStats(planet);
  updatePlanetVisual(planet);
});

fetchExoplanets();
  compare.radius.textContent = formatValue(EARTH.radius, "Earth radius");
  compare.mass.textContent = formatValue(EARTH.mass, "Earth masses");
  compare.temperature.textContent = formatValue(EARTH.temperature, "K");
  compare.orbit.textContent = formatValue(EARTH.orbit, "days");


function deriveRotationSpeed(orbitalPeriod) {
  if (!orbitalPeriod || Number.isNaN(Number(orbitalPeriod))) {
    return 0.0025;
  }
  const period = Math.max(0.1, Number(orbitalPeriod));
  const speed = 0.015 / Math.sqrt(period);
  return THREE.MathUtils.clamp(speed, 0.0008, 0.008);
}

function starColor(temperature) {
  if (!isValidNumber(temperature)) {
    return { r: 1, g: 1, b: 1 };
  }
  const temp = Math.max(2500, Math.min(Number(temperature), 10000));
  const t = (temp - 2500) / 7500;
  const warm = { r: 1, g: 0.76, b: 0.55 };
  const neutral = { r: 1, g: 1, b: 1 };
  const cool = { r: 0.7, g: 0.82, b: 1 };
  if (t < 0.5) {
    const local = t / 0.5;
    return {
      r: lerp(warm.r, neutral.r, local),
      g: lerp(warm.g, neutral.g, local),
      b: lerp(warm.b, neutral.b, local)
    };
  }
  const local = (t - 0.5) / 0.5;
  return {
    r: lerp(neutral.r, cool.r, local),
    g: lerp(neutral.g, cool.g, local),
    b: lerp(neutral.b, cool.b, local)
  };
}

function resolveStellarTemp(planet) {
  const teff = parseNumber(planet.st_teff);
  if (isValidNumber(teff)) {
    return teff;
  }
  const insol = resolveInsolation(planet);
  if (isValidNumber(insol)) {
    return THREE.MathUtils.clamp(4800 + insol * 350, 3500, 7500);
  }
  return 5600;
}

function resolveStellarLum(planet) {
  const lum = parseNumber(planet.st_lum);
  if (isValidNumber(lum)) {
    return lum;
  }
  const insol = resolveInsolation(planet);
  if (isValidNumber(insol)) {
    return THREE.MathUtils.clamp(insol, 0.1, 3);
  }
  return 1;
}

function updateLighting(planet) {
  const starTemp = resolveStellarTemp(planet);
  const color = starColor(starTemp);
  directional.color.setRGB(color.r, color.g, color.b);

  const lum = resolveStellarLum(planet);
  const intensity = THREE.MathUtils.clamp(Math.log10(lum + 1) + 0.7, 0.5, 1.8);
  directional.intensity = intensity;
  ambient.intensity = THREE.MathUtils.clamp(intensity * 0.45, 0.3, 0.7);
}

function updateAtmosphere(planet, radiusScale) {
  if (atmosphereMesh) {
    disposeMesh(atmosphereMesh);
    atmosphereMesh = null;
  }
  if (cloudMesh) {
    disposeMesh(cloudMesh);
    cloudMesh = null;
  }

  const temperature = resolveTemperature(planet);
  const albedo = resolveAlbedo(planet);
  const density = resolveDensity(planet);
  const shouldAddAtmosphere = (isValidNumber(albedo) && albedo > 0.25) || (isValidNumber(density) && density < 3.5);
  if (!shouldAddAtmosphere) {
    return;
  }

  const glowGeo = new THREE.SphereGeometry(radiusScale * 1.05, 64, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x8ad4ff,
    transparent: true,
    opacity: 0.2
  });
  atmosphereMesh = new THREE.Mesh(glowGeo, glowMat);
  planetGroup.add(atmosphereMesh);

  const cloudGeo = new THREE.SphereGeometry(radiusScale * 1.02, 64, 64);
  const cloudMat = new THREE.MeshStandardMaterial({
    map: createSurfaceTextureFromPlanet({ pl_eqt: temperature }).texture,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });
  cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  planetGroup.add(cloudMesh);
}

function buildPlanet(planet) {
  disposeMesh(planetMesh);

  const radiusValue = Number(planet.pl_rade ?? 1);
  const radiusScale = THREE.MathUtils.clamp(radiusValue / 8, 0.6, 1.8);
  const geometry = new THREE.SphereGeometry(radiusScale, 96, 96);
  const material = createPlanetMaterial(planet);
  planetMesh = new THREE.Mesh(geometry, material);
  planetGroup.add(planetMesh);

  planetGroup.rotation.set(0, 0, 0);
  rotationSpeed = deriveRotationSpeed(planet.pl_orbper);

  updateLighting(planet);
  updateAtmosphere(planet, radiusScale);

  updateStats(planet);
}

generateButton.addEventListener("click", () => {
  if (exoplanets.length === 0) {
    return;
  }
  const planet = randomPlanet();
  if (planet) {
    buildPlanet(planet);
  }
});

compare.toggle.addEventListener("click", () => {
  const isOpen = compare.tab.classList.toggle("is-open");
  compare.toggle.setAttribute("aria-expanded", String(isOpen));
});

function updateDiagram() {
  const bounds = sceneEl.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  diagramEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
  diagramEl.innerHTML = "";

  if (!planetMesh) return;

  const planetPos = planetMesh.position.clone();
  const vector = planetPos.project(camera);
  const x = (vector.x * 0.5 + 0.5) * width;
  const y = (-vector.y * 0.5 + 0.5) * height;
  const radius = 120;

  const statElements = document.querySelectorAll(".stat");
  statElements.forEach((stat, index) => {
    const statRect = stat.getBoundingClientRect();
    const x1 = statRect.right - bounds.left + 6;
    const y1 = statRect.top - bounds.top + statRect.height / 2;
    const angle = (index / statElements.length) * Math.PI * 0.9 - 0.4;
    const x2 = x + Math.cos(angle) * radius;
    const y2 = y + Math.sin(angle) * radius;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    diagramEl.appendChild(line);

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x2);
    dot.setAttribute("cy", y2);
    dot.setAttribute("r", 3);
    diagramEl.appendChild(dot);
  });
}

function resize() {
  const { width, height } = sceneEl.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  if (planetMesh) {
    planetMesh.rotation.y += rotationSpeed;
  }
  if (cloudMesh) {
    cloudMesh.rotation.y += rotationSpeed * 1.4;
  }
  controls.update();
  renderer.render(scene, camera);
  updateDiagram();
}

resize();
window.addEventListener("resize", resize);
fetchExoplanets();
animate();

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggle.textContent = "Dark mode";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = "Light mode";
    themeToggle.setAttribute("aria-pressed", "false");
  }
}

const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  localStorage.setItem("theme", nextTheme);
  applyTheme(nextTheme);
});
