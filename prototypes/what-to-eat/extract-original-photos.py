#!/usr/bin/env python3
"""Extract selected original photographs from the Boudie Eats retained source."""
import io,json,pathlib,re,tarfile,shutil
from PIL import Image,ImageOps
root=pathlib.Path("prototypes/what-to-eat/assets");root.mkdir(parents=True,exist_ok=True)
patterns=["shaareya","sha3reya","shaariya","she3reya","vermicelli","milk","شعر","tabali","cilantro","latte","coffee","flat","la-mie","yokal","foul","food","recipe","restaurant"]
with tarfile.open("boudieeats-source.tar.gz") as tar:
  files=[x for x in tar.getmembers() if x.isfile() and pathlib.PurePosixPath(x.name).suffix.lower() in (".jpg",".jpeg",".png",".webp",".avif") and x.size>9000 and "node_modules" not in x.name and "logo" not in x.name.lower() and "icon" not in x.name.lower()]
  print("Total image assets:",len(files))
  print("First 60:",[(x.name,x.size) for x in files[:60]])
  def score(x):
    n=x.name.lower()
    return max([140-7*i for i,k in enumerate(patterns) if k in n],default=0)+(40 if "assets/" in n or "images/" in n else 0)
  files.sort(key=lambda x:(-score(x),x.name))
  selected=[];seen=set()
  for x in files:
    if len(selected)>=24:break
    try:
      img=ImageOps.exif_transpose(Image.open(io.BytesIO(tar.extractfile(x).read())))
      if min(img.size)<280:continue
      img.thumbnail((1400,1100));rgb=img.convert("RGB")
      key=rgb.resize((20,20)).tobytes()
      if key in seen:continue
      seen.add(key);name="photo-%02d.jpg"%(len(selected)+1)
      rgb.save(root/name,quality=83,optimize=True,progressive=True)
      selected.append({"file":name,"source":x.name,"width":img.width,"height":img.height,"score":score(x)})
    except Exception as e:print("Skipped",x.name,repr(e))
  hero=next((r for r in selected if re.search("shaareya|sha3reya|shaariya|she3reya|vermicelli|milk|شعر",r["source"],re.I)),selected[0] if selected else None)
  if hero:shutil.copyfile(root/hero["file"],root/"hero.jpg")
  (root/"manifest.json").write_text(json.dumps({"count":len(selected),"hero":hero,"images":selected},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print("Selected images:",json.dumps(selected[:24],ensure_ascii=False))
  assert len(selected)>=3,"Not enough real site photos in archive"
