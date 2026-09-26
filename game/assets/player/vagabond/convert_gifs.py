from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent.parent
OUTPUT = BASE / "vagabond-png"

OUTPUT.mkdir(exist_ok=True)

gif_files = list(BASE.glob("vagabond-*.gif"))

if not gif_files:
    print("Nema Vagabond GIF fajlova u:", BASE)
    input("Pritisni Enter za izlaz...")
    raise SystemExit

for gif_path in gif_files:
    name = gif_path.stem

    out_dir = OUTPUT / name
    out_dir.mkdir(exist_ok=True)

    print(f"\nObradujem: {gif_path.name}")

    with Image.open(gif_path) as gif:
        frame_count = getattr(gif, "n_frames", 1)

        for frame in range(frame_count):
            gif.seek(frame)

            image = gif.convert("RGBA")

            output_file = out_dir / f"{name}_{frame:03d}.png"
            image.save(output_file, "PNG")

        print(f"  -> {frame_count} frameova")

print("\n================================")
print("GOTOVO!")
print("================================")
print(f"PNG frameovi su u: {OUTPUT}")

input("\nPritisni Enter za izlaz...")