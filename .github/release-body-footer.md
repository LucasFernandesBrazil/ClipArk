---

### Install

1. Download `ClipArk_<version>_universal.dmg` below — one build, Apple silicon and Intel.
2. Open it and drag **ClipArk** into `Applications`.
3. **This build is not signed or notarised**, so macOS will refuse the first launch with
   *"ClipArk is damaged"* or *"cannot be opened because Apple cannot check it for
   malicious software."* Try to open it once, dismiss the dialog, then go to **System
   Settings → Privacy & Security** and press **Open Anyway**. Equivalent one-liner:

   ```bash
   xattr -dr com.apple.quarantine /Applications/ClipArk.app
   ```

4. Grant **Accessibility** access when prompted, or from *Settings → Pasting*, if you want
   <kbd>⏎</kbd> to paste into the app you came from.

Verify the download if you like:

```bash
shasum -a 256 -c SHA256SUMS.txt
```

> [!NOTE]
> Because builds are unsigned, macOS may ask you to grant **Accessibility** access again
> after updating. Remove the old ClipArk entry under *Privacy & Security → Accessibility*
> and add the new one — a stale entry silently does nothing.

ClipArk has no updater and no network code. New versions are downloaded from this page by
hand, on purpose.
