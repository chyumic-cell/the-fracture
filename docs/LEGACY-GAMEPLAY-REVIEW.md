# Frontier Command gameplay review

Reviewed the previous game's simulation, formation layout, strategy controller, and fog/formation/strategy-trial test cases. No old art, sprite renderer, terrain textures or UI graphics were copied into The Fracture.

The Fracture keeps its own four-resource economy, twelve civilizations, StarCraft-style building dependencies, setting and rendering pipeline. Historical epochs, seven-resource economy, civilization families, tunnels and siege engineering are not implicitly transplanted.

## Lessons implemented

- Rank units by combat role and assign entire formation rows per role. Rotate local front/depth coordinates with the facing, rather than placing some units on the wrong side at oblique angles.
- Nest all-round protection with front-line units outside and support/siege inside. Face circle slots outward.
- Hold is persistent stance state. Repositioning does not silently convert a defensive line into pursuing troops.
- Keep routine worker traffic fluid. Friendly head-on traffic yields sideways; navigation advances through nearby intermediate waypoints instead of orbiting one point indefinitely.
- Plan through unexplored land without consulting hidden obstacles. Physical contact reveals obstruction and triggers replanning.
- Cache each player's last visible building/navigation state. Destruction or construction out of sight is not exposed immediately.
- Follow vanished enemies only to their last seen position. Scouts do not receive enemy-base coordinates.
- Save control groups and remove dead members on recall. Double-tapping recalls the camera.
- Delay projectile release until the release pose. Charge costs at queue time, reserve population, and refund unused work on cancellation.
- Stage AI forces before assault, keep roles in formation, detach a flanking group on Hard when large enough, and retreat/regroup based on observed local strength and losses.

## Checks adapted

See tests/legacy-gameplay.test.cjs for eleven executable scenarios derived from those lessons. The browser test exercises the real inputs independently of the pure simulation.

The previous game's more elaborate feint/ambush, engineering, transport and naval systems were reviewed as future ideas; they are not represented as implemented here.
