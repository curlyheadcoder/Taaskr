from PIL import Image
import numpy as np
import sys

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Get the background color from the top-left pixel
    data = np.array(img)
    bg_color = data[0, 0]
    
    # Create a mask of pixels that match the background color (with some tolerance)
    tolerance = 30
    
    # Calculate distance from background color
    diff = np.abs(data[:, :, :3].astype(int) - bg_color[:3].astype(int))
    mask = np.sum(diff, axis=-1) < tolerance
    
    # Set alpha to 0 for background pixels
    data[mask, 3] = 0
    
    # Find bounding box of non-transparent pixels to crop
    non_transparent = np.where(data[:, :, 3] > 0)
    if len(non_transparent[0]) > 0:
        min_y, max_y = np.min(non_transparent[0]), np.max(non_transparent[0])
        min_x, max_x = np.min(non_transparent[1]), np.max(non_transparent[1])
        
        # Crop the image
        data = data[min_y:max_y+1, min_x:max_x+1]
        
    out_img = Image.fromarray(data)
    out_img.save(output_path)
    print("Logo processed and saved to", output_path)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_logo.py <input> <output>")
        sys.exit(1)
    process_logo(sys.argv[1], sys.argv[2])
