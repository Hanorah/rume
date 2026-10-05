(() => {
  const song = new Audio("coach/hbd.mp3");
  song.loop = true;
  song.preload = "auto";
  song.volume = 0.9;

  const start = () => {
    const pending = song.play();
    if (!pending) return;
    pending.then(() => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    }).catch(() => {});
  };

  start();
  window.addEventListener("pointerdown", start);
  window.addEventListener("keydown", start);
  window.addEventListener("touchstart", start);
})();
