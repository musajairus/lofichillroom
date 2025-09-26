// Lofi Chillroom — main script

const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const themeToggle = document.getElementById("theme-toggle");

const npCover = document.getElementById("np-cover");
const npTitle = document.getElementById("np-title");
const npArtist = document.getElementById("np-artist");
const playBtn = document.getElementById("play");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

const bgGlow = document.querySelector(".bg-glow");
const nowPlaying = document.getElementById("now-playing");

const songDisplay = document.getElementById("song-display");

let songs = [];
let currentIndex = 0;
let isPlaying = false;
const colorThief = new ColorThief();

// --- Load playlist (db.json) ---
fetch("db.json")
  .then(r => r.json())
  .then(data => {
    songs = data.songs || [];
    renderPlaylist();
    if (songs.length) loadSong(0);
  })
  .catch(err => console.error("Failed to load db.json", err));

// Render left playlist
function renderPlaylist(){
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "song";
    el.innerHTML = `
      <img src="${s.cover}" alt="${s.title}">
      <div class="meta">
        <div class="title">${s.title}</div>
        <div class="artist">${s.artist}</div>
      </div>
    `;
    el.addEventListener("click", ()=> loadSong(i, true));
    playlistEl.appendChild(el);
  });
}

// Load a song (index)
function loadSong(index, autoPlay = false){
  if (!songs.length) return;
  currentIndex = ((index % songs.length) + songs.length) % songs.length;
  const s = songs[currentIndex];

  // update audio and UI
  audio.src = s.src;
  npCover.src = s.cover;
  npTitle.textContent = s.title;
  npArtist.textContent = s.artist;

  // Update main display
  songDisplay.innerHTML = `
    <img src="${s.cover}" alt="${s.title}">
    <div class="story">
      <h2>${s.title}</h2>
      <h3>${s.artist}</h3>
      <p>${s.story || ""}</p>
    </div>
  `;

  // extract dominant color for accent
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = s.cover;
  img.onload = () => {
    try {
      const c = colorThief.getColor(img); // [r,g,b]
      const rgb = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      document.documentElement.style.setProperty("--accent", rgb);
      bgGlow.style.background = `radial-gradient(circle at center, ${rgb}, transparent 55%)`;
    } catch (e) {
      console.warn("Color extraction failed", e);
    }
  };

  // play if requested
  if (autoPlay) {
    playSong();
  }
}

// Play / Pause
function playSong(){
  audio.play().catch(()=>{});
  isPlaying = true;
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";
}
function pauseSong(){
  audio.pause();
  isPlaying = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
}
playBtn.addEventListener("click", ()=> isPlaying ? pauseSong() : playSong());
nextBtn.addEventListener("click", ()=> loadSong(currentIndex + 1, true));
prevBtn.addEventListener("click", ()=> loadSong(currentIndex - 1, true));

// Progress updates
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  const cur = audio.currentTime || 0;
  const dur = audio.duration || 1;
  const pct = (cur / dur) * 100;
  progress.value = pct;
  currentTimeEl.textContent = formatTime(cur);
  durationEl.textContent = formatTime(dur);
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ffd600";
  progress.style.background = `linear-gradient(90deg, ${accent} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
});

// Seek
progress.addEventListener("input", (e) => {
  const pct = Number(e.target.value);
  const dur = audio.duration || 1;
  audio.currentTime = (pct / 100) * dur;
});

// Auto next
audio.addEventListener("ended", () => {
  loadSong(currentIndex + 1, true);
});

// Format time
function formatTime(sec){
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Theme toggle
themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
    themeToggle.textContent = "Dark";
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "Light";
  }
});

// On load
(function initThemeButton(){
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light" : "Dark";
})();
