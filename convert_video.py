import imageio

input_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\brain\bbb82f57-2e8d-4271-8fa7-ca731531a256\grantmatch_kaggle_demo_1782203844311.webp"
output_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\brain\bbb82f57-2e8d-4271-8fa7-ca731531a256\grantmatch_kaggle_demo.mp4"

print(f"Reading {input_path}...")
reader = imageio.get_reader(input_path)
meta = reader.get_meta_data()
fps = meta.get('fps', 10)
if fps <= 0:
    fps = 10

print(f"Writing to {output_path} at {fps} fps...")
writer = imageio.get_writer(output_path, fps=fps)

for i, frame in enumerate(reader):
    writer.append_data(frame)

writer.close()
print("Conversion complete!")
