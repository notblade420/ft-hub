
const token = localStorage.getItem("spotify_token");

function msToTime(ms) {
  let minutes = Math.floor(ms / 60000);
  let seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

if (!token) {
  document.getElementById("music-status").textContent = "Login with Spotify first.";
} else {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: 'FourTwenty Music Player',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    let deviceId;

    player.addListener('ready', ({ device_id }) => {
      deviceId = device_id;
      document.getElementById("music-status").textContent = "Connected to Spotify!";
      document.getElementById("player-controls").style.display = "block";
      fetchNowPlaying();
      setInterval(fetchNowPlaying, 1000);
    });

    player.addListener('not_ready', () => {
      document.getElementById("music-status").textContent = "Player disconnected.";
    });

    player.addListener('player_state_changed', (state) => {
      if (!state) return;
      const position = state.position;
      const duration = state.duration;

      const currentTimeEl = document.getElementById("current-time");
      const totalTimeEl = document.getElementById("total-duration");

      if (currentTimeEl && totalTimeEl) {
        currentTimeEl.textContent = msToTime(position);
        totalTimeEl.textContent = msToTime(duration);
      }

      const progressPercent = Math.min(100, (position / duration) * 100);
      document.getElementById("progress").style.width = progressPercent + "%";
    });

    player.connect();

    document.getElementById("play").onclick = () => player.resume();
    document.getElementById("pause").onclick = () => player.pause();
    document.getElementById("next").onclick = () => player.nextTrack();
    document.getElementById("prev").onclick = () => player.previousTrack();
    document.getElementById("volume").oninput = (e) => player.setVolume(e.target.value / 100);

    document.getElementById("search-btn").onclick = () => {
      const query = document.getElementById("search-box").value;
      if (!query) return;

      fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
        headers: { Authorization: "Bearer " + token }
      })
      .then(res => res.json())
      .then(data => {
        const results = data.tracks.items;
        const container = document.getElementById("search-results");
        container.innerHTML = results.map(track => `
          <div class="search-result">
            <img src="${track.album.images[0].url}" alt="Album Art" class="result-art"/>
            <div>
              <strong>${track.name}</strong> by ${track.artists.map(a => a.name).join(", ")}<br>
              <button onclick="playTrack('${track.uri}')">▶️ Play</button>
            </div>
          </div>
        `).join("");
      });
    };

    window.playTrack = (uri) => {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [uri] })
      }).then(() => {
        const trackId = uri.split(":").pop();
        fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: "Bearer " + token }
        })
        .then(res => res.json())
        .then(updateNowPlaying);
      });
    };

    function fetchNowPlaying() {
      fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: "Bearer " + token }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data || !data.item) return;
        const track = data.item;
        updateNowPlaying(track);
      })
      .catch(err => console.error("Now Playing fetch error:", err));
    }

    function updateNowPlaying(track) {
      const nowPlaying = document.getElementById("now-playing");
      nowPlaying.innerHTML = `
        <div class="now-playing-info">
          <img src="${track.album.images[0].url}" class="now-playing-art" />
          <div>
            <h3>${track.name}</h3>
            <p>by ${track.artists.map(a => a.name).join(", ")}</p>
          </div>
        </div>
      `;
    }
  };
}
document.getElementById("login-btn")?.addEventListener("click", () => {
  const clientId = "55f5219aba8a4195b35e5ccb02cf6199"; // your actual client ID
  const redirectUri = "https://ft-hub-v2-420.netlify.app/callback.html";
  const scope = "user-read-private user-read-email streaming";
  const codeVerifier = generateCodeVerifier(128);

  generateCodeChallenge(codeVerifier).then(codeChallenge => {
    localStorage.setItem("code_verifier", codeVerifier);
    const authUrl = `https://accounts.spotify.com/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}`;

    window.location.href = authUrl;
  });
});
function generateCodeVerifier(length) {
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + (dec % 256).toString(16)).slice(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const clientId = "55f5219aba8a4195b35e5ccb02cf6199";
      const redirectUri = "https://ft-hub-v2-420.netlify.app/callback.html";
      const scope = "user-read-private user-read-email streaming";
      const codeVerifier = generateCodeVerifier(128);

      generateCodeChallenge(codeVerifier).then(codeChallenge => {
        localStorage.setItem("code_verifier", codeVerifier);

        const authUrl = `https://accounts.spotify.com/authorize` +
          `?response_type=code` +
          `&client_id=${clientId}` +
          `&scope=${encodeURIComponent(scope)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&code_challenge_method=S256` +
          `&code_challenge=${codeChallenge}`;

        window.location.href = authUrl;
      });
    });
  }
});

// helpers
function generateCodeVerifier(length) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  return window.crypto.subtle.digest('SHA-256', data).then(digest => {
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  });
}
