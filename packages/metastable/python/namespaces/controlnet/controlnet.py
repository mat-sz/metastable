import comfy.controlnet

from rpc import RPC

class ControlnetNamespace:
    @RPC.autoref
    @RPC.method("load")
    def load(path):
        return comfy.controlnet.load_controlnet(path)
    
    @RPC.autoref
    @RPC.method("apply")
    def apply(controlnet, positive, negative, image, strength):
        # TODO: Refactor when types are added.
        image = image.unsqueeze(0)
        
        start_percent = 0.0
        end_percent = 1.0

        if strength == 0:
            return (positive, negative)

        control_hint = image.movedim(-1,-3)
        cnets = {}

        def apply_to_conditioning(conditioning):
            c = []
            for t in conditioning:
                d = t[1].copy()

                prev_cnet = d.get('control', None)
                if prev_cnet in cnets:
                    c_net = cnets[prev_cnet]
                else:
                    c_net = controlnet.copy().set_cond_hint(control_hint, strength, (start_percent, end_percent))
                    c_net.set_previous_controlnet(prev_cnet)
                    cnets[prev_cnet] = c_net

                d['control'] = c_net
                d['control_apply_to_uncond'] = False
                n = [t[0], d]
                c.append(n)

            return c

        return {
            "positive": apply_to_conditioning(positive),
            "negative": apply_to_conditioning(positive)
        }