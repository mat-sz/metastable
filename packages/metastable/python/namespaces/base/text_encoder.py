import comfy.sd

from rpc import RPC

TYPE_MAP = {
    "stable_cascade": comfy.sd.CLIPType.STABLE_CASCADE,
    "sd3": comfy.sd.CLIPType.SD3,
    "stable_audio": comfy.sd.CLIPType.STABLE_AUDIO,
    "flux1": comfy.sd.CLIPType.FLUX,
    "hunyuan_video": comfy.sd.CLIPType.HUNYUAN_VIDEO,
}

class TextEncoderNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(paths, type, embeddings_path=None):
        text_encoder_type = TYPE_MAP[type] if type in TYPE_MAP else comfy.sd.CLIPType.STABLE_DIFFUSION
        return comfy.sd.load_clip(ckpt_paths=paths, embedding_directory=embeddings_path, clip_type=text_encoder_type)
    
    @RPC.autoref
    @RPC.method("encode")
    def encode(text_encoder, text):
        tokens = text_encoder.tokenize(text)
        cond, pooled = text_encoder.encode_from_tokens(tokens, return_pooled=True)
        return [[cond, {"pooled_output": pooled}]]
    
    @RPC.autoref
    @RPC.method("set_layer")
    def set_layer(text_encoder, layer):
        if layer == None or layer == 0:
            text_encoder.clip_layer(None)
        else:
            text_encoder.clip_layer(layer)
        
        return text_encoder