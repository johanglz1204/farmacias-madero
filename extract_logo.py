from PIL import Image

def flood_fill_transparency(img_path, out_path, tolerance=20):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    visited = set()
    queue = []
    
    # Start flood fill from the 4 corners and the entire top/bottom border
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
        visited.add((x, 0))
        visited.add((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        visited.add((0, y))
        visited.add((width - 1, y))
        
    def color_dist(c1, c2):
        return max(abs(c1[0]-c2[0]), abs(c1[1]-c2[1]), abs(c1[2]-c2[2]))
    
    # Fast BFS queue using list
    idx = 0
    while idx < len(queue):
        x, y = queue[idx]
        idx += 1
        
        curr = pixels[x, y]
        # Make transparent
        pixels[x, y] = (curr[0], curr[1], curr[2], 0)
        
        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    nc = pixels[nx, ny]
                    
                    # We only continue the flood fill if the color is LIGHT (not the dark blue or red)
                    # The text is dark blue (b is high but r,g are low) and red (r is high, g,b low).
                    # Sky is generally light: r > 100, g > 150, b > 200
                    # Let's say if the pixel is relatively light (sum of rgb > 350) and close to its neighbor
                    if sum(nc[:3]) > 300 and color_dist(curr, nc) < tolerance:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    # Second pass: antialiasing edge cleanup for transparency
    # If a pixel is somewhat light but not caught by flood fill, reduce its opacity slightly, but let's keep it simple.
    
    img.save(out_path, "PNG")
    print("Logo extracted successfully!")

flood_fill_transparency("logo-madero.png", "logo-madero-transparent.png", 25)
