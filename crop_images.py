
import sys
# Try to import PIL, if not available use standard raw read if possible, but unlikely.
try:
    from PIL import Image
    
    # Open image
    img = Image.open("images/005.png")
    width, height = img.size
    
    # Calculate half dimensions
    half_w = width // 2
    half_h = height // 2
    
    # Crop Quadrants
    # Top-Left (Pore)
    pore = img.crop((0, 0, half_w, half_h))
    pore.save("images/res_pore.png")
    
    # Top-Right (Texture)
    texture = img.crop((half_w, 0, width, half_h))
    texture.save("images/res_texture.png")
    
    # Bottom-Left (Hydration)
    moist = img.crop((0, half_h, half_w, height))
    moist.save("images/res_moist.png")
    
    # Bottom-Right (Calming)
    calm = img.crop((half_w, half_h, width, height))
    calm.save("images/res_calm.png")
    
    print("Successfully cropped 4 images")
    
except ImportError:
    print("PIL not found")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
