from rpc import RPC
import rpc_types

class TrainingNamespace:
    @RPC.autoref
    @RPC.method
    def get_optimizer(diffusion_model: rpc_types.DiffusionModel, text_encoder: rpc_types.TextEncoder) -> rpc_types.Optimizer:
        import prodigyopt
        return prodigyopt.Prodigy(
            params=[
                {
                    "params": diffusion_model.model.parameters(),
                    "lr": 1,
                    "initial_lr": 1,
                },
                {
                    "params": text_encoder.cond_stage_model.clip_l.parameters(),
                    "lr": 1,
                    "initial_lr": 1,
                },
                {
                    "params": text_encoder.cond_stage_model.clip_g.parameters(),
                    "lr": 1,
                    "initial_lr": 1,
                },
            ],
            lr=1,
            betas=(0.9, 0.999),
            beta3=None,
            eps=1e-8,
            weight_decay=0,
            decouple=True,
            use_bias_correction=False,
            safeguard_warmup=False,
            d0=1e-6,
            d_coef=1.0,
            growth_rate=float('inf'),
            fsdp_in_use=False,
            slice_p=1,
        )

    @RPC.autoref
    @RPC.method
    def train(optimizer: rpc_types.Optimizer, diffusion_model: rpc_types.DiffusionModel, text_encoder: rpc_types.TextEncoder, inputs: list[rpc_types.TrainingInput]) -> None:
        diffusion_model.model.train()
        text_encoder.cond_stage_model.clip_l.train()
        text_encoder.cond_stage_model.clip_g.train()


        diffusion_model.model.eval()
        text_encoder.cond_stage_model.clip_l.eval()
        text_encoder.cond_stage_model.clip_g.eval()
