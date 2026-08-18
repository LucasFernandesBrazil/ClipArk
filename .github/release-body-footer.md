---

### Install

1. Download `ClipArk_<version>_universal.dmg` below — one build, Apple silicon and Intel.
2. Open it and drag **ClipArk** into `Applications`.
3. **This build is signed ad-hoc but not notarised**, so macOS refuses the first launch:
   *Apple could not verify "ClipArk" is free of malware that may harm your Mac or
   compromise your privacy.* That is about notarisation — a $99/year Apple membership
   ClipArk does not have — and not about anything found in the app. Press **Done**, then
   open **System Settings → Privacy & Security**, scroll to *Security*, and press **Open
   Anyway** on the ClipArk line. Once per version. Equivalent one-liner:

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
> An ad-hoc signature changes with every build, so macOS may ask you to grant
> **Accessibility** access again after updating. Remove the old ClipArk entry under
> *Privacy & Security → Accessibility* and add the new one — a stale entry silently does
> nothing.

ClipArk has no updater and no network code. New versions are downloaded from this page by
hand, on purpose.
