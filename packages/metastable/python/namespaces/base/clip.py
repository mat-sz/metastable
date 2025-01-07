import comfy.sd

from rpc import RPC

class CLIPNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(paths, type, embeddings_path=None):
        if type == "stable_cascade":
            clip_type = comfy.sd.CLIPType.STABLE_CASCADE
        elif type == "sd3":
            clip_type = comfy.sd.CLIPType.SD3
        elif type == "stable_audio":
            clip_type = comfy.sd.CLIPType.STABLE_AUDIO
        elif type == "flux1":
            clip_type = comfy.sd.CLIPType.FLUX
        else:
            clip_type = comfy.sd.CLIPType.STABLE_DIFFUSION

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