from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader, random_split
from .transforms import get_train_transforms, get_val_transforms


def build_dataloaders(data_dir: str, batch_size: int = 32, val_split: float = 0.15, test_split: float = 0.15):
    """
    Expects data_dir to follow ImageFolder structure:
        data_dir/
            class_a/  img1.jpg ...
            class_b/  img1.jpg ...
    """
    full_dataset = ImageFolder(root=data_dir, transform=get_train_transforms())
    class_names  = full_dataset.classes

    n_total = len(full_dataset)
    n_val   = int(n_total * val_split)
    n_test  = int(n_total * test_split)
    n_train = n_total - n_val - n_test

    train_ds, val_ds, test_ds = random_split(full_dataset, [n_train, n_val, n_test])

    # Override transforms for val/test (no augmentation)
    val_ds.dataset.transform  = get_val_transforms()
    test_ds.dataset.transform = get_val_transforms()

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  num_workers=4)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, num_workers=4)
    test_loader  = DataLoader(test_ds,  batch_size=batch_size, shuffle=False, num_workers=4)

    return train_loader, val_loader, test_loader, class_names
