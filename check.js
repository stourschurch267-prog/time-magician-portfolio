const localPlayer = document.getElementById('video-site');
const libraryPlayer = document.getElementById('video-library');
function wirePlayer(player, button, status, src) {
  button.disabled = false;
  button.textContent = player === localPlayer ? '播放首页影像' : '播放账号作品';
  status.textContent = '等待播放';
  button.addEventListener('click', async () => {
    if (!player.getAttribute('src')) player.src = src;
    status.textContent = '正在加载视频…';
    try { await player.play(); } catch { status.textContent = '暂未播放，请点视频上的播放按钮重试。'; }
  });
  player.addEventListener('playing', () => {
    for (const other of [localPlayer, libraryPlayer]) if (other !== player) other.pause();
    status.textContent = '正在播放，可以尝试拖动进度条';
  });
  player.addEventListener('seeked', () => { if (player.readyState >= 2) status.textContent = '进度已切换'; });
  player.addEventListener('error', () => { status.textContent = '视频未能加载，请把这个情况告诉我。'; });
}
wirePlayer(localPlayer, document.getElementById('play-site'), document.getElementById('status-site'), './media/site-video.mp4');
fetch('./config.json', { cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error('Configuration unavailable');
  return response.json();
}).then(config => {
  const url = config.libraryVideoUrl && new URL(config.libraryVideoUrl);
  if (!url || url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.includes('/releases/download/')) throw new Error('Release not published');
  wirePlayer(libraryPlayer, document.getElementById('play-library'), document.getElementById('status-library'), url.href);
}).catch(() => {
  document.getElementById('status-library').textContent = '账号作品正在准备，暂不可测试。';
  document.getElementById('play-library').textContent = '等待作品链接';
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { localPlayer.pause(); libraryPlayer.pause(); } });
