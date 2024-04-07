import comfy
from helpers import jsonout
from io import BytesIO
import base64

def reset():
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        jsonout("comfy.progress", { "value": value, "max": total })
    comfy.utils.set_progress_bar_global_hook(hook)

def use(prompt_id, project_id):
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        preview = None

        if preview_image is not None:
            buffered = BytesIO()
            preview_image.save(buffered, format="PNG")
            preview = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode('utf-8')

        jsonout("prompt.progress", { "id": prompt_id, "project_id": project_id, "value": value, "max": total, "preview": preview })
        
    comfy.utils.set_progress_bar_global_hook(hook)