import numpy as np
import csv
import torch
from PIL import Image
import onnx
import onnxruntime as ort

from rpc import RPC

IMAGE_SIZE = 448

def collate_fn_remove_corrupted(batch):
    batch = list(filter(lambda x: x is not None, batch))
    return batch

def preprocess_image(image):
    image = np.array(image)
    image = image[:, :, ::-1]  # RGB->BGR

    # pad to square
    size = max(image.shape[0:2])
    pad_x = size - image.shape[1]
    pad_y = size - image.shape[0]
    pad_l = pad_x // 2
    pad_t = pad_y // 2
    image = np.pad(image, ((pad_t, pad_y - pad_t), (pad_l, pad_x - pad_l), (0, 0)), mode="constant", constant_values=255)

    image = Image.fromarray(image)
    image.thumbnail((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
    return np.array(image).astype(np.float32)

class ImageLoadingPrepDataset(torch.utils.data.Dataset):
    def __init__(self, image_paths):
        self.images = image_paths

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        image_path = str(self.images[idx])

        try:
            image = Image.open(image_path).convert("RGB")
            image = preprocess_image(image)
            tensor = torch.tensor(image)
            return (tensor, image_path)
        except Exception as e:
            # TODO: Display errors.
            return None

class TaggerNamespace:
    @RPC.autoref
    @RPC.method
    def tag(ctx, model_path, images, general_threshold, character_threshold, remove_underscore=True, undesired_tags=[], caption_separator=", ", csv_path=None):
        csv_path = csv_path if csv_path is not None else model_path + '.csv'

        batch_size = 1
        model = onnx.load(model_path)
        input_name = model.graph.input[0].name
        try:
            batch_size = model.graph.input[0].type.tensor_type.shape.dim[0].dim_value
        except:
            batch_size = model.graph.input[0].type.tensor_type.shape.dim[0].dim_param

        del model

        ort_sess = ort.InferenceSession(
            model_path,
            providers=["CUDAExecutionProvider"]
            if "CUDAExecutionProvider" in ort.get_available_providers()
            else ["CPUExecutionProvider"],
        )

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            l = [row for row in reader]
            header = l[0]  # tag_id,name,category,count
            rows = l[1:]
        assert header[0] == "tag_id" and header[1] == "name" and header[2] == "category", f"unexpected csv format: {header}"

        image_paths = images
        general_tags = [row[1] for row in rows[1:] if row[2] == "0"]
        character_tags = [row[1] for row in rows[1:] if row[2] == "4"]

        caption_separator = caption_separator

        result = {}

        def run_batch(path_imgs):
            nonlocal result

            imgs = np.array([im for _, im in path_imgs])

            if len(imgs) < batch_size:
                imgs = np.concatenate([imgs, np.zeros((batch_size - len(imgs), IMAGE_SIZE, IMAGE_SIZE, 3))], axis=0)
            probs = ort_sess.run(None, {input_name: imgs})[0]  # onnx output numpy
            probs = probs[: len(path_imgs)]

            for (image_path, _), prob in zip(path_imgs, probs):
                # # First 4 labels are actually ratings: pick one with argmax
                # ratings_names = label_names[:4]
                # rating_index = ratings_names["probs"].argmax()
                # found_rating = ratings_names[rating_index: rating_index + 1][["name", "probs"]]

                # Everything else is tags: pick any where prediction confidence > threshold
                combined_tags = []
                general_tag_text = ""
                character_tag_text = ""
                for i, p in enumerate(prob[4:]):
                    if i < len(general_tags) and p >= general_threshold:
                        tag_name = general_tags[i]
                        if remove_underscore and len(tag_name) > 3:  # ignore emoji tags like >_< and ^_^
                            tag_name = tag_name.replace("_", " ")

                        if tag_name not in undesired_tags:
                            general_tag_text += caption_separator + tag_name
                            combined_tags.append(tag_name)
                    elif i >= len(general_tags) and p >= character_threshold:
                        tag_name = character_tags[i - len(general_tags)]
                        if remove_underscore and len(tag_name) > 3:
                            tag_name = tag_name.replace("_", " ")

                        if tag_name not in undesired_tags:
                            character_tag_text += caption_separator + tag_name
                            combined_tags.append(tag_name)

                if len(general_tag_text) > 0:
                    general_tag_text = general_tag_text[len(caption_separator) :]
                if len(character_tag_text) > 0:
                    character_tag_text = character_tag_text[len(caption_separator) :]

                result[image_path] = caption_separator.join(combined_tags)
        
        b_imgs = []
        progress = 0
        
        ctx.progress(0, len(image_paths))
        for image_path in image_paths:
            try:
                image = Image.open(image_path)
                if image.mode != "RGB":
                    image = image.convert("RGB")
                
                image = preprocess_image(image)
                b_imgs.append((image_path, image))

                if len(b_imgs) >= batch_size:
                    b_imgs = [(str(image_path), image) for image_path, image in b_imgs]  # Convert image_path to string
                    run_batch(b_imgs)
                    progress += len(b_imgs)
                    ctx.progress(progress, len(image_paths))
                    b_imgs.clear()
            except:
                continue

        if len(b_imgs) > 0:
            b_imgs = [(str(image_path), image) for image_path, image in b_imgs]  # Convert image_path to string
            run_batch(b_imgs)
            progress += len(b_imgs)
            ctx.progress(progress, len(image_paths))

        return result