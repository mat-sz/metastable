def enable_zluda():
    print("Using ZLUDA...")

    from .loader import load
    load()
    
    from .zluda import initialize_zluda
    initialize_zluda()