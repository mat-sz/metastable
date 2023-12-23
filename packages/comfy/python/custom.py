import torch

def turbo_get_sigmas(model, steps, denoise):
    start_step = 10 - int(10 * denoise)
    timesteps = torch.flip(torch.arange(1, 11) * 100 - 1, (0,))[start_step:start_step + steps]
    sigmas = model.model.model_sampling.sigma(timesteps)
    sigmas = torch.cat([sigmas, sigmas.new_zeros([1])])
    return sigmas

custom_schedulers = {
    "turbo": turbo_get_sigmas
}

def get_custom_schedulers():
    global custom_schedulers
    return custom_schedulers