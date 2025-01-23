import comfy.sd

from rpc import RPC
import rpc_types

TYPE_MAP = {
    "stable_cascade": comfy.sd.CLIPType.STABLE_CASCADE,
    "sd3": comfy.sd.CLIPType.SD3,
    "stable_audio": comfy.sd.CLIPType.STABLE_AUDIO,
    "flux1": comfy.sd.CLIPType.FLUX,
    "hunyuan_video": comfy.sd.CLIPType.HUNYUAN_VIDEO,
}

class TextEncoderNamespace:
    @RPC.autoref
    @RPC.method
    def load(paths: list[str], type: str, embeddings_path: str = None) -> rpc_types.TextEncoder:
        text_encoder_type = TYPE_MAP[type] if type in TYPE_MAP else comfy.sd.CLIPType.STABLE_DIFFUSION

        if any(path.endswith('.gguf') for path in paths):
            try:
                from .utils.gguf import load_text_encoder
                return load_text_encoder(paths, text_encoder_type, embeddings_path)
            except ImportError as e:
                raise ValueError(f"Missing GGUF support.")
        
        return comfy.sd.load_clip(ckpt_paths=paths, embedding_directory=embeddings_path, clip_type=text_encoder_type)
    
    @RPC.autoref
    @RPC.method
    def encode(text_encoder: rpc_types.TextEncoder, text: str) -> rpc_types.Conditioning:
        tokens = text_encoder.tokenize(text)
        cond, pooled = text_encoder.encode_from_tokens(tokens, return_pooled=True)
        return [[cond, {"pooled_output": pooled}]]
    
    @RPC.autoref
    @RPC.method
    def set_layer(text_encoder: rpc_types.TextEncoder, layer: int) -> rpc_types.TextEncoder:
        if layer == None or layer == 0:
            text_encoder.clip_layer(None)
        else:
            text_encoder.clip_layer(layer)
        
        return text_encoder