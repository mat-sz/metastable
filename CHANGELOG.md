# 0.0.24 (Upcoming)

## Bug fixes

- Resolve GPU detection issues during installation.

# 0.0.23 (2025-03-11)

## Features

- Added keyboard shortcuts for project view:
  - `Ctrl+Up` - selects previous output
  - `Ctrl+Down` - selects next output

## Bug fixes

- Fixed issues with NVIDIA driver detection on Windows.
- Fixed issues with Intel Arc GPUs not being correctly utilized within PyTorch.

# 0.0.22 (2025-03-08)

## Features

- Added project tagging to context menu and project list.
- Added a button to invert the mask in the mask editor.
- Added an option to enable experimental performance optimizations in backend settings.

## Improvements

- Improved design consistency of context menus.
- Made all project settings categories not collapsed by default.
- Added detection of custom installation paths when using the Windows installer.

## Bug fixes

- Added a check during installation to ensure application files aren't overwritten with custom paths.
- Resolved issues with installation task queue being stuck.

# 0.0.21 (2025-02-18)

## Features

- Added an option to mark projects as favorite.
- Added experimental support for Intel Arc/Battlemage GPUs.

## Bug fixes

- Resolved issues with opening a large amount of projects at once.
- Resolved performance issues with loading the project list.
- Resolved issues with draft projects not being saved correctly.

# 0.0.20 (2025-02-15)

## Features

- Added user accounts. **(Web UI only.)**
- Added keyboard shortcuts for projects:
  - `Ctrl+N` - opens a new project
  - `Ctrl+W` - closes the current project
  - `Ctrl+Shift+W` - closes the current project without saving
  - `Ctrl+Left` - switches to the previous project in the project list
  - `Ctrl+Right` - switches to the next project in the project list
- Added support for using Shift to skip the save dialog while closing draft projects.
- Added an option to close other tabs in the context menu.

## Bug fixes

- Fixed issues with project settings not being updated correctly.
- Fixed issues with optional features being broken after bundle reset.
- Fixed high CPU usage when downloading models.

# 0.0.19 (2025-02-08)

## Features

- Added a "Temperature unit" switch to settings.
- Added a keyboard shortcut to reset weight of selected text in prompt.
- Added support for grouping prompt styles.

## Improvements

- Removed bundle reset actions for Docker images.
- Improved file update watcher performance.
- Improved prompt data import from image files.
- Updated Electron to v34.0.2.
- Improved application loading time.

## Bug fixes

- Fixed issues with log items not being refreshed in "System monitor".
- Fixed parenthesis insertion around words in prompts.
- Fixed metadata for downloaded models.

# 0.0.18 (2025-01-28)

## Features

- Added a "Font size" slider to settings.
- Added a modal for model download confirmations and an input to select target folder.

## Improvements

- Added a close button to System Monitor.
- Improved design consistency.

## Bug fixes

- Fixed issues with popovers not showing up in the right place (e.g. model selection or mask image selection).

# 0.0.17 (2025-01-27)

## Features

- Added a button to unload all models from VRAM.
- Added a new system monitor view with backend logs, loaded models and hardware utilization information.

## Improvements

- Model caching has been reworked to retain relevant models.

## Bug fixes

- Resolved problems with cleanup of draft projects.
- Restored missing context menu options - "Save Image As" and "Copy Image".
- Resolved an issue with the "Discard" button resulting in the old image being displayed as an output.
- Fixed an issue where some buttons near the top of the window weren't fully clickable.

# 0.0.16 (2025-01-25)

## Features

- Added support for generating video using Hunyuan Video models.
- Added support for APNG outputs.
- Added an option to change the installation directory during setup.
- Added support for GGUF model files. (Requires the "GGUF" optional feature to be installed.)
- Added an option to change the default prompt.
- Added an option to use light theme.
- Added an option to always run VAE on CPU.

## Improvements

- Moved bundles to a faster CDN to improve installation speed.
- Improved word wrapping in prompt fields.
- Added the new file picker to path fields in settings.
- In CivitAI downloader, model rating was replaced by thumbs up/down count.
- The "Draft project" dialog is now only shown if the project has been changed.

## Bug fixes

- Fixed auto update.
- Fixed issues with GPU detection using `rocm-smi` on Linux.

# 0.0.15 (2025-01-11)

> [!WARNING]
> Manual steps required to finish the update.
> If you have any CLIP or UNET models (in models/clip and models/unet), you will need to move them to models/text_encoder and models/diffusion_model respectively.

## Features

- Added a setting to reserve a certain amount of VRAM.
- Added support for more than 2 CLIP models in advanced mode.
- Added authorization for HuggingFace downloads.
- Added support for loading checkpoints that don't contain VAE/CLIP/UNET (e.g. SD 3.x) and then supplying external models.
- Added a button to reset selection in model fields.
- Added support for "metacheckpoints" - metadata files that combine multiple separate models into one virtual checkpoint.

## Improvements

- Added version to names of models downloaded from CivitAI.
- Added detection of GPU drivers during setup.
- Added support for DirectML on Intel Arc GPUs on Windows.
- Improved error messages during checkpoint loading (e.g. if a checkpoint with missing CLIP/VAE is used).
- ZLUDA is now automatically enabled during setup if compatible HIP SDK is installed.
- Added SD 3.x and FLUX.1 to downloadable models.
- Added TAESD support for SD 3.x and FLUX.1.

## Bug fixes

- Fixed ZLUDA support.
- Fixed notarization issues on macOS.
- Fixed setup error display (during extraction step).
- Fixed issues with saving/renaming projects on Windows.
- Fixed issues with inpainting masks not being correctly loaded.
- Fixed parenthesis logic in prompt text fields.

# 0.0.14 (2024-11-27)

## Features

- Added experimental support for ZLUDA on Windows. Requires [HIP SDK 5.7](https://www.amd.com/en/developer/resources/rocm-hub/hip-sdk.html) to be installed, and a compatible GPU (or patches for older GPUs). Bundle reset required, "Use ZLUDA" needs to be selected in the Hardware section during setup.

## Bug fixes

- Fixed img2img errors.
- Added error handling for backend initialization.

# 0.0.13 (2024-11-11)

## Bug fixes

- Fixed the app crashing on start.

# 0.0.12 (2024-11-11)

## Features

- Added a button to easily postprocess (upscale) output images after generation.
- Added buttons to reset all settings (without resetting the bundle) and reset the bundle (without resetting settings) to "About Metastable".
- Added keyboard shortcuts (`Up`/`Down`/`Enter`) for selecting models in model browser.
- Added support for trackpad gestures in image previews.
- Added support for resizing the prompt area.

## Improvements

- Improved handling of window resizes in image previews.
- Updated ComfyUI code to latest version.

## Bug fixes

- Fixed display of input fields next to sliders.
- Fixed page zoom issues on macOS.

# 0.0.11 (2024-11-07)

## Features

- Added support for adding extra model folders.
- Added a refresh button to model browser.
- Added storage of brush settings to mask editor.

## Bug fixes

- Resolved issues with AMD GPU detection on Windows.
- Fixed issues with mask editor reverting the mask at random.
- Fixed layout issues in project generation preview.

# 0.0.10 (2024-11-03)

## Features

- Added an option to pad edges for inpainting.
- Added support for PuLID.
- Features are now split into modules that can be enabled/disabled.

## Improvements

- Moved backend status to settings.
- Reduced memory usage during image generation.
- Refactored model path handling.

## Bug fixes

- Resolved issues with non-square image generation previews.
- Resolved issues with GPU detection on Linux.
- Resolved issues with out-of-memory crashes.
- Fixed usage of TAESD decoder for previews.
- Fixed problems with project metadata sometimes not loading correctly.
- CivitAI tab now remembers search filters when switching between tabs.

# 0.0.9 (2024-10-17)

## Features

- Keyboard shortcuts are now customizable.
- Prompt input has been updated to include new features:
  - Added line numbers.
  - Added keyboard shortcuts:
    - `Ctrl+Up/Down` to change the weight of certain parts of the prompt.
    - `Ctrl+/` to comment out parts of the prompt.
    - `(` (`Shift+9`) to wrap parts of the prompt in parentheses after selecting something.
  - Added support for comments:
    - Inline/multiline: `#- comment -#`
    - Line (Python style): `# comment`
  - Added syntax highlighting.
- Added support for fetching utilization data from AMD GPUs on Linux (via `rocm-smi`).

# Bug fixes

- Resolved issues with detection of enterprise GPUs.
- Resolved "App quit unexpectedly." on macOS.

# 0.0.8 (2024-10-13)

## Features

- Added an easy way to select input images for img2img/inpainting.
- Added confirmation before project settings are restored from an image.
- Added simplified sampling quality picker.
- Added simplified output image resolution picker.
- Added upload and management of input/mask files inside of projects.

## Improvements

- Input images are now automatically saved and can be easily reused.
- Project files are now automatically refreshed.
- Image thumbnails are now WEBP and support transparency.

## Bug fixes

- UI state (e.g. section collapsed state) is now properly saved.
- Error display now doesn't overflow the screen for long errors.
- Fixed issues with resetting the bundle.

# 0.0.7 (2024-10-08)

## Features

- Added keyboard shortcuts:
  - `Ctrl+Z`/`Ctrl+Shift+Z` in mask editor now result in Undo/Redo respectively.
  - `Alt+Enter` in project view now cancels the currently running prompt.
- Added Undo/Redo buttons to mask editor.
- Window position and state is now restored on launch.
- Added progress display in extraction task in the installer.

## Improvements

- Updated Electron to v32.1.2.
- Improved design consistency.
- Reduced application size.

## Bug fixes

- Resolved issues with bundle detection (should fix performance issues on AMD GPUs on Windows).
- Fixed CivitAI config file downloads.

# 0.0.6 (2024-10-02)

## Features

- Added a back button to easily return from grid/editor.
- Added middle click to open project without selecting it.
- Added middle click to dismiss failed/queued tasks.
- Added a confirmation dialog when deleting multiple output files.
- Added support for loading YAML configuration files for checkpoints.
- Added an error handler for unrecoverable errors.
- Added storage of project settings section state (if the section is collapsed or not).
- Added a settings section for ComfyUI arguments.
- Improved the process of adding models to a project.

## Bug fixes

- Improved progress display on smaller screens.
- Fixed JSON serialization issues. (resolves problems with duplicating projects, etc.)
- Fixed display of large amounts of horizontal tabs.

# 0.0.5 (2024-09-28)

## Features

- Updated design language.
- Replaced the output grid view with a more advanced file manager view.
- Added "Cancel" and "Clear queue" buttons to projects.
- Added a "Discard" button to quickly delete current output and try again.
- Added a context menu for text fields and images.

## Bug fixes

- Resolved issues with saving settings.
- Fixed copy/paste/select keyboard shortcuts on MacOS.
- Fixed CivitAI page navigation.

# 0.0.4 (2024-09-24)

## Features

- Added prompt styles.
- Added a tag for corrupt files inside of the model browser.
- Added display of download errors in the download queue view.
- Added a list of recommended resolutions per model type and aspect ratio.

## Bug fixes

- Fixed crashes when corrupt model files are present.
- Fixed CivitAI authorization requirement detection for downloads.

# 0.0.3 (2024-09-18)

## Features

- Added support for FLUX.1.
- Added architecture (e.g. SD1, SDXL) detection for models.
- Added display of error logs for failed generation tasks.
- Added sampling time statistics display.
- Added keyboard shortcuts to mask editor.
- Added menu to projects that allows the user to rename, delete and duplicate the project.
- Added a progress bar to app icon to display the current prompt progress.
- Added notifications to be displayed after prompt completion.

## Bug fixes

- Resolved an issue with AMD GPU detection.
- Fixed model metadata saving in downloads.
- Fixed usage of `Ctrl+Enter` shortcut in prompt fields.

# 0.0.2 (2024-06-15)

## Features

- Support for Stable Diffusion 3 was added.
- Drag and drop is now supported in image input fields.
- In output image displays, a button to select the image as input in the current project was added.
- In output image displays, a button to delete the image was added.
- A button to reveal the model directory in file explorer was added.
- In inpainting mask editor, the right mouse button now erases the mask.

## Bug fixes

- User's Python site-packages do not conflict with the packages in the virtual environment anymore.

## Other

- ComfyUI's code was updated.

# 0.0.1 (2024-06-06)

- Initial release.
