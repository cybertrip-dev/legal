PORT ?= 8081
OPEN := $(shell command -v open >/dev/null 2>&1 && echo open || echo xdg-open)

.PHONY: all generate check typecheck preview install clean

all: generate check

install: node_modules

node_modules: package.json
	npm install
	@touch node_modules

typecheck: node_modules
	npx tsc --noEmit

# data/games.json から全ゲームのページを生成
generate: node_modules
	npx esbuild scripts/generate.ts --bundle --platform=node --format=esm --outfile=.tmp-generate.mjs
	node .tmp-generate.mjs
	rm -f .tmp-generate.mjs

# games.json と生成済み HTML の検査
check: node_modules
	npx esbuild scripts/validate.ts --bundle --platform=node --format=esm --outfile=.tmp-validate.mjs
	node .tmp-validate.mjs
	rm -f .tmp-validate.mjs

# 公開後と同じ見た目をローカルで確認する
preview: generate
	@echo ""
	@echo "  http://localhost:$(PORT)"
	@echo ""
	@( sleep 1 && $(OPEN) "http://localhost:$(PORT)" ) &
	npx esbuild --servedir=. --serve=0.0.0.0:$(PORT)

clean:
	rm -rf node_modules .tmp-*.mjs
