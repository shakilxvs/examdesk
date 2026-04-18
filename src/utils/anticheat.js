/**
 * Anti-cheat event listener system for ExamDesk
 * Call attachAntiCheat(onViolation) and store the returned cleanup fn
 * Call cleanup fn in useEffect return
 */

export function attachAntiCheat(onViolation) {
  const blockDefault = (e) => e.preventDefault();
  const blockedKeys = ['F12', 'F11', 'F5'];
  const blockedCtrl = ['a', 'c', 'v', 'u', 's', 'p', 'i'];

  const onKey = (e) => {
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && blockedCtrl.includes(e.key.toLowerCase())) {
      e.preventDefault();
      onViolation('keyboard_shortcut');
    }
  };

  const onBlur = () => onViolation('window_blur');

  const onVisibility = () => {
    if (document.hidden) onViolation('tab_switch');
  };

  const onContextMenu = (e) => {
    e.preventDefault();
    onViolation('right_click');
  };

  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('copy', blockDefault);
  document.addEventListener('paste', blockDefault);
  document.addEventListener('cut', blockDefault);
  document.addEventListener('keydown', onKey);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('copy', blockDefault);
    document.removeEventListener('paste', blockDefault);
    document.removeEventListener('cut', blockDefault);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
}

export function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}
