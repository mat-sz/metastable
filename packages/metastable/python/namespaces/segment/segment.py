from rpc import RPC
from .load_model import load_model
import comfy.model_management as mm
import torch
import numpy as np
import random
import os

script_directory = os.path.dirname(os.path.abspath(__file__))

class SegmentNamespace:
    @RPC.autoref
    @RPC.method
    def load(path: str):
        model_mapping = {
            "2.0": {
                "base": "sam2_hiera_b+.yaml",
                "large": "sam2_hiera_l.yaml",
                "small": "sam2_hiera_s.yaml",
                "tiny": "sam2_hiera_t.yaml"
            },
            "2.1": {
                "base": "sam2.1_hiera_b+.yaml",
                "large": "sam2.1_hiera_l.yaml",
                "small": "sam2.1_hiera_s.yaml",
                "tiny": "sam2.1_hiera_t.yaml"
            }
        }
        version = "2.1" if "2.1" in path else "2.0"

        model_cfg_path = next(
            (os.path.join(script_directory, "sam2_configs", cfg) 
            for key, cfg in model_mapping[version].items() if key in path),
            None
        )

        return load_model(path, model_cfg_path, "automaskgenerator", torch.float32, "cpu")

    @RPC.autoref
    @RPC.method
    def segment(model, image):
        offload_device = mm.unet_offload_device()
        device = "cpu"
        dtype = torch.float32
        segmentor = "automaskgenerator"
        
        if segmentor != 'automaskgenerator':
            raise ValueError("Loaded model is not SAM2AutomaticMaskGenerator")
        
        model.predictor.model.to(device)
        
        H, W, C = image.shape
        img_np = (image.contiguous() * 255).byte().numpy()
        
        # autocast_condition = not mm.is_device_mps(device)
        # with torch.autocast(mm.get_autocast_device(device), dtype=dtype) if autocast_condition else nullcontext():
        result_dict = model.generate(img_np)
        mask_list = [item['segmentation'] for item in result_dict]
        bbox_list = [item['bbox'] for item in result_dict]

        # Generate random colors for each mask
        num_masks = len(mask_list)
        colors = [tuple(random.choices(range(256), k=3)) for _ in range(num_masks)]
        
        # Create a blank image to overlay masks
        overlay_image = np.zeros((H, W, 3), dtype=np.uint8)

        # Create a combined mask initialized to zeros
        combined_mask = np.zeros((H, W), dtype=np.uint8)

        # Iterate through masks and color them
        for mask, color in zip(mask_list, colors):
            # Combine masks using logical OR
            combined_mask = np.logical_or(combined_mask, mask).astype(np.uint8)
            
            # Convert mask to numpy array
            mask_np = mask.astype(np.uint8)
            
            # Color the mask
            colored_mask = np.zeros_like(overlay_image)
            for i in range(3):  # Apply color channel-wise
                colored_mask[:, :, i] = mask_np * color[i]
            
            # Blend the colored mask with the overlay image
            overlay_image = np.where(colored_mask > 0, colored_mask, overlay_image)
        
        return (torch.from_numpy(overlay_image).float() / 255.0).cpu()