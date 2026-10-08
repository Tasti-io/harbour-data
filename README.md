# harbour-data

The fictional restaurant group that every [Tasti.io demo](https://demo.tasti.io)
runs on.

Harbour & Co is four rooms around Vancouver: a flagship, a neighbourhood cafe, a
food-hall counter and a suburban room, two of them on the delivery apps. It is
invented on purpose. Putting a real operator's name next to invented numbers on
a public page would be putting words in their mouth.

It lives in one place so that a visitor who opens two demos sees one business,
not two unrelated toys: the cheese on the invoice is the cheese on the pizza is
the pizza on DoorDash.

## What is in it

```
src/group.js        the group, its four sites, suppliers
src/menu.js         one menu with till prices, recipes per serve, packaging, weekly volume
src/ingredients.js  price per kg, litre or each; matches the invoice reader's sample to the cent
src/channels.js     till, three delivery apps, website; the group's own app-price rule
src/staff.js        invented staff, including a director, which matters for BC tip pooling
src/rota.js         the usual weekly staffing and pay
src/index.js        everything in one import
```

Every price is in integer cents. Times are minutes after midnight, Vancouver time.
Commission rates and pricing rules describe this fictional operator, not what any
app charges anyone.

## How the demos use it

The demos deploy from separate repos, so the data is **vendored, not installed**:
a build that has to fetch a second private repo is a build that will one day fail
in front of a prospect.

```bash
node sync.mjs ../demo-price-sync          # write lib/harbour/ into a demo
node sync.mjs ../demo-price-sync --check  # exit 1 if that copy has drifted
```

Each copy carries a `VERSION` file with a hash of these sources, so a demo's own
self-test can tell whether someone edited its copy by hand.

## Check

```bash
npm run check   # consistency checks across menu, recipes, prices and channels
```

No npm dependencies.
