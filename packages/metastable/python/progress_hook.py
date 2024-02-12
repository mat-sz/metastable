import comfy
from helpers import jsonout

def reset():
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        jsonout("comfy.progress", { "value": value, "max": total })
    comfy.utils.set_progress_bar_global_hook(hook)

def use(prompt_id, project_id):
  def hook(value, total, preview_image):
      comfy.model_management.throw_exception_if_processing_interrupted()
      jsonout("prompt.progress", { "id": prompt_id, "project_id": project_id, "value": value, "max": total })
      # if preview_image is not None:
      #    server.send_sync(BinaryEventTypes.UNENCODED_PREVIEW_IMAGE, preview_image, server.client_id)
  comfy.utils.set_progress_bar_global_hook(hook)