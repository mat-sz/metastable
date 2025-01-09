import comfy.sd

from rpc import RPC

TYPE_MAP = {
    "stable_cascade": comfy.sd.CLIPType.STABLE_CASCADE,
    "sd3": comfy.sd.CLIPType.SD3,
    "stable_audio": comfy.sd.CLIPType.STABLE_AUDIO,
    "flux1": comfy.sd.CLIPType.FLUX,
    "hunyuan_video": comfy.sd.CLIPType.HUNYUAN_VIDEO,
}

class CLIPNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(paths, type, embeddings_path=None):
        clip_type = TYPE_MAP[type] if type in TYPE_MAP else comfy.sd.CLIPType.STABLE_DIFFUSION
        return comfy.sd.load_clip(ckpt_paths=paths, embedding_directory=embeddings_path, clip_type=clip_type)
    
    @RPC.autoref
    @RPC.method("encode")
    def encode(clip, text):
        tokens = clip.tokenize(text)
        cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
        return [[cond, {"pooled_output": pooled}]]
    
    @RPC.autoref
    @RPC.method("set_layer")
    def set_layer(clip, layer):
        if layer == None or layer == 0:
            clip.clip_layer(None)
        else:
            clip.clip_layer(layer)
        
        return clip