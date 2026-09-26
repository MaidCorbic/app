from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent.parent
INPUT = BASE / "vagabond-png"
OUTPUT = BASE / "vagabond-final"

OUTPUT.mkdir(exist_ok=True)

for folder in INPUT.iterdir():
    if not folder.is_dir():
        continue

    out_dir = OUTPUT / folder.name
    out_dir.mkdir(exist_ok=True)

    frame_index = 0

    for png in sorted(folder.glob("*.png")):
        with Image.open(png) as image:
            width, height = image.size

            if (width, height) == (128, 128):
                image.save(
                    out_dir / f"{folder.name}_{frame_index:03d}.png",
                    "PNG"
                )
                frame_index += 1

            elif (width, height) == (256, 128):
                left = image.crop((0, 0, 128, 128))
                right = image.crop((128, 0, 256, 128))

                left.save(
                    out_dir / f"{folder.name}_{frame_index:03d}.png",
                    "PNG"
                )
                frame_index += 1

                right.save(
                    out_dir / f"{folder.name}_{frame_index:03d}.png",
                    "PNG"
                )
                frame_index += 1

            else:
                print(
                    f"Preskačem nepoznatu dimenziju: "
                    f"{png} -> {image.size}"
                )

    print(f"{folder.name}: {frame_index} frameova")

print("\n================================")
print("GOTOVO!")
print("================================")
print(f"Finalni frameovi: {OUTPUT}")

input("\nPritisni Enter za izlaz...")