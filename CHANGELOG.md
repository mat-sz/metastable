# 0.0.6 (Upcoming)

## Features

- Added a back button to easily return from grid/editor.
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
