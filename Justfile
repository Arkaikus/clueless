set shell := ["fish", "-lc"]

default:
	just dev

dev:
	cd clueless && bun run dev

build:
	cd clueless && bun run build

lint:
	cd clueless && bun run lint

preview:
	cd clueless && bun run preview

deploy:
	cd clueless && bun run deploy