### dc6png

batch convert diablo 2 dc6 format to png

#### Install

```
npm install -g dschu012/dc6png
```

#### Usage

```
dc6png 
Options:
  --version              Show version number                           [boolean]
  -p, --palette          color palette. example: (/global/palette/ACT1/pal.dat)
                                                                      [required]
  -t, --transform        transform file. example: (invgreybrown.dat)
  -c, --transform-color  transform color. (0-20)                        [number]
  -d, --dir              directory to process                            [array]
  -o, --out              output directory (must exist if specified)
  -f, --file             file to process                                 [array]
  -v, --verbose                                                          [count]
  -h, --help             Show help                                     [boolean]
```

Examples

Directory
```
dc6png -p ~/diablo/data/global/palette/ACT1/pal.dat \
  -d ~/diablo/data/global/items \
  -o ./png
```

Multiple files
```
dc6png -p ~/diablo/data/global/palette/ACT1/pal.dat  \
  -f ~/diablo/data/global/items/invcap.DC6 \
  -f ~/diablo/data/global/items/invrng.DC6 \
  -vv
```

Transform color cgrn (shako)
```
 dc6png -p ~/diablo/data/global/palette/ACT1/pal.dat \
  -t ~/diablo/data/global/items/Palette/invgreybrown.dat \
  -c 12 \
  -f ~/diablo/data/global/items/invcap.DC6 \
  -o . \
  -vv
 ```

#### Credits

Nearly all knowledge from phrozen keep posts and Paul Siramy's dc6 tool
https://d2mods.info/forum/viewtopic.php?p=467305#p467305
https://d2mods.info/forum/kb/viewarticle?a=57
