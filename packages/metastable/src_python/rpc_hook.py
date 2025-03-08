from contextlib import contextmanager
import sys
import comfy
import output
from io import BytesIO
import base64
from PIL import Image

PREVIEW_SIZE = (512, 512)

def reset_progress():
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        output.write_event("comfy.progress", { "value": value, "max": total })
    comfy.utils.set_progress_bar_global_hook(hook)

def hook_progress(request_id, session_id=None):
    def hook(value, total, preview_image):
        comfy.model_management.throw_exception_if_processing_interrupted()
        preview = None

        if preview_image is not None:
            buffered = BytesIO()
            preview_image.thumbnail(PREVIEW_SIZE, Image.Resampling.LANCZOS)
            preview_image.save(buffered, format="jpeg", quality=70)
            preview = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode('utf-8')

        output.write_event("rpc.progress", { "requestId": request_id, "sessionId": session_id, "value": value, "max": total, "preview": preview })
        
    comfy.utils.set_progress_bar_global_hook(hook)

class Rewriter(object):
    def __init__(self, type, orig, request_id, session_id):
        self.type = type
        self.orig = orig
        self.request_id = request_id
        self.session_id = session_id
    def write(self, text):
        output.write_event("rpc.log", { "requestId": self.request_id, "sessionId": self.session_id, "type": self.type, "text": text })
    def __getattr__(self, attr):
        return getattr(self.orig, attr)     

@contextmanager
def use(request_id, session_id=None):
    current_out = sys.stdout
    current_err = sys.stderr

    try:
        hook_progress(request_id, session_id)
        sys.stdout = Rewriter("stdout", current_out, request_id, session_id)
        sys.stderr = Rewriter("stderr", current_err, request_id, session_id)
        yield
    finally:
        reset_progress()
        sys.stdout = current_out
        sys.stderr = current_err
