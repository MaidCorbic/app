from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
INPUT = BASE / "2x"
OUTPUT = BASE / "png"

OUTPUT.mkdir(exist_ok=True)

gif_files = list(INPUT.glob("*.gif"))

if not gif_files:
    print("Nema GIF fajlova u:", INPUT)
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
            image.save(
                out_dir / f"{name}_{frame:03d}.png",
                "PNG"
            )

        print(f"  -> {frame_count} frameova")

print("\nGOTOVO!")
print("PNG frameovi su u:", OUTPUT)

input("\nPritisni Enter za izlaz...")