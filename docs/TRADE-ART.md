# Civilization trade artwork

All twelve markets and all twelve merchants now have dedicated code-authored meshes in `src/trade-art.js`. No generated picture, downloaded texture, or shared recolored market/cart is used. The same meshes run in the battlefield, command portraits, art-review page, background sprite workers and offline launch.

| Civilization | Market | Merchant |
| --- | --- | --- |
| Humans | Freight warehouse, roller doors, loading gantry, pallets, drums and weighing desk | Six-wheel delivery truck with cab, glass, grille, lamps and strapped freight |
| Reptilians | Stepped counting court, scaled bronze roof, imperial pillars and balance scales | Caravan keeper leading a four-legged pack reptile with panniers |
| Machines | Storage towers, conveyor, robotic sorting arms, status lights and conduits | Hovering freight automaton with red optics, cargo modules, grippers and trailing cables |
| Colony Insects | Resin trading chambers, ribbed openings and amber cargo pods | Six-legged cargo beetle with mandibles, antennae and bound supplies |
| Primates | Open barter terraces, woven shade, hanging baskets, produce and weighing table | Broad gorilla porter with a woven frame pack, jars and rolled supplies |
| Wizards | Auction rotunda, pointed tower, suspended arcane focus and scroll counters | Robed mage guiding levitating luggage with crystals and scrolls |
| Elder Races | Carved guild hall, copper-green roof and woodland barrel stalls | Bearded dwarf pulling a barrel-and-chest handcart |
| Mythological Peoples | Marble stoa, terracotta roof, colonnade, fountain and amphorae | Horned satyr pulling an amphora wagon |
| Draconic Civilization | Stepped basalt vault, horned towers, treasure piles and jewel scales | Kobold keeper pulling a gold-and-crystal treasure sled |
| Night Kingdom | Gothic exchange house, tall slate roofs, lanterns and covered counters | Hooded traveler with a covered gothic carriage and lantern |
| Infernal Empire | Furnace towers, iron crossbeam, chain-suspended weighing pans and glowing grates | Horned imp pulling an iron furnace cart |
| Symbiotes | Fibrous living towers, connecting filaments and nutrient exchange pods | Tendril carrier with a raised sensory head and bound nutrient bulbs |

Player colors occupy small physical bands/signs while faction materials stay intact. All trade prices, movement rules, routes, market requirements and earnings remain unchanged.

## Checked

- Twelve different market silhouettes and twelve different merchant silhouettes, compared independently of their colors.
- 576 walking poses: twelve merchants, eight directions and six frame positions. No clipped or empty sprites; player markings remain present. Wheel symmetry repeats one Human frame, while all merchants have at least five distinct walking frames.
- Pixel parity between direct and background rendering for all twelve merchant models, including recoloring.
- Offline rendering for all twelve markets and merchants.
- Art-review trading filter and enlarged previews for every civilization. Detailed inspection crops transparent canvas margins; battlefield-size mode retains actual game scale.
- Normal browser gameplay and offline launch checks.

Review images: `trade-civilizations-review.png`, `merchant-directions-review.png` and `trade-art-page.png`. These are screenshots of the code-rendered models, not new campaign illustrations. Campaign illustrations remain paused.
