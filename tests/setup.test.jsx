import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { useClipStore } from '../src/stores/useClipStore';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn(async () => () => {}) }));
vi.mock('@tauri-apps/api/app', () => ({ getVersion: vi.fn(async () => '0.2.0') }));
let trusted;
let failCopy;
let revoked;
const calls = [];
beforeEach(() => {
  trusted = false;
  failCopy = false;
  revoked = false;
  calls.length = 0;
  Element.prototype.scrollIntoView = vi.fn();
  useClipStore.setState({ clips: [], categories: [], settings: null, query: '', filter: 'all', selectedId: null, activeCategoryId: null, loading: false, error: null });
  invoke.mockImplementation(async (command) => {
    calls.push(command);
    if (command === 'accessibility_status') return trusted;
    if (command === 'get_categories') return [];
    if (command === 'get_settings') return { autoPaste: true, trackingPaused: false, launchAtStartup: false, maxStoredClips: 5000 };
    if (command === 'search_clips') return [{ id: 'test', content: 'Reuse this text', type: 'text', lastCopiedAt: new Date().toISOString(), copiedCount: 1 }];
    if (command === 'copy_clip' && failCopy) throw 'clipboard unavailable';
    if (command === 'paste_clip' && revoked) throw 'accessibility-denied';
    if (command === 'request_accessibility') throw 'settings unavailable';
  });
});
afterEach(cleanup);
async function launch() {
  render(<App />);
  await screen.findByText('Reuse this text');
  await waitFor(() => expect(calls).toContain('accessibility_status'));
}
it('copies and closes on Enter without requesting permission', async () => {
  await launch();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(calls).toContain('hide_window'));
  expect(calls.indexOf('copy_clip')).toBeLessThan(calls.indexOf('hide_window'));
  expect(calls).not.toContain('paste_clip');
  expect(calls).not.toContain('request_accessibility');
});
it('quick selection also copies without permission', async () => {
  await launch();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: '1', metaKey: true });
  await waitFor(() => expect(calls).toContain('copy_clip'));
  expect(calls).not.toContain('paste_clip');
});
it('keeps the launcher open and reports a clipboard failure', async () => {
  failCopy = true;
  await launch();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await screen.findByText('clipboard unavailable');
  expect(calls).not.toContain('hide_window');
});
it('detects newly granted access on focus and enables auto-paste', async () => {
  await launch();
  trusted = true;
  await act(async () => { window.dispatchEvent(new Event('focus')); });
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Set up auto-paste' })).toBeNull());
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(calls).toContain('paste_clip'));
});
it('explains manual paste if access is revoked after the last check', async () => {
  trusted = true;
  revoked = true;
  await launch();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await screen.findByText('Copied. Switch to your app and press ⌘V.');
  expect(calls).not.toContain('request_accessibility');
});
it('provides a mouse copy action without hiding or auto-pasting', async () => {
  await launch();
  fireEvent.click(screen.getByRole('button', { name: 'Copy', exact: true }));
  await screen.findByText('Copied. Switch to your app and press ⌘V.');
  expect(calls).toContain('copy_clip');
  expect(calls).not.toContain('hide_window');
  expect(calls).not.toContain('paste_clip');
});
it('keeps Tab native in settings and reports settings-opening errors', async () => {
  await launch();
  fireEvent.click(screen.getByRole('button', { name: 'Set up auto-paste' }));
  const button = screen.getByRole('button', { name: 'Open Accessibility settings' });
  expect(fireEvent.keyDown(button, { key: 'Tab' })).toBe(true);
  fireEvent.click(button);
  await screen.findByText('Open System Settings → Privacy & Security → Accessibility manually.');
});

it('falls back to copy if permission status cannot be checked', async () => {
  const original = invoke.getMockImplementation();
  invoke.mockImplementation(async (command, args) => {
    if (command === 'accessibility_status') { calls.push(command); throw 'check failed'; }
    return original(command, args);
  });
  await launch();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(calls).toContain('hide_window'));
  expect(calls).toContain('copy_clip');
  expect(calls).not.toContain('paste_clip');
});
it('honors copy-only preference even with Accessibility granted', async () => {
  trusted = true;
  await launch();
  act(() => useClipStore.setState({ settings: { ...useClipStore.getState().settings, autoPaste: false } }));
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(calls).toContain('hide_window'));
  expect(calls).toContain('copy_clip');
  expect(calls).not.toContain('paste_clip');
});
