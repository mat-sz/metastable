from rpc import RPC

class CLIPNamespace:
    @RPC.autoref
    @RPC.method("encode")
    def encode(clip, text):
        tokens = clip.tokenize(text)
        cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
        return [[cond, {"pooled_output": pooled}]]