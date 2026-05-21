# Datasets — Pretrained-weight Class Lists

Datasets that Ultralytics ships pretrained weights against. The class lists below drive the `class_picker` UI for each pretrained model.

---

## COCO (80-class detection / segmentation)

- **Used by:** YOLOv3, YOLOv5, YOLOv6, YOLOv7, YOLOv8 (detect/seg), YOLOv9, YOLOv10, YOLO11 (detect/seg), YOLO12, YOLO26, YOLO-NAS, RT-DETR (initial weights from YOLO-World/E are LVIS-based).
- **Image count:** 118k train / 5k val (COCO 2017 split).
- **Paper:** Lin et al. — *Microsoft COCO: Common Objects in Context* (arXiv:1405.0312).
- **License:** CC BY 4.0 (annotations); image licenses vary (Flickr).
- **Source:** https://cocodataset.org

### COCO 80-class list (id → name)

```
 0 person          1 bicycle         2 car             3 motorcycle      4 airplane
 5 bus             6 train           7 truck           8 boat            9 traffic light
10 fire hydrant   11 stop sign      12 parking meter  13 bench          14 bird
15 cat            16 dog            17 horse          18 sheep          19 cow
20 elephant       21 bear           22 zebra          23 giraffe        24 backpack
25 umbrella       26 handbag        27 tie            28 suitcase       29 frisbee
30 skis           31 snowboard      32 sports ball    33 kite           34 baseball bat
35 baseball glove 36 skateboard     37 surfboard      38 tennis racket  39 bottle
40 wine glass     41 cup            42 fork           43 knife          44 spoon
45 bowl           46 banana         47 apple          48 sandwich       49 orange
50 broccoli       51 carrot         52 hot dog        53 pizza          54 donut
55 cake           56 chair          57 couch          58 potted plant   59 bed
60 dining table   61 toilet         62 tv             63 laptop         64 mouse
65 remote         66 keyboard       67 cell phone     68 microwave      69 oven
70 toaster        71 sink           72 refrigerator   73 book           74 clock
75 vase           76 scissors       77 teddy bear     78 hair drier     79 toothbrush
```

> COCO uses contiguous indices 0–79. The original COCO JSON uses non-contiguous category IDs 1–90; YOLO maps them down to 0–79 in this order.

---

## COCO-pose (keypoints)

- **Used by:** YOLOv8-pose, YOLO11-pose, YOLO26-pose.
- **Single class:** `person` (index 0).
- **17 keypoints per person** (COCO format):

| idx | name           |
|----:|----------------|
| 0   | nose           |
| 1   | left_eye       |
| 2   | right_eye      |
| 3   | left_ear       |
| 4   | right_ear      |
| 5   | left_shoulder  |
| 6   | right_shoulder |
| 7   | left_elbow     |
| 8   | right_elbow    |
| 9   | left_wrist     |
| 10  | right_wrist    |
| 11  | left_hip       |
| 12  | right_hip      |
| 13  | left_knee      |
| 14  | right_knee     |
| 15  | left_ankle     |
| 16  | right_ankle    |

### Skeleton (edges between keypoint indices, 1-based as published by COCO; 0-based here):

```
( 15, 13) ( 13, 11) ( 16, 14) ( 14, 12) ( 11, 12)
(  5, 11) (  6, 12) (  5,  6) (  5,  7) (  6,  8)
(  7,  9) (  8, 10) (  1,  2) (  0,  1) (  0,  2)
(  1,  3) (  2,  4) (  3,  5) (  4,  6)
```

- **Source:** https://cocodataset.org/#keypoints-2017

---

## DOTAv1 (oriented bounding boxes, 15 classes)

- **Used by:** YOLOv8-obb, YOLO11-obb, YOLO26-obb.
- **Image count:** 2806 aerial images, 188k instances.
- **Paper:** Ding et al. — *Object Detection in Aerial Images: A Large-Scale Benchmark and Challenges* (IEEE TPAMI 2021, DOI 10.1109/TPAMI.2021.3117983).
- **License:** Academic use only; commercial use prohibited.
- **Source:** https://captain-whu.github.io/DOTA/

### DOTAv1 class list

```
 0 plane
 1 ship
 2 storage tank
 3 baseball diamond
 4 tennis court
 5 basketball court
 6 ground track field
 7 harbor
 8 bridge
 9 large vehicle
10 small vehicle
11 helicopter
12 roundabout
13 soccer ball field
14 swimming pool
```

DOTAv2 extends this to 18 classes by adding `airport` and `helipad` (plus expanded imagery). Ultralytics' OBB checkpoints target v1.

---

## ImageNet-1k (classification, 1000 classes)

- **Used by:** YOLOv5-cls (original repo), YOLOv8-cls, YOLO11-cls, YOLO26-cls.
- **Image count:** 1.28M train / 50k val.
- **License:** ImageNet terms; non-commercial research only.
- **Source:** https://www.image-net.org/

The full 1000-class list is too long to embed here. Representative first 50 wnid → name pairs:

```
n01440764 tench
n01443537 goldfish
n01484850 great white shark
n01491361 tiger shark
n01494475 hammerhead shark
n01496331 electric ray
n01498041 stingray
n01514668 cock
n01514859 hen
n01518878 ostrich
n01530575 brambling
n01531178 goldfinch
n01532829 house finch
n01534433 junco
n01537544 indigo bunting
n01558993 robin
n01560419 bulbul
n01580077 jay
n01582220 magpie
n01592084 chickadee
n01601694 water ouzel
n01608432 kite
n01614925 bald eagle
n01616318 vulture
n01622779 great grey owl
n01629819 European fire salamander
n01630670 common newt
n01631663 eft
n01632458 spotted salamander
n01632777 axolotl
n01641577 bullfrog
n01644373 tree frog
n01644900 tailed frog
n01664065 loggerhead
n01665541 leatherback turtle
n01667114 mud turtle
n01667778 terrapin
n01669191 box turtle
n01675722 banded gecko
n01677366 common iguana
n01682714 American chameleon
n01685808 whiptail
n01687978 agama
n01688243 frilled lizard
n01689811 alligator lizard
n01692333 Gila monster
n01693334 green lizard
n01694178 African chameleon
n01695060 Komodo dragon
n01697457 African crocodile
n01698640 American alligator
```

Full list:
- https://gist.github.com/yrevar/942d3a0ac09ec9e5eb3a (synset → human-readable mapping)
- `imagenet_classes.txt` shipped with PyTorch/timm

---

## Objects365 (365-class detection)

- **Used by:** YOLO-NAS (pretraining), YOLO-World (training).
- **Image count:** 600k train.
- **License:** Free for academic use.
- **Source:** https://www.objects365.org/

365 classes covering everyday objects, vehicles, animals, food etc. Full list available in the dataset YAML shipped with Ultralytics.

---

## Open Images V7 (~600 classes)

- **Used by:** YOLOv8 (optional pretraining via `yolov8*-oiv7.pt`).
- **Image count:** 1.7M train / 42k val.
- **License:** CC BY 4.0 annotations; images CC BY 2.0 from Flickr.
- **Source:** https://storage.googleapis.com/openimages/web/index.html

Approx 601 bounding-box classes. Ultralytics ships `yolov8n-oiv7.pt` … `yolov8x-oiv7.pt`.

---

## Argoverse-HD (autonomous driving)

- **Class count:** 8 (person, bicycle, car, motorcycle, bus, truck, traffic_light, stop_sign).
- **Use:** dataset for training; no Ultralytics-released pretrained weights at the family level.
- **License:** CC BY-NC-SA 4.0.
- **Source:** https://www.argoverse.org/

---

## VisDrone2019-DET (drone imagery, 10 classes)

- **Classes:** pedestrian, people, bicycle, car, van, truck, tricycle, awning-tricycle, bus, motor.
- **Use:** dataset YAML in Ultralytics; train from scratch.
- **License:** Research-only.
- **Source:** http://aiskyeye.com/

---

## xView (overhead imagery, 60 classes)

- **Class count:** 60 (vehicles, vessels, aircraft, buildings, …).
- **License:** xView dataset license (research / non-commercial).
- **Source:** http://xviewdataset.org/

---

## GlobalWheat2020 (single class)

- **Single class:** `wheat_head`.
- **License:** MIT.
- **Source:** https://www.global-wheat.com/

---

## LVIS (long-tail, 1203 classes)

- **Used by:** YOLO-World, YOLOE (zero-shot evaluation).
- **License:** CC BY 4.0.
- **Source:** https://www.lvisdataset.org/

---

## SA-1B and SA-V

- **SA-1B** — 1B+ masks across 11M images. Used to train **SAM v1**.
- **SA-V** — 51k+ videos, 600k+ masklets. Used to train **SAM 2**.
- **License:** Apache-2.0 (annotations under research license).
- **Source:** https://ai.meta.com/datasets/segment-anything/

## Sources
- https://docs.ultralytics.com/datasets/
- https://docs.ultralytics.com/datasets/detect/coco/
- https://docs.ultralytics.com/datasets/pose/coco/
- https://docs.ultralytics.com/datasets/obb/dota-v2/
- https://docs.ultralytics.com/datasets/classify/imagenet/
